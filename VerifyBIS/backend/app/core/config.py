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

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()