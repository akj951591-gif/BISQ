from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.bis import BISStandard, BISChunk
from app.models.tender import TenderAnalysis
from app.models.report import Report


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("")
def get_dashboard(
    db: Session = Depends(get_db),
):
    total_standards = (
        db.query(func.count(BISStandard.id))
        .scalar()
        or 0
    )

    total_chunks = (
        db.query(func.count(BISChunk.id))
        .scalar()
        or 0
    )

    total_tenders = (
        db.query(func.count(TenderAnalysis.id))
        .scalar()
        or 0
    )

    total_reports = (
        db.query(func.count(Report.id))
        .scalar()
        or 0
    )

    compliant = (
        db.query(func.count(TenderAnalysis.id))
        .filter(
            TenderAnalysis.status.ilike("%COMPLIANT%")
        )
        .scalar()
        or 0
    )

    needs_evidence = (
        db.query(func.count(TenderAnalysis.id))
        .filter(
            TenderAnalysis.status.ilike("%NEEDS_EVIDENCE%")
        )
        .scalar()
        or 0
    )

    non_compliant = (
        db.query(func.count(TenderAnalysis.id))
        .filter(
            TenderAnalysis.status.ilike("%NON_COMPLIANT%")
        )
        .scalar()
        or 0
    )

    recent_tenders = (
        db.query(TenderAnalysis)
        .order_by(
            TenderAnalysis.created_at.desc()
        )
        .limit(5)
        .all()
    )

    return {
        "stats": {
            "total_standards": total_standards,
            "total_chunks": total_chunks,
            "total_tenders": total_tenders,
            "total_reports": total_reports,
            "compliant": compliant,
            "needs_evidence": needs_evidence,
            "non_compliant": non_compliant,
        },
        "recent_tenders": [
            {
                "id": tender.id,
                "filename": tender.filename,
                "status": tender.status,
                "summary": tender.summary,
                "created_at": (
                    tender.created_at.isoformat()
                    if tender.created_at
                    else None
                ),
                "findings_count": len(
                    tender.findings or []
                ),
            }
            for tender in recent_tenders
        ],
    }