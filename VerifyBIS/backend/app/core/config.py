from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "BISQ API"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: str = "sqlite:///./BISQ.db"

    UPLOAD_DIR: str = "uploads"

    MAX_FILE_SIZE_MB: int = 25

    FRONTEND_URL: str = "http://localhost:5173"

    GOOGLE_CLIENT_ID: str = ""

    JWT_SECRET_KEY: str = "dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    SESSION_COOKIE_NAME: str = "verifybis_session"
    SESSION_COOKIE_SECURE: bool = False

    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str = "password"
    NEO4J_DATABASE: str = "neo4j"
    BIS_MANIFEST_PATH: str = ""
    BIS_DATA_DIR: str = "data"
    BIS_DOCUMENT_DIR: str = "data/documents"
    BIS_TEXT_DIR: str = "data/text"
    GROQ_API_KEY: str = ""

    # OCR runs only on pages whose text layer is missing or too thin, so these
    # bound the fallback rather than the common path.
    OCR_ENABLED: bool = True
    OCR_LANGUAGE: str = "eng"
    # 300 DPI is the accuracy/speed sweet spot for Tesseract; below ~200 it
    # starts misreading small type, above 400 it costs time for no gain.
    OCR_DPI: int = 300
    # Page segmentation mode 3 = fully automatic, which suits the mixed
    # headings, tables and body text of BIS standards and tenders.
    OCR_PSM: int = 3
    OCR_MAX_WORKERS: int = 4
    # Ceiling on pages OCR'd per document, so one large scan cannot stall a
    # request indefinitely.
    OCR_MAX_PAGES: int = 50
    # A page with fewer characters than this is treated as having no real text
    # layer (scans often carry a stray header or page number).
    OCR_MIN_CHARS: int = 20
    # Set only when the tesseract binary is not on PATH (common on Windows).
    OCR_TESSERACT_CMD: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()