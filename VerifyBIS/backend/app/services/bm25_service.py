import re

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.bis import BISChunk, BISStandard


def tokenize(text: str) -> list[str]:
    """
    Simple tokenizer for BIS text.

    Keeps:
    - words
    - numbers
    - identifiers such as IS-456
    """

    return re.findall(r"[A-Za-z0-9]+(?:[-./][A-Za-z0-9]+)*", text.lower())


def bm25_search(query: str, limit: int = 5):
    db = SessionLocal()

    try:
        rows = db.execute(
            select(
                BISChunk.id,
                BISChunk.content,
                BISChunk.page_number,
                BISStandard.document_id,
                BISStandard.is_number,
                BISStandard.year,
                BISStandard.title,
                BISStandard.pdf_url,
            )
            .join(
                BISStandard,
                BISStandard.id == BISChunk.standard_id,
            )
        ).all()

        if not rows:
            return []

        documents = [
            tokenize(row.content)
            for row in rows
        ]

        from rank_bm25 import BM25Okapi

        bm25 = BM25Okapi(documents)

        query_tokens = tokenize(query)

        scores = bm25.get_scores(query_tokens)

        ranked_indexes = sorted(
            range(len(scores)),
            key=lambda index: scores[index],
            reverse=True,
        )

        results = []

        for index in ranked_indexes[:limit]:

            row = rows[index]

            results.append(
                {
                    "chunk_id": row.id,
                    "content": row.content,
                    "page_number": row.page_number,
                    "document_id": row.document_id,
                    "is_number": row.is_number,
                    "year": row.year,
                    "title": row.title,
                    "pdf_url": row.pdf_url,
                    "bm25_score": float(scores[index]),
                }
            )

        return results

    finally:
        db.close()