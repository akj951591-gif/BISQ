from fastapi import APIRouter, HTTPException, Query

from app.services.hybrid_search import hybrid_search
from app.services.rag_service import generate_rag_answer
from app.services.compliance_service import analyze_compliance

router = APIRouter(
    prefix="/api/search",
    tags=["Search"]
)
@router.get("/compliance")
def compliance(
    product: str = Query(..., min_length=10),
    limit: int = Query(8, ge=1, le=15)
):
    try:
        return analyze_compliance(
            product_description=product,
            limit=limit
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

@router.get("")
def search(
    q: str = Query(..., min_length=2),
    limit: int = Query(5, ge=1, le=20)
):
    try:
        results = hybrid_search(
            query=q,
            limit=limit
        )

        return {
            "query": q,
            "count": len(results),
            "results": results
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@router.get("/ask")
def ask(
    q: str = Query(..., min_length=2),
    limit: int = Query(5, ge=1, le=10)
):
    try:
        result = generate_rag_answer(
            query=q,
            limit=limit
        )

        return result

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )