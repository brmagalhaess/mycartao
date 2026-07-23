from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
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


settings = Settings()
