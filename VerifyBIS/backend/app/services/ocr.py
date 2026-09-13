"""Tesseract OCR, used as a fallback for pages with no usable text layer.

OCR is deliberately never the default path: reading an embedded text layer
costs milliseconds, while rasterising and recognising a page costs seconds.
Pages that already carry text never reach this module, so text-layer PDFs keep
exactly the speed they had before OCR existed. Only scanned pages — and
uploaded images, which have no text layer at all — pay the cost.
"""

import io
import os
import shutil
from concurrent.futures import ThreadPoolExecutor

from app.core.config import settings

# Tesseract parallelises internally via OpenMP, which competes with the page
# level thread pool below and measurably slows the whole batch down. Holding
# each invocation to one thread lets the pool own the parallelism instead.
os.environ.setdefault("OMP_THREAD_LIMIT", "1")


_availability_checked = False
_available = False


def ocr_available() -> bool:
    """Whether OCR can run. Resolved once, then cached."""
    global _availability_checked, _available

    if _availability_checked:
        return _available

    _availability_checked = True
    _available = False

    if not settings.OCR_ENABLED:
        return False

    try:
        import pytesseract
    except ImportError:
        print("[OCR] pytesseract is not installed; OCR fallback disabled.")
        return False

    binary = settings.OCR_TESSERACT_CMD or shutil.which("tesseract")

    if not binary:
        print("[OCR] tesseract binary not found on PATH; OCR fallback disabled.")
        return False

    if settings.OCR_TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = settings.OCR_TESSERACT_CMD

    _available = True
    return True


def needs_ocr(text: str) -> bool:
    """True when a page's text layer is too thin to be real content.

    Scanned pages often still carry a few characters — a stamped page number
    or a header — so an empty-string check alone would miss them.
    """
    return len(text.strip()) < settings.OCR_MIN_CHARS


def _recognise(image_bytes: bytes) -> str:
    import pytesseract
    from PIL import Image

    with Image.open(io.BytesIO(image_bytes)) as image:
        return pytesseract.image_to_string(
            image,
            lang=settings.OCR_LANGUAGE,
            config=f"--oem 3 --psm {settings.OCR_PSM}",
        )


def ocr_image_bytes(image_bytes: bytes) -> str:
    """Recognise a standalone image (an uploaded PNG/JPEG/TIFF)."""
    if not ocr_available():
        return ""

    try:
        return _recognise(image_bytes).strip()
    except Exception as error:
        print(f"[OCR] image recognition failed: {error}", flush=True)
        return ""


def ocr_pdf_pages(document, page_numbers) -> dict:
    """OCR the given 1-based pages of an open PyMuPDF document.

    Returns {page_number: text} for pages that produced text. Rendering happens
    on this thread because a PyMuPDF document is not thread-safe; only the
    recognition — which shells out to the tesseract binary and so releases the
    GIL — is parallelised.
    """
    if not ocr_available():
        return {}

    targets = list(page_numbers)

    if not targets:
        return {}

    skipped = 0

    if len(targets) > settings.OCR_MAX_PAGES:
        skipped = len(targets) - settings.OCR_MAX_PAGES
        targets = targets[: settings.OCR_MAX_PAGES]

    import fitz

    workers = max(1, settings.OCR_MAX_WORKERS)
    results = {}

    print(
        f"[OCR] {len(targets)} page(s) without a text layer; "
        f"running OCR at {settings.OCR_DPI} DPI on {workers} worker(s).",
        flush=True,
    )

    # Rendered pages are held in memory, so work through them in batches rather
    # than rasterising the whole document up front.
    batch_size = workers * 2

    with ThreadPoolExecutor(max_workers=workers) as pool:
        for start in range(0, len(targets), batch_size):
            batch = targets[start : start + batch_size]
            rendered = []

            for page_number in batch:
                try:
                    page = document[page_number - 1]
                    pixmap = page.get_pixmap(
                        dpi=settings.OCR_DPI,
                        colorspace=fitz.csGRAY,
                    )
                    rendered.append((page_number, pixmap.tobytes("png")))
                except Exception as error:
                    print(
                        f"[OCR] failed to render page {page_number}: {error}",
                        flush=True,
                    )

            for page_number, text in zip(
                (number for number, _ in rendered),
                pool.map(ocr_image_bytes, (data for _, data in rendered)),
            ):
                if text:
                    results[page_number] = text

    print(
        f"[OCR] recovered text from {len(results)}/{len(targets)} page(s).",
        flush=True,
    )

    if skipped:
        print(
            f"[OCR] {skipped} further page(s) skipped: OCR_MAX_PAGES is "
            f"{settings.OCR_MAX_PAGES}.",
            flush=True,
        )

    return results
