from flask import Blueprint, request, jsonify
from app.services.wakeword_local import WakeWordDetector
import numpy as np
import logging

wakeword_bp = Blueprint('wakeword', __name__, url_prefix='/wakeword')

# Initialize the detector globally
try:
    wake_word_detector = WakeWordDetector()
except Exception as e:
    logging.error(f"Failed to initialize WakeWordDetector: {e}")
    wake_word_detector = None

@wakeword_bp.route('/api/detect', methods=['POST'], endpoint="wakeword_detect")
def detect_wake_word():
    if not wake_word_detector:
        return jsonify({'error': 'Wake word detector not initialized'}), 500

    try:
        data = request.get_json()
        audio_data_list = data.get('audio_data')

        if not audio_data_list:
            return jsonify({'error': 'Audio data is required'}), 400

        audio_array = np.array(audio_data_list, dtype=np.float32)
        audio_bytes = (audio_array * 32767).astype(np.int16).tobytes()

        is_detected = wake_word_detector.detect(audio_bytes)
        return jsonify({'wake_word_detected': is_detected, 'confidence': wake_word_detector.get_last_confidence()})
    except Exception as e:
        logging.error(f"Error in /api/wakeword/detect: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@wakeword_bp.route('/api/status', methods=['GET'], endpoint="wakeword_status")
def wake_word_status():
    if not wake_word_detector:
        return jsonify({'active': False, 'wake_word': 'N/A', 'sensitivity': 'N/A', 'error': 'Wake word detector not initialized'}), 500

    try:
        return jsonify({'active': wake_word_detector.is_active(), 'wake_word': wake_word_detector.get_wake_word(), 'sensitivity': wake_word_detector.get_sensitivity()})
    except Exception as e:
        logging.error(f"Error getting wake word status: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500
