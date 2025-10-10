from flask import Flask, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from app.config import Config
from app.database import db
from app.utils import validate_environment, validate_database_connection
import logging
import sys
import os

def create_app():
    # Load .env
    load_dotenv()

    app = Flask(__name__)

    # Load from config.py
    app.config.from_object(Config)

    # Override if needed
    app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "fallback-secret")
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL", "sqlite:///chat_history.db")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Enable CORS for all routes
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Init database
    db.init_app(app)

    # Configure logging
    logging.basicConfig(
        level=logging.DEBUG if app.config.get('DEBUG') else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('app.log')
        ]
    )

    logger = logging.getLogger(__name__)

    # Validate environment variables
    if not validate_environment():
        logger.error("Environment validation failed. Please check your .env file")
        logger.error("Copy .env.example to .env and fill in the required values")

    # Validate database connection
    if not validate_database_connection():
        logger.error("Database configuration is invalid")

    # Register blueprints
    from app.routes.chat import chat_bp
    from app.routes.voice import voice_bp
    from app.routes.wakeword import wakeword_bp

    app.register_blueprint(chat_bp)
    app.register_blueprint(voice_bp)
    app.register_blueprint(wakeword_bp)

    # Main routes
    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/chat")
    def chat_page():
        return render_template("chat.html")

    @app.route("/health")
    def health_check():
        """Health check endpoint for monitoring"""
        try:
            db.session.execute('SELECT 1')
            return {"status": "healthy", "database": "connected"}, 200
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {"status": "unhealthy", "database": "disconnected", "error": str(e)}, 500

    def page_not_found(e):
        return render_template("404.html"), 404
    app.register_error_handler(404, page_not_found)

    # Global error handler
    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.error(f"Unhandled Exception: {e}", exc_info=True)
        error_message = str(e) if app.config.get('DEBUG') else "An unexpected error occurred"
        return render_template("error.html", error_message=error_message), 500

    # Create tables
    with app.app_context():
        db.create_all()

    return app
