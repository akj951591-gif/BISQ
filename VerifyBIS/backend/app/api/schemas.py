from pydantic import BaseModel
from typing import List


class ComplianceFinding(BaseModel):
    requirement: str
    assessment: str
    evidence: str
    source: str
    page: int | None = None


class ComplianceSource(BaseModel):
    source: int
    document_id: str | None = None
    is_number: str | None = None
    year: int | None = None
    title: str | None = None
    page_number: int | None = None
    pdf_url: str | None = None
    score: float | None = None


class ComplianceResponse(BaseModel):
    product: str
    status: str
    summary: str
    findings: List[ComplianceFinding]
    sources: List[ComplianceSource]