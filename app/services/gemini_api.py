import google.generativeai as genai
import logging
from .sync_rate_limiter import SyncRateLimiter
from .cache import response_cache
from app.config import Config  # Import API key from config

class GeminiServiceSingleton:
    def __init__(self):
        self.api_key = Config.GOOGLE_API_KEY
        self.enabled = bool(self.api_key)

        if not self.enabled:
            logging.warning("GOOGLE_API_KEY is not set. GeminiService will be disabled.")
            return

        # Initialize rate limiter (60 requests per minute, burst 10)
        self.rate_limiter = SyncRateLimiter(rate_limit=60, per_seconds=60, burst_limit=10)

        self.model = None
        self._initialize_model()

        self.system_prompt = """You are Yara, a friendly and helpful AI voice assistant.
        You have a warm, conversational personality and provide clear, concise responses.
        Keep your responses natural and engaging, as if speaking to a friend.
        If asked about your identity, you are Yara, an AI assistant created to help users
        with various tasks through voice and text interaction."""

    def _initialize_model(self):
        try:
            genai.configure(api_key=self.api_key)

            # Primary model - choose a valid one
            model_name = "models/gemini-2.5-pro"
            try:
                self.model = genai.GenerativeModel(model_name)
                logging.info(f"Successfully initialized Gemini model: {model_name}")
                return
            except Exception as model_error:
                logging.warning(f"Failed to initialize primary model '{model_name}': {model_error}")

            # Fallback models
            alternative_models = [
                "models/gemini-pro-latest",
                "models/gemini-2.5-flash",
                "models/gemini-2.5-pro-preview-06-05"
            ]
            for alt_model in alternative_models:
                try:
                    self.model = genai.GenerativeModel(alt_model)
                    logging.info(f"Successfully initialized alternative model: {alt_model}")
                    return
                except Exception as e:
                    logging.warning(f"Failed to initialize {alt_model}: {e}")

            raise ValueError("Could not initialize any available Gemini model")

        except Exception as e:
            logging.error(f"Failed to initialize Gemini API: {e}")
            raise

    def _check_api_availability(self):
        if not self.enabled:
            raise Exception("The AI service is disabled. Set GOOGLE_API_KEY.")
        if not self.model:
            raise Exception("The AI model is not initialized.")

    def _generate_content_sync(self, prompt: str):
        self._check_api_availability()
        try:
            response = self.rate_limiter.execute(self.model.generate_content, prompt)
            return response
        except Exception as e:
            if "quota exceeded" in str(e).lower():
                raise Exception("Free tier quota exceeded.")
            raise

    def generate_response(self, message: str) -> str:
        if not self.enabled:
            return "The AI service is disabled. Set GOOGLE_API_KEY."
        try:
            full_prompt = f"{self.system_prompt}\n\nUser: {message}\nYara:"

            # Check cache first
            cached_response = response_cache.get(full_prompt)
            if cached_response:
                return cached_response

            response = self._generate_content_sync(full_prompt)
            response_text = response.text.strip()

            # Cache the response
            response_cache.set(full_prompt, response_text)
            return response_text

        except Exception as e:
            error_msg = str(e).lower()
            if "quota exceeded" in error_msg:
                logging.warning(f"Gemini API quota exceeded: {e}")
                return "I'm operating on a free tier with limited requests. Try again later."
            elif "daily request limit" in error_msg:
                logging.warning("Daily request limit reached")
                return "I've reached my daily message limit. Try again tomorrow."
            else:
                logging.error(f"Gemini API error: {e}")
                return "I'm having trouble processing your request. Try again."

    def get_chat_response(self, message: str, context: list = None) -> str:
        if not self.enabled:
            return "The AI service is disabled. Set GOOGLE_API_KEY."
        try:
            conversation = f"{self.system_prompt}\n\nConversation history summary:"

            if context:
                if len(context) > 5:
                    conversation += "\nEarlier messages: "
                    conversation += ", ".join([
                        f"{'User' if chat['is_user'] else 'Yara'} said: {chat['message'][:50]}..."
                        for chat in context[:-5]
                    ])
                conversation += "\n\nRecent messages:\n"
                for chat in context[-5:]:
                    role = "User" if chat['is_user'] else "Yara"
                    conversation += f"{role}: {chat['message']}\n"

            conversation += f"User: {message}\nYara:"

            cached_response = response_cache.get(conversation)
            if cached_response:
                return cached_response

            response = self._generate_content_sync(conversation)
            response_text = response.text.strip()
            response_cache.set(conversation, response_text)
            return response_text

        except Exception as e:
            logging.error(f"Gemini API error in get_chat_response: {e}")
            return "I'm having trouble processing your request right now. Try again."

# ---- Instantiate using Config ----
gemini_service = GeminiServiceSingleton()
