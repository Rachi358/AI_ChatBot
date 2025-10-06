# AI_VOICE_ASSISTANT_WEB/app/__init__.py
from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from app.config import Config
import logging
import os

db = SQLAlchemy()
from app.database import db

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

    # Init database
    db.init_app(app)

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # Register blueprints
    from app.routes.chat import chat_bp
    from app.routes.voice import voice_bp
    from app.routes.wakeword import wakeword_bp

    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(voice_bp, url_prefix="/api/voice")
    app.register_blueprint(wakeword_bp, url_prefix="/api/wakeword")

    # Main routes
    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/chat")
    def chat_page():
        return render_template("chat.html")

    def page_not_found(e):
        return render_template("404.html"), 404
    app.register_error_handler(404, page_not_found)

    # Global error handler
    @app.errorhandler(Exception)
    def handle_exception(e):
        app.logger.error(f"Unhandled Exception: {e}", exc_info=True)
        return render_template("error.html", error_message=str(e)), 500

    # Create tables
    with app.app_context():
        db.create_all()

    return app
