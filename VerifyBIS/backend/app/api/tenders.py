from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.tender import TenderAnalysis
from app.services.hybrid_search import hybrid_search


router = APIRouter(
    prefix="/api/tenders",
    tags=["Tenders"],
)


# =========================================================
# REQUEST SCHEMA
# =========================================================

class TenderTextRequest(BaseModel):
    text: str
    name: str | None = None


# =========================================================
# BUILD TENDER ANALYSIS
# =========================================================

def build_tender_analysis(tender_text: str):
    """
    Analyze a tender against relevant BIS standards.

    Uses:
    BM25 + BGE-M3 + RRF

    Important:
    Only a limited amount of tender text is sent to the
    retrieval and LLM pipeline so large PDFs do not cause
    extremely slow requests.
    """

    if not tender_text.strip():
        raise ValueError("Tender text is empty.")

    # -----------------------------------------------------
    # LIMIT SEARCH INPUT
    # -----------------------------------------------------

    search_text = tender_text[:6000]

    print(
        f"[TENDER] Starting hybrid search with "
        f"{len(search_text):,} characters...",
        flush=True,
    )

    results = hybrid_search(
        query=search_text,
        limit=6,
    )

    print(
        f"[TENDER] Hybrid search returned "
        f"{len(results)} results.",
        flush=True,
    )

    if not results:
        return {
            "status": "NEEDS_EVIDENCE",
            "summary": (
                "No sufficiently relevant BIS standards "
                "were found in the indexed knowledge base."
            ),
            "findings": [],
            "sources": [],
        }

    # =====================================================
    # BUILD BIS SOURCE CONTEXT
    # =====================================================

    source_parts = []

    for index, result in enumerate(results, start=1):
        source_parts.append(
            f"""
SOURCE {index}

BIS Number:
{result.get("is_number")}

Document ID:
{result.get("document_id")}

Title:
{result.get("title")}

Year:
{result.get("year")}

Page:
{result.get("page_number")}

Content:
{result.get("content")}
"""
        )

    context = "\n".join(source_parts)

    print(
        f"[TENDER] Context built from {len(results)} BIS sources.",
        flush=True,
    )

    # =====================================================
    # GROQ
    # =====================================================

    from groq import Groq
    from app.core.config import settings

    if not settings.GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY is not configured."
        )

    client = Groq(
        api_key=settings.GROQ_API_KEY
    )

    # -----------------------------------------------------
    # LIMIT TEXT SENT TO GROQ
    # -----------------------------------------------------

    analysis_text = tender_text[:12000]

    prompt = f"""
You are BISQ, an AI system for BIS
standards and tender compliance analysis.

Analyze the tender text against ONLY the supplied
BIS source material.

Do not invent BIS requirements.

Do not assume compliance when evidence is missing.

Return ONLY valid JSON.

Required JSON structure:

{{
  "status": "COMPLIANT | NON_COMPLIANT | NEEDS_EVIDENCE",
  "summary": "short overall assessment",
  "findings": [
    {{
      "requirement": "BIS requirement",
      "assessment": "assessment against tender",
      "evidence": "exact relevant tender evidence or explain that evidence is missing",
      "source": "Source 1",
      "page": 1
    }}
  ]
}}

Rules:

1. Use only the supplied BIS source material.
2. Do not create requirements that are not present.
3. If tender evidence is missing, use NEEDS_EVIDENCE.
4. If evidence clearly conflicts with a BIS requirement,
   mark that finding NON_COMPLIANT.
5. If the tender clearly satisfies the requirement,
   mark that finding COMPLIANT.
6. Keep findings specific.
7. Include the BIS number where useful.
8. Page may be null if unavailable.
9. Do not output Markdown.
10. Return valid JSON only.

TENDER TEXT:

{analysis_text}

BIS SOURCE MATERIAL:

{context}
"""

    print(
        "[TENDER] Sending analysis to Groq...",
        flush=True,
    )

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a careful BIS compliance "
                    "analysis system. Return valid JSON only."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0,
        max_tokens=2500,
    )

    print(
        "[TENDER] Groq response received.",
        flush=True,
    )

    raw_answer = (
        response.choices[0]
        .message.content
        .strip()
    )

    # =====================================================
    # REMOVE MARKDOWN CODE FENCES
    # =====================================================

    if raw_answer.startswith("```"):
        raw_answer = (
            raw_answer
            .replace("```json", "", 1)
            .replace("```", "")
            .strip()
        )

    # =====================================================
    # PARSE JSON
    # =====================================================

    import json

    try:
        analysis = json.loads(raw_answer)

    except json.JSONDecodeError:
        print(
            "[TENDER] Groq returned invalid JSON.",
            flush=True,
        )

        analysis = {
            "status": "NEEDS_EVIDENCE",
            "summary": (
                "The AI analysis could not be converted "
                "into structured compliance results."
            ),
            "findings": [],
        }

    # =====================================================
    # BUILD SOURCES
    # =====================================================

    sources = []

    for index, result in enumerate(results, start=1):
        sources.append(
            {
                "source": index,
                "document_id": result.get(
                    "document_id"
                ),
                "is_number": result.get(
                    "is_number"
                ),
                "year": result.get(
                    "year"
                ),
                "title": result.get(
                    "title"
                ),
                "page_number": result.get(
                    "page_number"
                ),
                "pdf_url": result.get(
                    "pdf_url"
                ),
                "score": result.get(
                    "rrf_score"
                ),
            }
        )

    # =====================================================
    # FINAL RESULT
    # =====================================================

    return {
        "status": analysis.get(
            "status",
            "NEEDS_EVIDENCE",
        ),
        "summary": analysis.get(
            "summary",
            "",
        ),
        "findings": analysis.get(
            "findings",
            [],
        ),
        "sources": sources,
    }


# =========================================================
# GET ALL TENDERS
# =========================================================

@router.get("")
def get_tenders(
    db: Session = Depends(get_db),
):
    tenders = (
        db.query(TenderAnalysis)
        .order_by(
            TenderAnalysis.created_at.desc()
        )
        .all()
    )

    return {
        "count": len(tenders),
        "tenders": [
            {
                "id": tender.id,
                "filename": tender.filename,
                "status": tender.status,
                "summary": tender.summary,
                "created_at": (
                    tender.created_at.isoformat()
                    if tender.created_at
                    else None
                ),
                "findings_count": len(
                    tender.findings or []
                ),
                "sources_count": len(
                    tender.sources or []
                ),
            }
            for tender in tenders
        ],
    }


# =========================================================
# GET SINGLE TENDER
# =========================================================

@router.get("/{tender_id}")
def get_tender(
    tender_id: int,
    db: Session = Depends(get_db),
):
    tender = (
        db.query(TenderAnalysis)
        .filter(
            TenderAnalysis.id == tender_id
        )
        .first()
    )

    if not tender:
        raise HTTPException(
            status_code=404,
            detail="Tender not found.",
        )

    return {
        "id": tender.id,
        "filename": tender.filename,
        "tender_text": tender.tender_text,
        "status": tender.status,
        "summary": tender.summary,
        "findings": tender.findings or [],
        "sources": tender.sources or [],
        "created_at": (
            tender.created_at.isoformat()
            if tender.created_at
            else None
        ),
    }


# =========================================================
# GET TENDER COMPLIANCE
# =========================================================

@router.get("/{tender_id}/compliance")
def get_tender_compliance(
    tender_id: int,
    db: Session = Depends(get_db),
):
    tender = (
        db.query(TenderAnalysis)
        .filter(
            TenderAnalysis.id == tender_id
        )
        .first()
    )

    if not tender:
        raise HTTPException(
            status_code=404,
            detail="Tender not found.",
        )

    return {
        "id": tender.id,
        "filename": tender.filename,
        "status": tender.status,
        "summary": tender.summary,
        "findings": tender.findings or [],
        "sources": tender.sources or [],
    }


# =========================================================
# ANALYZE TEXT
# =========================================================

@router.post("/analyze-text")
def analyze_tender_text(
    payload: TenderTextRequest,
    db: Session = Depends(get_db),
):
    try:
        if len(payload.text.strip()) < 20:
            raise HTTPException(
                status_code=400,
                detail="Tender text is too short.",
            )

        print(
            "[TENDER] Text analysis started.",
            flush=True,
        )

        analysis = build_tender_analysis(
            payload.text
        )

        tender = TenderAnalysis(
            filename=payload.name,
            tender_text=payload.text,
            status=analysis["status"],
            summary=analysis["summary"],
            findings=analysis["findings"],
            sources=analysis["sources"],
        )

        db.add(tender)
        db.commit()
        db.refresh(tender)

        print(
            f"[TENDER] Text analysis saved. "
            f"ID={tender.id}",
            flush=True,
        )

        return {
            "id": tender.id,
            "name": payload.name,
            "text_length": len(
                payload.text
            ),
            **analysis,
        }

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        print(
            f"[TENDER] TEXT ERROR: {error}",
            flush=True,
        )

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# ANALYZE PDF / TXT
# =========================================================

@router.post("/analyze")
async def analyze_tender(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    import time

    started_at = time.time()

    try:
        # -------------------------------------------------
        # VALIDATE FILE
        # -------------------------------------------------

        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file provided.",
            )

        content_type = (
            file.content_type or ""
        ).lower()

        print(
            f"[TENDER] Upload started: "
            f"{file.filename}",
            flush=True,
        )

        # -------------------------------------------------
        # READ FILE
        # -------------------------------------------------

        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty.",
            )

        file_size_mb = (
            len(file_bytes)
            / 1024
            / 1024
        )

        print(
            f"[TENDER] File loaded: "
            f"{file_size_mb:.2f} MB",
            flush=True,
        )

        filename = file.filename.lower()

        # =================================================
        # TXT
        # =================================================

        if (
            "text/plain" in content_type
            or filename.endswith(".txt")
        ):
            print(
                "[TENDER] Reading TXT file...",
                flush=True,
            )

            tender_text = file_bytes.decode(
                "utf-8",
                errors="ignore",
            )

        # =================================================
        # PDF
        # =================================================

        elif (
            "application/pdf" in content_type
            or filename.endswith(".pdf")
        ):
            try:
                import io
                import pypdf

                print(
                    "[TENDER] Starting PDF extraction...",
                    flush=True,
                )

                reader = pypdf.PdfReader(
                    io.BytesIO(file_bytes)
                )

                page_count = len(
                    reader.pages
                )

                print(
                    f"[TENDER] PDF pages: "
                    f"{page_count}",
                    flush=True,
                )

                pages = []

                # -----------------------------------------
                # EXTRACT EACH PAGE
                # -----------------------------------------

                for page_number, page in enumerate(
                    reader.pages,
                    start=1,
                ):
                    try:
                        text = page.extract_text()

                        if text:
                            pages.append(
                                f"\n[PAGE {page_number}]\n{text}"
                            )

                        # Print progress every 5 pages
                        if (
                            page_number % 5 == 0
                            or page_number == page_count
                        ):
                            print(
                                f"[TENDER] Extracted "
                                f"{page_number}/{page_count} pages...",
                                flush=True,
                            )

                    except Exception as page_error:
                        print(
                            f"[TENDER] Page "
                            f"{page_number} extraction failed: "
                            f"{page_error}",
                            flush=True,
                        )

                tender_text = "\n\n".join(
                    pages
                )

                print(
                    f"[TENDER] PDF extraction complete. "
                    f"Characters: "
                    f"{len(tender_text):,}",
                    flush=True,
                )

            except ImportError:
                raise HTTPException(
                    status_code=500,
                    detail=(
                        "PDF support is not installed. "
                        "Run: pip install pypdf"
                    ),
                )

        # =================================================
        # UNSUPPORTED FILE
        # =================================================

        else:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported file type. "
                    "Please upload a PDF or TXT file."
                ),
            )

        # =================================================
        # VALIDATE EXTRACTED TEXT
        # =================================================

        if not tender_text.strip():
            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not extract text from the "
                    "uploaded tender. "
                    "The PDF may be scanned/image-only."
                ),
            )

        print(
            f"[TENDER] Total extracted text: "
            f"{len(tender_text):,} characters",
            flush=True,
        )

        # =================================================
        # LIMIT AI INPUT
        # =================================================

        MAX_ANALYSIS_CHARS = 12000

        analysis_text = tender_text[
            :MAX_ANALYSIS_CHARS
        ]

        if len(tender_text) > MAX_ANALYSIS_CHARS:
            print(
                f"[TENDER] Large tender detected. "
                f"Only first "
                f"{MAX_ANALYSIS_CHARS:,} characters "
                f"will be analyzed.",
                flush=True,
            )

        # =================================================
        # RUN AI ANALYSIS
        # =================================================

        print(
            "[TENDER] Starting BIS search + AI analysis...",
            flush=True,
        )

        analysis = build_tender_analysis(
            analysis_text
        )

        print(
            f"[TENDER] AI analysis complete. "
            f"Elapsed: "
            f"{time.time() - started_at:.1f}s",
            flush=True,
        )

        # =================================================
        # SAVE DATABASE
        # =================================================

        print(
            "[TENDER] Saving analysis to database...",
            flush=True,
        )

        tender = TenderAnalysis(
            filename=file.filename,
            tender_text=tender_text,
            status=analysis["status"],
            summary=analysis["summary"],
            findings=analysis["findings"],
            sources=analysis["sources"],
        )

        db.add(tender)
        db.commit()
        db.refresh(tender)

        print(
            f"[TENDER] Analysis saved successfully. "
            f"ID={tender.id}",
            flush=True,
        )

        # =================================================
        # RESPONSE
        # =================================================

        total_time = (
            time.time() - started_at
        )

        print(
            f"[TENDER] TOTAL TIME: "
            f"{total_time:.1f}s",
            flush=True,
        )

        return {
            "id": tender.id,
            "filename": file.filename,
            "content_type": content_type,
            "text_length": len(
                tender_text
            ),

            # Preview only.
            # Complete text remains in DB.
            "extracted_text": tender_text[:5000],

            **analysis,
        }

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        print(
            f"[TENDER] PDF/TXT ERROR: "
            f"{error}",
            flush=True,
        )

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )