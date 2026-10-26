from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "SafePath-AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    EXECUTION_MODE: str = "DEMO"  # DEMO, RESEARCH, LIVE
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "*"]
    
    # Optional Third-Party Map & Geospatial API Keys
    MAPBOX_API_KEY: Optional[str] = None
    NEXT_PUBLIC_MAPBOX_TOKEN: Optional[str] = None
    OPENROUTESERVICE_API_KEY: Optional[str] = None
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    OPENWEATHER_API_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

