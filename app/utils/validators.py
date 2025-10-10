import os
import logging

logger = logging.getLogger(__name__)

def validate_environment():
    """
    Validate required environment variables are set.
    Returns True if all required vars are present, False otherwise.
    """
    required_vars = {
        'SECRET_KEY': 'Flask secret key for session management',
        'GOOGLE_API_KEY': 'Google Generative AI API key',
        'DATABASE_URL': 'PostgreSQL database connection string'
    }

    missing_vars = []
    placeholder_vars = []

    for var, description in required_vars.items():
        value = os.getenv(var)

        if not value:
            missing_vars.append(f"{var} ({description})")
        elif value in ['your-secret-key-change-this-in-production', 'use-your-key', 'your-google-api-key-here']:
            placeholder_vars.append(f"{var} (currently using placeholder value)")

    if missing_vars:
        logger.error("Missing required environment variables:")
        for var in missing_vars:
            logger.error(f"  - {var}")
        return False

    if placeholder_vars:
        logger.warning("Using placeholder values for:")
        for var in placeholder_vars:
            logger.warning(f"  - {var}")
        logger.warning("Please update these in your .env file for production use")

    return True

def validate_database_connection():
    """
    Validate database connection string format.
    """
    db_url = os.getenv('DATABASE_URL', '')

    if db_url.startswith('sqlite://'):
        logger.warning("Using SQLite database. For production, use PostgreSQL (Supabase)")
        return True
    elif db_url.startswith('postgresql://'):
        logger.info("Using PostgreSQL database")
        return True
    else:
        logger.error(f"Invalid database URL format: {db_url[:20]}...")
        return False
