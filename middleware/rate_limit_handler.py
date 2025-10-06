from functools import wraps
from flask import jsonify
import logging

def handle_rate_limit_errors(f):
    """Decorator to handle rate limit errors gracefully"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            error_message = str(e).lower()
            
            if "quota exceeded" in error_message or "rate limit" in error_message:
                logging.warning(f"Rate limit error: {e}")
                return jsonify({
                    'error': 'rate_limit_exceeded',
                    'message': ('The service is experiencing high demand. '
                              'Please try again in a few moments.'),
                    'retry_after': 10  # Suggest retry after 10 seconds
                }), 429
            
            # Re-raise other exceptions
            raise
    
    return decorated_function