from neo4j import GraphDatabase

from app.core.config import settings


class Neo4jService:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(
                settings.NEO4J_USERNAME,
                settings.NEO4J_PASSWORD,
            ),
        )

    def close(self):
        self.driver.close()

    def verify_connection(self):
        with self.driver.session(database=settings.NEO4J_DATABASE) as session:
            result = session.run("RETURN 1 AS ok")
            return result.single()["ok"] == 1

    def get_standard_graph(self, document_id: str):
        query = """
        MATCH (s)
        WHERE s.document_id = $document_id
           OR s.is_number = $document_id

        OPTIONAL MATCH (s)-[r]->(related)

        RETURN
            labels(s) AS standard_labels,
            properties(s) AS standard,
            collect(
                CASE
                    WHEN related IS NOT NULL THEN {
                        relationship: type(r),
                        labels: labels(related),
                        properties: properties(related)
                    }
                END
            ) AS relationships
        LIMIT 1
        """

        with self.driver.session(database=settings.NEO4J_DATABASE) as session:
            result = session.run(
                query,
                document_id=document_id,
            )
            record = result.single()

            if not record:
                return None

            relationships = [
                item
                for item in record["relationships"]
                if item is not None
            ]

            return {
                "standard": {
                    "labels": record["standard_labels"],
                    "properties": record["standard"],
                },
                "relationships": relationships,
            }

    def get_graph_stats(self):
        query = """
        MATCH (n)
        OPTIONAL MATCH ()-[r]->()
        RETURN
            count(DISTINCT n) AS nodes,
            count(r) AS relationships
        """

        with self.driver.session(database=settings.NEO4J_DATABASE) as session:
            record = session.run(query).single()

            return {
                "nodes": record["nodes"],
                "relationships": record["relationships"],
            }

    def get_relationship_types(self):
        query = """
        MATCH ()-[r]->()
        RETURN
            type(r) AS relationship,
            count(r) AS count
        ORDER BY count DESC
        """

        with self.driver.session(database=settings.NEO4J_DATABASE) as session:
            result = session.run(query)

            return [
                {
                    "relationship": record["relationship"],
                    "count": record["count"],
                }
                for record in result
            ]


neo4j_service = Neo4jService()