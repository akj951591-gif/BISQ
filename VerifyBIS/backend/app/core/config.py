from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "StandardsIQ API"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: str = "sqlite:///./standardsiq.db"

    UPLOAD_DIR: str = "uploads"

    MAX_FILE_SIZE_MB: int = 25

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()