import os
import time
import requests
import fitz

from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.bis import BISStandard, BISChunk


CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200

DOWNLOAD_TIMEOUT = 60
MAX_RETRIES = 3

DOCUMENT_DIR = settings.BIS_DOCUMENT_DIR


def chunk_text(text: str):
    text = text.strip()

    if not text:
        return []

    chunks = []

    start = 0
    text_length = len(text)

    while start < text_length:
        end = min(start + CHUNK_SIZE, text_length)

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= text_length:
            break

        start = end - CHUNK_OVERLAP

    return chunks


def download_pdf(url: str, output_path: str):
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(f"Downloading PDF (attempt {attempt}): {url}")

            response = requests.get(
                url,
                timeout=DOWNLOAD_TIMEOUT,
                headers={
                    "User-Agent": "Mozilla/5.0"
                }
            )

            response.raise_for_status()

            content_type = response.headers.get("content-type", "").lower()

            if "text/html" in content_type:
                raise ValueError("URL returned HTML instead of a PDF")

            with open(output_path, "wb") as file:
                file.write(response.content)

            return True

        except Exception as error:
            print(f"Download failed: {error}")

            if attempt < MAX_RETRIES:
                time.sleep(2 * attempt)

    return False


def extract_pdf_chunks(pdf_path: str):
    chunks_with_pages = []

    document = fitz.open(pdf_path)

    for page_index, page in enumerate(document):
        page_number = page_index + 1

        text = page.get_text("text")

        if not text.strip():
            continue

        page_chunks = chunk_text(text)

        for chunk in page_chunks:
            chunks_with_pages.append(
                {
                    "content": chunk,
                    "page_number": page_number,
                }
            )

    document.close()

    return chunks_with_pages


def standard_already_ingested(db, standard_id: int):
    result = db.scalar(
        select(BISChunk.id)
        .where(BISChunk.standard_id == standard_id)
        .limit(1)
    )

    return result is not None


def ingest_standard(db, standard):
    if standard_already_ingested(db, standard.id):
        return "skipped"

    if not standard.pdf_url:
        return "no_url"

    os.makedirs(DOCUMENT_DIR, exist_ok=True)

    pdf_path = os.path.join(
        DOCUMENT_DIR,
        f"{standard.document_id}.pdf"
    )

    # Download PDF if it does not already exist
    if not os.path.exists(pdf_path):
        success = download_pdf(
            standard.pdf_url,
            pdf_path
        )

        if not success:
            return "download_failed"

    try:
        chunks = extract_pdf_chunks(pdf_path)

        if not chunks:
            return "no_text"

        for index, chunk_data in enumerate(chunks):
            chunk = BISChunk(
                standard_id=standard.id,
                chunk_index=index,
                content=chunk_data["content"],
                page_number=chunk_data["page_number"],
            )

            db.add(chunk)

        db.commit()

        return f"ingested:{len(chunks)}"

    except Exception as error:
        db.rollback()

        print(
            f"Extraction failed for "
            f"{standard.document_id}: {error}"
        )

        return "extraction_failed"


def ingest_all_documents():
    db = SessionLocal()

    processed = 0
    skipped = 0
    no_url = 0
    download_failed = 0
    no_text = 0
    extraction_failed = 0
    total_chunks = 0

    try:
        standards = db.scalars(
            select(BISStandard)
            .order_by(BISStandard.id)
        ).yield_per(100)

        for standard in standards:

            result = ingest_standard(
                db,
                standard
            )

            processed += 1

            if result == "skipped":
                skipped += 1

            elif result == "no_url":
                no_url += 1

            elif result == "download_failed":
                download_failed += 1

            elif result == "no_text":
                no_text += 1

            elif result == "extraction_failed":
                extraction_failed += 1

            elif result.startswith("ingested:"):
                count = int(
                    result.split(":")[1]
                )

                total_chunks += count

            if processed % 50 == 0:
                print("\n--------------------------------")
                print(
                    f"Standards processed: {processed}"
                )
                print(
                    f"New chunks: {total_chunks}"
                )
                print(
                    f"Skipped: {skipped}"
                )
                print(
                    f"Download failed: {download_failed}"
                )
                print(
                    f"No text: {no_text}"
                )
                print(
                    f"Extraction failed: {extraction_failed}"
                )
                print("--------------------------------\n")

        print("\n================================")
        print("FULL PDF INGESTION COMPLETE")
        print("================================")
        print(
            f"Standards processed: {processed}"
        )
        print(
            f"New chunks: {total_chunks}"
        )
        print(
            f"Skipped: {skipped}"
        )
        print(
            f"No PDF URL: {no_url}"
        )
        print(
            f"Download failed: {download_failed}"
        )
        print(
            f"No text: {no_text}"
        )
        print(
            f"Extraction failed: {extraction_failed}"
        )
        print("================================")

    finally:
        db.close()


if __name__ == "__main__":
    ingest_all_documents()