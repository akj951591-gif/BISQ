from neo4j import GraphDatabase

from app.core.config import settings


class Neo4jDatabase:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(
                settings.NEO4J_USERNAME,
                settings.NEO4J_PASSWORD,
            ),
        )

    def verify_connection(self):
        with self.driver.session(
            database=settings.NEO4J_DATABASE
        ) as session:
            result = session.run("RETURN 1 AS connected")
            return result.single()["connected"] == 1

    def close(self):
        self.driver.close()


neo4j_db = Neo4jDatabase()