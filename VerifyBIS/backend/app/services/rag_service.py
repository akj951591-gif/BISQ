from groq import Groq

from app.core.config import settings
from app.services.hybrid_search import hybrid_search


MODEL_NAME = "openai/gpt-oss-120b"


def build_context(results):
    context_parts = []

    for index, result in enumerate(results, start=1):
        context_parts.append(
            f"""
SOURCE {index}
Document ID: {result.get("document_id")}
BIS Number: {result.get("is_number")}
Year: {result.get("year")}
Title: {result.get("title")}
Page: {result.get("page_number")}

Content:
{result.get("content")}
"""
        )

    return "\n".join(context_parts)


def generate_rag_answer(query: str, limit: int = 5):
    # Retrieve relevant BIS content
    results = hybrid_search(
        query=query,
        limit=limit
    )

    if not results:
        return {
            "query": query,
            "answer": "I could not find relevant BIS standards in the indexed data.",
            "sources": []
        }

    context = build_context(results)

    prompt = f"""
You are BISQ, an AI assistant for BIS (Bureau of Indian Standards)
standards research and compliance analysis.

Answer the user's question using ONLY the provided BIS source material.

Rules:
1. Do not invent BIS requirements.
2. If the provided sources do not contain enough information, say so.
3. Clearly distinguish facts from the BIS sources.
4. Cite sources using [Source 1], [Source 2], etc.
5. Include the BIS standard number and page when available.
6. Give a concise but useful answer.
7. Do not claim that a product is compliant unless the provided evidence
   actually establishes compliance.

USER QUESTION:
{query}

BIS SOURCE MATERIAL:
{context}

Now answer the user's question.
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
                    "You are a careful BIS standards research assistant. "
                    "Use only the supplied source material."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.1,
        max_tokens=1500,
    )

    answer = response.choices[0].message.content

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
        "query": query,
        "answer": answer,
        "sources": sources
    }