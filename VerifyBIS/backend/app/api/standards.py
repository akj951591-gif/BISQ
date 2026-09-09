from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.bis import BISStandard


router = APIRouter(
    prefix="/api/standards",
    tags=["Standards"],
)


def serialize_standard(standard: BISStandard):
    return {
        "id": standard.id,
        "document_id": standard.document_id,
        "is_number": standard.is_number,
        "year": standard.year,
        "title": standard.title,
        "amendments": standard.amendments,
        "committee": standard.committee,
        "equivalent": standard.equivalent,
        "superseding": standard.superseding,
        "supersede_by": standard.supersede_by,
        "division": standard.division,
        "pdf_url": standard.pdf_url,
        "txt_url": standard.txt_url,
    }


@router.get("")
def get_standards(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    try:
        total = db.query(BISStandard).count()

        standards = (
            db.query(BISStandard)
            .order_by(BISStandard.is_number.asc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return {
            "count": len(standards),
            "total": total,
            "limit": limit,
            "offset": offset,
            "standards": [
                serialize_standard(standard)
                for standard in standards
            ],
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.get("/search")
def search_standards(
    q: str = Query(..., min_length=1),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    try:
        query = q.strip()

        pattern = f"%{query}%"

        standards = (
            db.query(BISStandard)
            .filter(
                or_(
                    BISStandard.is_number.ilike(pattern),
                    BISStandard.document_id.ilike(pattern),
                    BISStandard.title.ilike(pattern),
                    BISStandard.committee.ilike(pattern),
                    BISStandard.division.ilike(pattern),
                    BISStandard.equivalent.ilike(pattern),
                    BISStandard.superseding.ilike(pattern),
                    BISStandard.supersede_by.ilike(pattern),
                )
            )
            .order_by(BISStandard.is_number.asc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return {
            "query": query,
            "count": len(standards),
            "limit": limit,
            "offset": offset,
            "standards": [
                serialize_standard(standard)
                for standard in standards
            ],
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.get("/{document_id}")
def get_standard(
    document_id: str,
    db: Session = Depends(get_db),
):
    standard = (
        db.query(BISStandard)
        .filter(
            BISStandard.document_id == document_id
        )
        .first()
    )

    if not standard:
        raise HTTPException(
            status_code=404,
            detail="BIS standard not found",
        )

    return serialize_standard(standard)