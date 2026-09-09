from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, Text

from app.db.session import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    tender_id = Column(Integer, nullable=True, index=True)

    report_type = Column(
        Text,
        nullable=False,
        default="compliance",
    )

    title = Column(Text, nullable=False)

    content = Column(Text, nullable=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )