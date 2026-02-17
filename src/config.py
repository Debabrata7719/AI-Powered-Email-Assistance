"""
DataCrew AI Email Assistant - Configuration Module

Centralized configuration management for the application.
Loads environment variables and validates required settings.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Email Configuration
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_APP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD")
SENDER_NAME = os.getenv("SENDER_NAME", "Debabrata Dey")


# Validate required settings
def validate_config():
    """Validate that all required configuration is present."""
    errors = []

    if not GROQ_API_KEY:
        errors.append("GROQ_API_KEY not found in .env file")
    if not EMAIL_ADDRESS:
        errors.append("EMAIL_ADDRESS not found in .env file")
    if not EMAIL_APP_PASSWORD:
        errors.append("EMAIL_APP_PASSWORD not found in .env file")

    if errors:
        error_msg = "Configuration errors:\n" + "\n".join(f"  - {e}" for e in errors)
        raise ValueError(error_msg)


# Validate on import
validate_config()
