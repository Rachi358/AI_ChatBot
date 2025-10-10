# app/routes/chat.py

from flask import Blueprint, request, jsonify, session, render_template
from app.services.gemini_api import gemini_service
from app.models.chat_history import ChatHistory
from app.database import db
import uuid

chat_bp = Blueprint("chat_bp", __name__, url_prefix="/api/chat")

@chat_bp.route("/")
def chat_page():
    return render_template("chat.html")

@chat_bp.route("", methods=["POST"])
def chat_api():
    try:
        data = request.get_json()
        message = data.get("message", "").strip()
        if not message:
            return jsonify({"error": "Message is required"}), 400

        if "session_id" not in session:
            session["session_id"] = str(uuid.uuid4())
        session_id = session["session_id"]

        user_chat = ChatHistory(session_id=session_id, message=message, is_user=True)
        db.session.add(user_chat)

        ai_response = gemini_service.generate_response(message)

        ai_chat = ChatHistory(session_id=session_id, message=ai_response, is_user=False)
        db.session.add(ai_chat)
        db.session.commit()

        return jsonify({"response": ai_response, "session_id": session_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chat_bp.route("/history", methods=["GET"])
def get_chat_history():
    try:
        session_id = session.get("session_id")
        if not session_id:
            return jsonify({"history": []})

        history = (
            ChatHistory.query
            .filter_by(session_id=session_id)
            .order_by(ChatHistory.timestamp)
            .all()
        )

        return jsonify({
            "history": [
                {
                    "message": c.message,
                    "is_user": c.is_user,
                    "timestamp": c.timestamp.isoformat()
                }
                for c in history
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
