from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/leaderboard"
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Leaderboard API"

    class Config:
        case_sensitive = True

settings = Settings()