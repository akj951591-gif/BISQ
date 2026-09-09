from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.bis import BISChunk
from app.services.embedding_service import generate_embedding


def test_embedding():

    db = SessionLocal()

    try:
        chunk = db.scalar(
            select(BISChunk)
            .limit(1)
        )

        if not chunk:
            print("No chunks found in PostgreSQL.")
            return

        print(f"Chunk ID: {chunk.id}")
        print(f"Content length: {len(chunk.content)}")

        print()
        print("Generating BGE-M3 embedding...")

        embedding = generate_embedding(chunk.content)

        print()
        print("================================")
        print("EMBEDDING TEST COMPLETE")
        print("================================")
        print(f"Dimensions : {len(embedding)}")
        print(f"First 5   : {embedding[:5]}")
        print("================================")

    finally:
        db.close()


if __name__ == "__main__":
    test_embedding()
    