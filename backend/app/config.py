from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    # production | development | empty = auto (https PUBLIC_APP_URL → production)
    app_env: str = ""
    public_app_url: str = "http://localhost:3000"
    cors_origins: str = "http://localhost:3000"
    jwt_secret: str = "change-me"
    jwt_expire_minutes: int = 10080
    database_url: str
    brevo_api_key: str = ""
    brevo_sender_email: str = "noreply@example.com"
    brevo_sender_name: str = "MyCartao"
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_pro: str = ""
    minio_endpoint: str = "minio:9000"
    minio_public_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "mycartao"
    minio_use_ssl: bool = False

    def is_production(self) -> bool:
        env = (self.app_env or "").strip().lower()
        if env in {"production", "prod"}:
            return True
        if env in {"development", "dev", "local", "test"}:
            return False
        return self.public_app_url.lower().startswith("https://")

    def stripe_mode(self) -> str:
        key = (self.stripe_secret_key or "").strip()
        if key.startswith("sk_live_"):
            return "live"
        if key.startswith("sk_test_"):
            return "test"
        return "unset"


settings = Settings()
