from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.tender import TenderAnalysis
from app.services.hybrid_search import hybrid_search
from app.services.standard_reference_service import (
    extract_standard_references,
    exact_standard_chunks,
)


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
# RETRIEVAL HELPERS
# =========================================================


def build_exact_results(tender_text: str):
    """
    Retrieve chunks from standards explicitly referenced
    in the tender.

    Example:
        IS 456
        IS 1786
        IS 269
        IS 800
        IS 4759

    These results get priority over generic semantic matches.
    """

    references = extract_standard_references(
        tender_text
    )

    if not references:
        print(
            "[TENDER] No explicit IS references detected.",
            flush=True,
        )
        return []

    print(
        "[TENDER] Explicit BIS references detected: "
        + ", ".join(
            (
                f"IS {ref['number']}"
                + (
                    f":{ref['year']}"
                    if ref["year"]
                    else ""
                )
            )
            for ref in references
        ),
        flush=True,
    )

    try:
        results = exact_standard_chunks(
            query=tender_text,
            per_standard=2,
        )

        for result in results:
            result["retrieval_type"] = (
                "exact_standard"
            )
            result["exact_standard_match"] = True

        print(
            f"[TENDER] Exact-standard retrieval returned "
            f"{len(results)} chunks.",
            flush=True,
        )

        return results

    except Exception as error:
        print(
            f"[TENDER] Exact-standard retrieval failed: "
            f"{error}",
            flush=True,
        )

        return []


def merge_retrieval_results(
    exact_results,
    hybrid_results,
    limit: int,
):
    """
    Merge retrieval results.

    Priority:
        1. Exact IS-number matches
        2. Hybrid BM25 + vector matches

    Each BIS standard is represented only once in the
    final evidence set.
    """

    final_results = []

    # =====================================================
    # EXACT STANDARD RESULTS
    # =====================================================

    exact_document_ids = set()

    for result in exact_results:
        document_id = result.get(
            "document_id"
        )

        if not document_id:
            continue

        exact_document_ids.add(
            document_id
        )

    # Keep only one chunk per exact standard
    # in the final tender context.
    exact_seen = set()

    for result in exact_results:
        document_id = result.get(
            "document_id"
        )

        if not document_id:
            continue

        if document_id in exact_seen:
            continue

        exact_seen.add(document_id)

        item = dict(result)

        item["retrieval_type"] = (
            "exact_standard"
        )
        item["exact_standard_match"] = True
        item["rrf_score"] = 1.0

        final_results.append(item)

        if len(final_results) >= limit:
            return final_results[:limit]

    # =====================================================
    # HYBRID RESULTS
    # =====================================================

    hybrid_seen = set()

    for result in hybrid_results:
        document_id = result.get(
            "document_id"
        )

        if not document_id:
            continue

        # Do not allow a generic semantic result from an
        # exact standard to replace the exact evidence.
        if document_id in exact_document_ids:
            continue

        # Avoid duplicate standards.
        if document_id in hybrid_seen:
            continue

        hybrid_seen.add(document_id)

        item = dict(result)

        item["retrieval_type"] = (
            item.get(
                "retrieval_type",
                "hybrid",
            )
        )

        item["exact_standard_match"] = False

        final_results.append(item)

        if len(final_results) >= limit:
            break

    return final_results[:limit]


# =========================================================
# BUILD TENDER ANALYSIS
# =========================================================


def build_tender_analysis(
    tender_text: str,
):
    """
    Analyze a tender against relevant BIS standards.

    Retrieval priority:

    1. Explicit BIS references
    2. BM25
    3. BGE-M3 vector search
    4. RRF
    5. One representative result per standard
    6. GPT-OSS 120B evidence-based analysis
    """

    if not tender_text.strip():
        raise ValueError(
            "Tender text is empty."
        )

    # -----------------------------------------------------
    # LIMIT SEARCH INPUT
    # -----------------------------------------------------

    search_text = tender_text[:6000]

    print(
        f"[TENDER] Starting BIS retrieval with "
        f"{len(search_text):,} characters...",
        flush=True,
    )

    # =====================================================
    # 1. EXACT STANDARD RETRIEVAL
    # =====================================================

    exact_results = build_exact_results(
        search_text
    )

    # =====================================================
    # 2. NORMAL HYBRID RETRIEVAL
    # =====================================================

    print(
        "[TENDER] Starting BM25 + BGE-M3 hybrid search...",
        flush=True,
    )

    hybrid_results = hybrid_search(
        query=search_text,
        limit=20,
    )

    print(
        f"[TENDER] Hybrid search returned "
        f"{len(hybrid_results)} results.",
        flush=True,
    )

    # =====================================================
    # 3. MERGE EXACT + HYBRID
    # =====================================================

    results = merge_retrieval_results(
        exact_results=exact_results,
        hybrid_results=hybrid_results,
        limit=8,
    )

    print(
        "[TENDER] Final evidence set:",
        flush=True,
    )

    for index, result in enumerate(
        results,
        start=1,
    ):
        print(
            f"  SOURCE {index}: "
            f"{result.get('is_number')} | "
            f"{result.get('title')} | "
            f"page={result.get('page_number')} | "
            f"type={result.get('retrieval_type')}",
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

    for index, result in enumerate(
        results,
        start=1,
    ):
        source_parts.append(
            f"""
SOURCE {index}

Retrieval Type:
{result.get("retrieval_type")}

Exact Standard Match:
{result.get("exact_standard_match")}

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

PDF URL:
{result.get("pdf_url")}

Content:
{result.get("content")}
"""
        )

    context = "\n".join(
        source_parts
    )

    print(
        f"[TENDER] Context built from "
        f"{len(results)} BIS sources.",
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

    # =====================================================
    # PROMPT
    # =====================================================

    prompt = f"""
You are BISQ, an AI system for BIS standards
and tender compliance analysis.

Analyze the tender against ONLY the supplied
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
      "requirement": "specific tender requirement",
      "assessment": "assessment against the supplied BIS evidence",
      "evidence": "relevant tender evidence or explain what is missing",
      "source": "Source 1",
      "page": 1
    }}
  ]
}}

IMPORTANT RETRIEVAL RULES:

1. If the tender explicitly mentions an IS number,
   such as IS 456, IS 1786, IS 269, IS 800,
   or IS 4759, prefer the source whose BIS Number
   exactly matches that standard.

2. NEVER use an unrelated BIS standard as evidence
   merely because its text contains similar words.

3. An exact BIS-number match is stronger evidence
   than a generic semantic similarity result.

4. If no exact source exists for an explicitly referenced
   standard, say that evidence is unavailable.

5. Do not substitute one BIS standard for another.

6. Use ONLY the supplied BIS source material.

7. Do not create requirements that are not present.

8. If tender evidence is missing, use NEEDS_EVIDENCE.

9. If evidence clearly conflicts with a BIS requirement,
   mark that finding NON_COMPLIANT.

10. If the tender clearly satisfies the requirement,
    mark that finding COMPLIANT.

11. Keep findings specific.

12. Include the exact BIS number whenever relevant.

13. Page may be null if unavailable.

14. Every finding must reference one of the supplied
    sources.

15. Do not invent page numbers.

16. Do not invent evidence.

17. Do not output Markdown.

18. Return valid JSON only.

19. The source title must agree with the BIS number.

20. Never claim that IS 62 is evidence for a construction
    requirement unless the supplied source itself clearly
    establishes that relationship.

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
                    "analysis system. "
                    "Use only supplied BIS sources. "
                    "Prefer exact BIS-number matches. "
                    "Never invent requirements or evidence. "
                    "Return valid JSON only."
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
        analysis = json.loads(
            raw_answer
        )

    except json.JSONDecodeError:
        print(
            "[TENDER] Groq returned invalid JSON.",
            flush=True,
        )

        analysis = {
            "status": "NEEDS_EVIDENCE",
            "summary": (
                "The AI analysis could not be "
                "converted into structured "
                "compliance results."
            ),
            "findings": [],
        }

    # =====================================================
    # BUILD SOURCES
    # =====================================================

    sources = []

    for index, result in enumerate(
        results,
        start=1,
    ):
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
                "retrieval_type": result.get(
                    "retrieval_type"
                ),
                "exact_standard_match": result.get(
                    "exact_standard_match",
                    False,
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

                        if (
                            page_number % 5 == 0
                            or page_number == page_count
                        ):
                            print(
                                f"[TENDER] Extracted "
                                f"{page_number}/"
                                f"{page_count} pages...",
                                flush=True,
                            )

                    except Exception as page_error:
                        print(
                            f"[TENDER] Page "
                            f"{page_number} extraction "
                            f"failed: {page_error}",
                            flush=True,
                        )

                tender_text = "\n\n".join(
                    pages
                )

                print(
                    "[TENDER] PDF extraction complete. "
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
            "[TENDER] AI analysis complete. "
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
            "[TENDER] Analysis saved successfully. "
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