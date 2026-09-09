from sqlalchemy import text

from app.db.session import engine, Base
from app.models.bis import BISStandard, BISChunk


def init_database():
    print("Initializing PostgreSQL...")

    # Enable pgvector
    with engine.begin() as connection:
        connection.execute(
            text("CREATE EXTENSION IF NOT EXISTS vector")
        )

    # Create application tables
    Base.metadata.create_all(bind=engine)

    print("PostgreSQL database initialized successfully.")


if __name__ == "__main__":
    init_database()