import json

from groq import Groq

from app.core.config import settings
from app.services.hybrid_search import hybrid_search


MODEL_NAME = "openai/gpt-oss-120b"


def build_compliance_context(results):
    parts = []

    for index, result in enumerate(results, start=1):
        parts.append(
            f"""
SOURCE {index}
BIS Number: {result.get("is_number")}
Document ID: {result.get("document_id")}
Year: {result.get("year")}
Title: {result.get("title")}
Page: {result.get("page_number")}

REQUIREMENT / TEXT:
{result.get("content")}
"""
        )

    return "\n".join(parts)


def analyze_compliance(product_description: str, limit: int = 8):
    results = hybrid_search(
        query=product_description,
        limit=limit
    )

    if not results:
        return {
            "product": product_description,
            "status": "NEEDS EVIDENCE",
            "summary": "No relevant BIS material was found.",
            "findings": [],
            "sources": []
        }

    context = build_compliance_context(results)

    prompt = f"""
You are BISQ, a BIS standards compliance analysis assistant.

Analyze the product against ONLY the supplied BIS source material.

PRODUCT:
{product_description}

BIS SOURCE MATERIAL:
{context}

Return ONLY valid JSON.

Use exactly this structure:

{{
  "status": "COMPLIANT | NON-COMPLIANT | NEEDS EVIDENCE",
  "summary": "Short explanation",
  "findings": [
    {{
      "requirement": "The BIS requirement",
      "assessment": "What can or cannot be established from the product information",
      "evidence": "Evidence from the product description, or empty string if none",
      "source": "Source 1",
      "page": 1
    }}
  ]
}}

IMPORTANT RULES:

1. Use ONLY the supplied BIS source material.
2. Never invent a BIS requirement.
3. Never invent product evidence.
4. Do not claim COMPLIANT unless the supplied product information
   actually demonstrates that the relevant requirements are satisfied.
5. Do not claim NON-COMPLIANT unless the supplied product information
   demonstrates a violation.
6. If important information is missing, use NEEDS EVIDENCE.
7. Each finding must reference one of the supplied sources.
8. Use the exact source numbering from the supplied material.
9. Include the page number when available.
10. Keep the assessment concise.
11. Return JSON only.
12. Do not use Markdown.
13. Do not put ```json around the response.
14. Use normal UTF-8 characters.
"""

    client = Groq(
        api_key=settings.GROQ_API_KEY
    )

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a careful BIS compliance analyst. "
                    "Return only valid JSON. "
                    "Never invent requirements or evidence."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0,
        max_tokens=2500,
    )

    raw_answer = response.choices[0].message.content.strip()

    # Remove accidental Markdown code fences if the model adds them.
    if raw_answer.startswith("```"):
        raw_answer = raw_answer.replace("```json", "", 1)
        raw_answer = raw_answer.replace("```", "")
        raw_answer = raw_answer.strip()

    try:
        analysis = json.loads(raw_answer)
    except json.JSONDecodeError:
        return {
            "product": product_description,
            "status": "NEEDS EVIDENCE",
            "summary": "The compliance analysis could not be parsed into structured data.",
            "findings": [],
            "sources": [
                {
                    "source": index,
                    "document_id": result.get("document_id"),
                    "is_number": result.get("is_number"),
                    "year": result.get("year"),
                    "title": result.get("title"),
                    "page_number": result.get("page_number"),
                    "pdf_url": result.get("pdf_url"),
                    "score": result.get("rrf_score")
                }
                for index, result in enumerate(results, start=1)
            ],
            "raw_analysis": raw_answer
        }

    sources = []

    for index, result in enumerate(results, start=1):
        sources.append(
            {
                "source": index,
                "document_id": result.get("document_id"),
                "is_number": result.get("is_number"),
                "year": result.get("year"),
                "title": result.get("title"),
                "page_number": result.get("page_number"),
                "pdf_url": result.get("pdf_url"),
                "score": result.get("rrf_score")
            }
        )

    return {
        "product": product_description,
        "status": analysis.get("status", "NEEDS EVIDENCE"),
        "summary": analysis.get("summary", ""),
        "findings": analysis.get("findings", []),
        "sources": sources
    }