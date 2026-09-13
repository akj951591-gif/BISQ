import re
from collections import OrderedDict

from sqlalchemy import select, text

from app.db.session import SessionLocal
from app.models.bis import BISChunk


# Matches:
# IS 456
# IS:456
# IS-456
# IS 456:2000
# IS 456 : 2000
IS_REFERENCE_PATTERN = re.compile(
    r"\bIS\s*[:./-]?\s*(\d{1,6})"
    r"(?:\s*[:./-]\s*(\d{4}))?\b",
    re.IGNORECASE,
)


def extract_standard_references(text: str) -> list[dict]:
    """
    Extract explicit Indian Standard references.

    Example:
        "Concrete shall conform to IS 456 and steel to IS 1786"

    Returns:
        [
            {"number": "456", "year": None},
            {"number": "1786", "year": None},
        ]
    """
    if not text:
        return []

    found = OrderedDict()

    for match in IS_REFERENCE_PATTERN.finditer(text):
        number = match.group(1)
        year = int(match.group(2)) if match.group(2) else None

        key = (number, year)

        if key not in found:
            found[key] = {
                "number": number,
                "year": year,
            }

    return list(found.values())


def _standard_number_expression():
    """
    Extract numeric BIS number from values such as:

        IS 456 : 2000
        IS 1786
        456

    This lets PostgreSQL compare only the numeric IS number.
    """
    return (
        "regexp_replace("
        "lower(coalesce(is_number, '')),"
        "'^[^0-9]*([0-9]+).*$',"
        "'\\1'"
        ")"
    )


def find_exact_standards(query: str) -> list[dict]:
    """
    Resolve explicit IS references to BIS metadata.

    When no year is specified:
    newest available edition is preferred.
    """
    references = extract_standard_references(query)

    if not references:
        return []

    db = SessionLocal()

    try:
        matched = []

        for ref in references:
            params = {
                "number": ref["number"],
                "year": ref["year"],
            }

            where_sql = (
                f"{_standard_number_expression()} = :number"
            )

            # Prefer the edition the tender asked for, but fall back to the
            # newest indexed edition rather than returning no evidence at all.
            sql = f"""
                SELECT
                    id,
                    document_id,
                    is_number,
                    year,
                    title,
                    amendments,
                    committee,
                    equivalent,
                    superseding,
                    supersede_by,
                    division,
                    pdf_url,
                    txt_url
                FROM bis_standards
                WHERE {where_sql}
                ORDER BY
                    (year = CAST(:year AS integer)) DESC NULLS LAST,
                    year DESC NULLS LAST,
                    id DESC
                LIMIT 1
            """

            rows = db.execute(
                text(sql),
                params,
            ).mappings().all()

            for row in rows:
                matched.append(
                    {
                        "requested_number": ref["number"],
                        "requested_year": ref["year"],
                        **dict(row),
                    }
                )

        unique = OrderedDict()

        for item in matched:
            if item["id"] not in unique:
                unique[item["id"]] = item

        return list(unique.values())

    finally:
        db.close()


def exact_standard_chunks(
    query: str,
    per_standard: int = 2,
) -> list[dict]:
    """
    Retrieve evidence only from explicitly referenced
    BIS standards.

    This prevents a generic semantic match such as
    IS 62 from outranking an explicitly requested
    IS 456.
    """
    standards = find_exact_standards(query)

    if not standards:
        return []

    standard_ids = [
        standard["id"]
        for standard in standards
    ]

    standard_by_id = {
        standard["id"]: standard
        for standard in standards
    }

    db = SessionLocal()

    try:
        rows = db.execute(
            select(
                BISChunk.id,
                BISChunk.standard_id,
                BISChunk.content,
                BISChunk.page_number,
                BISChunk.chunk_index,
            )
            .where(
                BISChunk.standard_id.in_(standard_ids)
            )
            .order_by(
                BISChunk.standard_id,
                BISChunk.page_number,
                BISChunk.chunk_index,
            )
        ).mappings().all()

        if not rows:
            return []

        grouped = OrderedDict(
            (sid, [])
            for sid in standard_ids
        )

        for row in rows:
            grouped[
                row["standard_id"]
            ].append(dict(row))

        from app.services.bm25_service import tokenize
        from rank_bm25 import BM25Okapi

        query_tokens = tokenize(query)

        results = []

        for standard_id in standard_ids:
            candidates = grouped.get(
                standard_id,
                [],
            )

            if not candidates:
                continue

            documents = [
                tokenize(candidate["content"])
                for candidate in candidates
            ]

            selected = []

            if query_tokens and any(documents):
                bm25 = BM25Okapi(documents)

                scores = bm25.get_scores(
                    query_tokens
                )

                ranked_indexes = sorted(
                    range(len(candidates)),
                    key=lambda index: float(
                        scores[index]
                    ),
                    reverse=True,
                )

                selected = [
                    (
                        candidates[index],
                        float(scores[index]),
                    )
                    for index in ranked_indexes[
                        :per_standard
                    ]
                ]

            if not selected:
                selected = [
                    (
                        candidate,
                        0.0,
                    )
                    for candidate in candidates[
                        :per_standard
                    ]
                ]

            standard = standard_by_id[
                standard_id
            ]

            for candidate, bm25_score in selected:
                results.append(
                    {
                        "chunk_id": candidate["id"],
                        "content": candidate["content"],
                        "page_number": candidate[
                            "page_number"
                        ],
                        "document_id": standard[
                            "document_id"
                        ],
                        "is_number": standard[
                            "is_number"
                        ],
                        "year": standard["year"],
                        "title": standard["title"],
                        "pdf_url": standard["pdf_url"],
                        "exact_standard_match": True,
                        "exact_standard_number": standard[
                            "is_number"
                        ],
                        "exact_requested_number": standard[
                            "is_number"
                        ],
                        "exact_bm25_score": bm25_score,
                    }
                )

        return results

    finally:
        db.close()