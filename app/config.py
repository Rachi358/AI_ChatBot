import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

class Config:
    # Flask core
    SECRET_KEY = os.environ.get("SECRET_KEY", "the-random-string")
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=60)

    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///yara_assistant.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # API Keys
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")  # Optional fallback for TTS

    # Wake Word Settings
    WAKE_WORD = "yara"
    WAKE_WORD_SENSITIVITY = 0.6

    # Voice Settings
    TTS_SERVICE = "edge-tts"       # Free and fast option
    STT_SERVICE = "web-speech-api" # Browser-based
