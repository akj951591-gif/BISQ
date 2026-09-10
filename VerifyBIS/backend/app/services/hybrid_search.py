from app.services.search_service import semantic_search
from app.services.bm25_service import bm25_search
from app.services.standard_reference_service import (
    exact_standard_chunks,
)


def reciprocal_rank_fusion(
    vector_results,
    bm25_results,
    limit=10,
    k=60,
):
    scores = {}
    documents = {}

    for rank, result in enumerate(
        vector_results,
        start=1,
    ):
        key = result["chunk_id"]

        scores[key] = (
            scores.get(key, 0)
            + 1 / (k + rank)
        )

        documents[key] = result

    for rank, result in enumerate(
        bm25_results,
        start=1,
    ):
        key = result["chunk_id"]

        scores[key] = (
            scores.get(key, 0)
            + 1 / (k + rank)
        )

        documents[key] = result

    ranked = sorted(
        scores,
        key=scores.get,
        reverse=True,
    )

    results = []

    for chunk_id in ranked:
        if len(results) >= limit:
            break

        result = dict(
            documents[chunk_id]
        )

        result["rrf_score"] = scores[
            chunk_id
        ]
        result["retrieval_type"] = "hybrid"

        results.append(result)

    return results


def _deduplicate_by_standard(
    results,
    limit,
):
    """
    Keep only one representative chunk
    from each BIS standard.
    """
    selected = []
    seen_standards = set()
    seen_chunks = set()

    for result in results:
        chunk_id = result.get("chunk_id")
        document_id = result.get(
            "document_id"
        )

        if chunk_id in seen_chunks:
            continue

        if document_id in seen_standards:
            continue

        seen_chunks.add(chunk_id)
        seen_standards.add(document_id)

        selected.append(result)

        if len(selected) >= limit:
            break

    return selected


def hybrid_search(
    query: str,
    limit: int = 5,
):
    """
    BIS-aware hybrid retrieval.

    Priority:

    1. Exact IS references
    2. BM25 + BGE-M3
    3. RRF
    4. One chunk per standard
    """
    if not query or not query.strip():
        return []

    exact_results = exact_standard_chunks(
        query=query,
        per_standard=2,
    )

    vector_results = semantic_search(
        query=query,
        limit=max(
            20,
            limit * 4,
        ),
    )

    bm25_results = bm25_search(
        query=query,
        limit=max(
            20,
            limit * 4,
        ),
    )

    hybrid_results = reciprocal_rank_fusion(
        vector_results,
        bm25_results,
        limit=max(
            20,
            limit * 4,
        ),
    )

    combined = []

    # Explicit standards ALWAYS come first.
    for result in exact_results:
        result = dict(result)

        result["rrf_score"] = 1.0
        result["retrieval_type"] = (
            "exact_standard"
        )

        combined.append(result)

    exact_chunk_ids = {
        result["chunk_id"]
        for result in exact_results
    }

    for result in hybrid_results:
        if result["chunk_id"] not in exact_chunk_ids:
            combined.append(result)

    return _deduplicate_by_standard(
        combined,
        limit=limit,
    )