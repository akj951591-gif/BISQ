from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.bis import BISChunk
from app.services.embedding_service import generate_embeddings

BATCH_SIZE = 32


def embed_all_chunks():
    db = SessionLocal()

    total_processed = 0

    try:
        while True:
            chunks = db.scalars(
                select(BISChunk)
                .where(BISChunk.embedding.is_(None))
                .order_by(BISChunk.id)
                .limit(BATCH_SIZE)
            ).all()

            if not chunks:
                break

            print(f"\nProcessing batch of {len(chunks)} chunks...")

            texts = [chunk.content for chunk in chunks]

            embeddings = generate_embeddings(texts)

            for chunk, embedding in zip(chunks, embeddings):
                chunk.embedding = embedding

            db.commit()

            total_processed += len(chunks)

            print(f"Embedded chunks so far: {total_processed}")

        print("\n================================")
        print("VECTOR EMBEDDING COMPLETE")
        print("================================")
        print(f"Total chunks embedded: {total_processed}")
        print("================================")

    except Exception as error:
        db.rollback()
        print("\nERROR DURING EMBEDDING")
        print(error)
        raise

    finally:
        db.close()


if __name__ == "__main__":
    embed_all_chunks()