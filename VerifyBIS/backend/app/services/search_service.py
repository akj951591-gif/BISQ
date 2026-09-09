from sqlalchemy import text

from app.db.session import SessionLocal
from app.services.embedding_service import generate_embedding


def semantic_search(query: str, limit: int = 5):
    query_embedding = generate_embedding(query)

    db = SessionLocal()

    try:
        sql = text("""
            SELECT
                c.id AS chunk_id,
                c.content,
                c.page_number,
                s.document_id,
                s.is_number,
                s.year,
                s.title,
                s.pdf_url,
                1 - (c.embedding <=> CAST(:embedding AS vector)) AS similarity
            FROM bis_chunks c
            JOIN bis_standards s
                ON s.id = c.standard_id
            WHERE c.embedding IS NOT NULL
            ORDER BY c.embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
        """)

        results = db.execute(
            sql,
            {
                "embedding": str(query_embedding),
                "limit": limit,
            },
        ).mappings().all()

        return [dict(row) for row in results]

    finally:
        db.close()