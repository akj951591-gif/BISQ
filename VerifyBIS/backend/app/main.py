from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.standards import router as standards_router
from app.api.auth import router as auth_router
from app.core.config import settings
from app.db.session import Base, engine
from app.api.search import router as search_router
from app.models import user  # noqa: F401  (registers the model with Base.metadata)
from app.api.tenders import router as tenders_router
from app.api.reports import router as reports_router
from app.api.dashboard import router as dashboard_router
from app.api.graph import router as graph_router
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(search_router)
app.include_router(standards_router)
app.include_router(tenders_router)
app.include_router(reports_router)
app.include_router(dashboard_router)
app.include_router(graph_router)
@app.get("/api/health")
def health():
    return {"status": "ok"}
