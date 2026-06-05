from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    GOOGLE_CLIENT_ID: str = "your-google-client-id-here.apps.googleusercontent.com"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()