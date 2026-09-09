from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.bis import BISStandard
from app.db.neo4j import neo4j_db


def create_standard_node(tx, standard):
    tx.run(
        """
        MERGE (s:Standard {document_id: $document_id})
        SET
            s.is_number = $is_number,
            s.year = $year,
            s.title = $title,
            s.amendments = $amendments,
            s.pdf_url = $pdf_url,
            s.txt_url = $txt_url
        """,
        document_id=standard.document_id,
        is_number=standard.is_number,
        year=standard.year,
        title=standard.title,
        amendments=standard.amendments,
        pdf_url=standard.pdf_url,
        txt_url=standard.txt_url,
    )


def create_division_relationship(tx, standard):
    if not standard.division:
        return

    tx.run(
        """
        MATCH (s:Standard {document_id: $document_id})
        MERGE (d:Division {name: $division})
        MERGE (s)-[:BELONGS_TO]->(d)
        """,
        document_id=standard.document_id,
        division=standard.division,
    )


def create_committee_relationship(tx, standard):
    if not standard.committee:
        return

    tx.run(
        """
        MATCH (s:Standard {document_id: $document_id})
        MERGE (c:Committee {name: $committee})
        MERGE (s)-[:HANDLED_BY]->(c)
        """,
        document_id=standard.document_id,
        committee=standard.committee,
    )


def ingest_standards():
    postgres = SessionLocal()

    try:
        standards = postgres.scalars(
            select(BISStandard)
        ).all()

        print(f"Found {len(standards)} BIS standards.")

        with neo4j_db.driver.session(
            database=settings.NEO4J_DATABASE
        ) as session:

            for index, standard in enumerate(standards, start=1):

                session.execute_write(
                    create_standard_node,
                    standard,
                )

                session.execute_write(
                    create_division_relationship,
                    standard,
                )

                session.execute_write(
                    create_committee_relationship,
                    standard,
                )

                if index % 500 == 0:
                    print(f"Processed {index} standards.")

        print()
        print("================================")
        print("NEO4J INGESTION COMPLETE")
        print("================================")
        print(f"Standards processed: {len(standards)}")
        print("================================")

    finally:
        postgres.close()


if __name__ == "__main__":
    ingest_standards()