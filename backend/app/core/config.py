from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings and environment configuration."""

    PROJECT_NAME: str = "Reddit Copilot"
    API_V1_STR: str = "/api"

    # Database configuration (defaults to local SQLite if PostgreSQL not specified)
    DATABASE_URL: str = "sqlite:///./reddit_copilot.db"

    # CORS origins allowed to communicate with the backend
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Frontend URL for OAuth redirects
    FRONTEND_URL: str = "http://localhost:3000"

    # Secret key for session JWT signing
    SECRET_KEY: str = "development_secret_key_change_in_production_32bytes"
    SESSION_COOKIE_NAME: str = "reddit_copilot_session"
    SESSION_EXPIRE_DAYS: int = 30

    # Reddit OAuth App Credentials
    REDDIT_CLIENT_ID: str = ""
    REDDIT_CLIENT_SECRET: str = ""
    REDDIT_REDIRECT_URI: str = "http://localhost:8000/api/auth/reddit/callback"
    REDDIT_USER_AGENT: str = "web:reddit-copilot:v0.1.0 (by /u/dev)"
    REDDIT_AUTH_SCOPES: str = "identity read history mysubreddits vote submit privatemessages"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
