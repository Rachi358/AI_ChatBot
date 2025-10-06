from flask import Blueprint, request, jsonify

api = Blueprint("api", __name__)

chat_history = []  # Temporary in-memory storage

@api.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "")

    bot_response = f"Echo: {user_message}"

    chat_history.append({"user": user_message, "bot": bot_response})
    return jsonify({"response": bot_response})

@api.route("/api/chat/history", methods=["GET"])
def history():
    return jsonify(chat_history)
