# AI_VOICE_ASSISTANT_WEB/app/models/chat_history.py
from datetime import datetime
from app.database import db

class ChatHistory(db.Model):
    __tablename__ = 'chat_history'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(255), nullable=False, index=True)
    message = db.Column(db.Text, nullable=False)
    is_user = db.Column(db.Boolean, nullable=False, default=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self):
        return f'<ChatHistory {self.id}: {"User" if self.is_user else "AI"}>'

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'message': self.message,
            'is_user': self.is_user,
            'timestamp': self.timestamp.isoformat()
        }
