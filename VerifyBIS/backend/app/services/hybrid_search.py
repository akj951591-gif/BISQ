from app.services.search_service import semantic_search
from app.services.bm25_service import bm25_search


def reciprocal_rank_fusion(
    vector_results,
    bm25_results,
    limit=5,
    k=60,
):
    scores = {}
    documents = {}

    # Vector ranking
    for rank, result in enumerate(vector_results, start=1):
        key = result["chunk_id"]

        scores[key] = scores.get(key, 0) + (
            1 / (k + rank)
        )

        documents[key] = result

    # BM25 ranking
    for rank, result in enumerate(bm25_results, start=1):
        key = result["chunk_id"]

        scores[key] = scores.get(key, 0) + (
            1 / (k + rank)
        )

        documents[key] = result

    ranked = sorted(
        scores,
        key=scores.get,
        reverse=True,
    )

    results = []

    for chunk_id in ranked[:limit]:
        result = dict(documents[chunk_id])

        result["rrf_score"] = scores[chunk_id]

        results.append(result)

    return results


def hybrid_search(query: str, limit: int = 5):

    vector_results = semantic_search(
        query=query,
        limit=20,
    )

    bm25_results = bm25_search(
        query=query,
        limit=20,
    )

    return reciprocal_rank_fusion(
        vector_results=vector_results,
        bm25_results=bm25_results,
        limit=limit,
    )