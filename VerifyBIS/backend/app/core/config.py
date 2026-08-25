from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "StandardsIQ API"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: str = "sqlite:///./standardsiq.db"

    UPLOAD_DIR: str = "uploads"

    MAX_FILE_SIZE_MB: int = 25

    FRONTEND_URL: str = "http://localhost:5173"

    GOOGLE_CLIENT_ID: str = ""

    JWT_SECRET_KEY: str = "dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    SESSION_COOKIE_NAME: str = "verifybis_session"
    SESSION_COOKIE_SECURE: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()