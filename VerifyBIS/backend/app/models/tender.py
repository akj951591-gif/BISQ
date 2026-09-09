from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, JSON, Text

from app.db.session import Base


class TenderAnalysis(Base):
    __tablename__ = "tender_analyses"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    filename = Column(
        Text,
        nullable=True,
    )

    tender_text = Column(
        Text,
        nullable=False,
    )

    status = Column(
        Text,
        nullable=False,
        default="NEEDS_EVIDENCE",
    )

    summary = Column(
        Text,
        nullable=True,
    )

    findings = Column(
        JSON,
        nullable=False,
        default=list,
    )

    sources = Column(
        JSON,
        nullable=False,
        default=list,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )