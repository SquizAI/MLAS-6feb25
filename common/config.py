import os

class Config:
    SERVICE_NAME = os.getenv("SERVICE_NAME", "unknown_service")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    # Add any other common configuration settings here.

config = Config() 