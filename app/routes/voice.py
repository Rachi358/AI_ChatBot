from flask import Blueprint, request, jsonify, session
from app.services.gemini_api import gemini_service
from app.services.tts_api import TTSService
from app.models.chat_history import ChatHistory
from app.database import db
import uuid
import base64

# Use /api/voice as the base prefix so it matches frontend
voice_bp = Blueprint('voice', __name__, url_prefix='/api/voice')

@voice_bp.route('/process', methods=['POST'])
def process_voice():
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Get or create session ID
        if 'session_id' not in session:
            session['session_id'] = str(uuid.uuid4())
        session_id = session['session_id']
        
        # Save user message
        user_chat = ChatHistory(session_id=session_id, message=text, is_user=True)
        db.session.add(user_chat)
        
        # AI response
        ai_response = gemini_service.generate_response(text)
        
        # Save AI response
        ai_chat = ChatHistory(session_id=session_id, message=ai_response, is_user=False)
        db.session.add(ai_chat)
        db.session.commit()
        
        # TTS
        tts_service = TTSService()
        audio_data = tts_service.text_to_speech(ai_response)
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        return jsonify({
            'response': ai_response,
            'audio': audio_base64,
            'session_id': session_id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
