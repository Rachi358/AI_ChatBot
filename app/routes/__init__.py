from flask import Flask
from app.database import db
from app.routes.main import main_bp
from app.routes.chat import chat_bp
from app.routes.voice import voice_bp
from app.routes.wakeword import wakeword_bp
from app.routes.api import api


def create_app():
    app = Flask(__name__)

    # Config
    app.config['SECRET_KEY'] = 'your-secret-key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize DB
    db.init_app(app)

    # -------------------------
    # Register Blueprints
    # -------------------------
    # Keep url_prefix consistent and centralized here
    app.register_blueprint(main_bp, url_prefix="")          # index, home, etc.
    app.register_blueprint(chat_bp, url_prefix="/api/chat") # chat routes
    app.register_blueprint(voice_bp, url_prefix="/api/voice") 
    app.register_blueprint(wakeword_bp, url_prefix="/api/wakeword")
    app.register_blueprint(api, url_prefix="/api")          # general API routes

    # Create DB tables
    with app.app_context():
        db.create_all()

    return app


# Entry point
app = create_app()
