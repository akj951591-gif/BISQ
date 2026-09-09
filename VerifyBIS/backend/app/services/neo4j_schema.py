from app.core.config import settings
from app.db.neo4j import neo4j_db


def initialize_neo4j():
    queries = [
        """
        CREATE CONSTRAINT standard_document_id_unique
        IF NOT EXISTS
        FOR (s:Standard)
        REQUIRE s.document_id IS UNIQUE
        """,
        """
        CREATE INDEX standard_title_index
        IF NOT EXISTS
        FOR (s:Standard)
        ON (s.title)
        """,
        """
        CREATE INDEX committee_index
        IF NOT EXISTS
        FOR (c:Committee)
        ON (c.name)
        """,
    ]

    with neo4j_db.driver.session(
        database=settings.NEO4J_DATABASE
    ) as session:

        for query in queries:
            session.run(query)

    print("Neo4j schema initialized successfully.")


if __name__ == "__main__":
    initialize_neo4j()