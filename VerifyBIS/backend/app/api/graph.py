from fastapi import APIRouter, HTTPException

from app.services.neo4j_service import neo4j_service


router = APIRouter(
    prefix="/api/graph",
    tags=["Knowledge Graph"],
)


@router.get("/health")
def graph_health():
    try:
        connected = neo4j_service.verify_connection()

        return {
            "status": "ok" if connected else "error",
            "neo4j": connected,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Neo4j connection failed: {error}",
        )


@router.get("/stats")
def graph_stats():
    try:
        return neo4j_service.get_graph_stats()

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read Neo4j statistics: {error}",
        )


@router.get("/relationships")
def relationship_types():
    try:
        return {
            "relationships": neo4j_service.get_relationship_types()
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read Neo4j relationships: {error}",
        )


@router.get("/standard/{document_id}")
def standard_graph(document_id: str):
    try:
        graph = neo4j_service.get_standard_graph(document_id)

        if not graph:
            raise HTTPException(
                status_code=404,
                detail="Standard not found in Neo4j graph",
            )

        return graph

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read standard graph: {error}",
        )