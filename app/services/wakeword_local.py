# AI_VOICE_ASSISTANT_WEB/app/services/wakeword_local.py
import vosk
import json
import logging
import os
import urllib.request
import zipfile
import shutil
import time # For get_sensitivity placeholder

class WakeWordDetector:
    MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
    DEFAULT_MODEL_DIR = "vosk-model-small-en-us-0.15" # Consistent default

    def __init__(self, wake_word="yara", model_path=None, sensitivity=0.6):
        self.wake_word = wake_word.lower()
        self.is_listening = False
        self.last_confidence = 0.0 # Added for API
        self.sensitivity = sensitivity # Added for API

        if model_path is None:
            # Use a path relative to the current file for model storage
            self.model_path = os.path.join(os.path.dirname(__file__), self.DEFAULT_MODEL_DIR)
        else:
            self.model_path = model_path

        # Check if the model directory exists and contains expected files
        # Vosk models usually have 'conf', 'graph', 'ivector', 'mfcc', 'resample', 'tri' subdirs/files
        if not os.path.exists(self.model_path) or not os.listdir(self.model_path):
            logging.info(f"Vosk model not found or incomplete at {self.model_path}. Attempting download...")
            self._download_model(self.model_path)

        if not os.path.exists(self.model_path) or not os.listdir(self.model_path):
            logging.error(f"Vosk model still not found at path: {self.model_path} after download attempt.")
            raise FileNotFoundError(f"Vosk model not found at {self.model_path}")

        try:
            self.model = vosk.Model(self.model_path)
            # The grammar for Vosk should include the wake word
            # and potentially other common words to improve recognition
            self.recognizer = vosk.KaldiRecognizer(self.model, 16000, f'["{self.wake_word}", "[unk]"]')
            logging.info("Vosk wake word detector initialized successfully.")
        except Exception as e:
            logging.error(f"Failed to initialize Vosk model from {self.model_path}: {e}")
            raise

    def _download_model(self, target_model_path):
        """Download and extract the Vosk model to the specified target_model_path"""
        zip_filename = os.path.basename(self.MODEL_URL)
        zip_path = os.path.join(os.path.dirname(target_model_path), zip_filename) # Download zip to parent dir

        try:
            if not os.path.exists(os.path.dirname(target_model_path)):
                os.makedirs(os.path.dirname(target_model_path))

            logging.info(f"Downloading Vosk model from {self.MODEL_URL} to {zip_path}...")
            urllib.request.urlretrieve(self.MODEL_URL, zip_path)

            logging.info(f"Extracting Vosk model to {target_model_path}...")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # Extract all contents to the parent directory of target_model_path
                # This usually creates a folder like 'vosk-model-small-en-us-0.15'
                zip_ref.extractall(os.path.dirname(target_model_path))

            # After extraction, the model might be in a subfolder (e.g., 'vosk-model-small-en-us-0.15')
            # We need to ensure the target_model_path points to the actual model content.
            extracted_folder_name = zip_filename.replace(".zip", "")
            extracted_full_path = os.path.join(os.path.dirname(target_model_path), extracted_folder_name)

            if extracted_full_path != target_model_path and os.path.exists(extracted_full_path):
                # If the extracted folder is not exactly the target_model_path, move its contents
                # This handles cases where the zip contains a single root folder
                logging.info(f"Moving contents from {extracted_full_path} to {target_model_path}")
                if not os.path.exists(target_model_path):
                    os.makedirs(target_model_path)
                for item in os.listdir(extracted_full_path):
                    shutil.move(os.path.join(extracted_full_path, item), target_model_path)
                shutil.rmtree(extracted_full_path) # Remove the now empty extracted folder

            logging.info("Cleaning up downloaded zip file...")
            os.remove(zip_path)
            logging.info("Vosk model downloaded and extracted successfully!")

        except Exception as e:
            logging.error(f"Error downloading or extracting Vosk model: {e}")
            # Clean up any partial downloads/extractions
            if os.path.exists(zip_path):
                os.remove(zip_path)
            if os.path.exists(target_model_path) and not os.listdir(target_model_path):
                shutil.rmtree(target_model_path)
            raise

    def detect(self, audio_data: bytes) -> bool:
        """
        Detects the wake word in the given audio data.
        Vosk's simple result doesn't provide a direct confidence score for the wake word.
        We'll simulate one based on detection.
        """
        if self.recognizer.AcceptWaveform(audio_data):
            result = json.loads(self.recognizer.Result())
            text = result.get("text", "")
            if self.wake_word in text:
                logging.info(f"Wake word '{self.wake_word}' detected in: '{text}'")
                self.last_confidence = 1.0 # Set to 1.0 if detected
                return True
        self.last_confidence = 0.0 # Reset if not detected
        return False

    def is_active(self) -> bool:
        return self.is_listening

    def start_listening(self):
        self.is_listening = True
        logging.info("Wake word listening started.")

    def stop_listening(self):
        self.is_listening = False
        logging.info("Wake word listening stopped.")

    def get_wake_word(self) -> str:
        return self.wake_word

    def set_wake_word(self, word: str):
        self.wake_word = word.lower()
        # Re-initialize recognizer with the new wake word
        # This assumes the model is already loaded
        if hasattr(self, 'model') and self.model:
            self.recognizer = vosk.KaldiRecognizer(self.model, 16000, f'["{self.wake_word}", "[unk]"]')
            logging.info(f"Wake word changed to: {self.wake_word}")
        else:
            logging.warning("Model not loaded, cannot change wake word for active recognizer.")

    def get_last_confidence(self) -> float:
        """Returns the confidence of the last wake word detection."""
        return self.last_confidence

    def get_sensitivity(self) -> float:
        """Returns the current sensitivity setting."""
        return self.sensitivity

    def set_sensitivity(self, sensitivity: float):
        """Sets the sensitivity for wake word detection (placeholder for Vosk)."""
        # Vosk doesn't have a direct sensitivity parameter like some other engines.
        # Sensitivity would typically be managed by adjusting thresholds on the client-side
        # or by modifying the Vosk grammar/model if possible.
        # For now, this is just a setter for the stored value.
        self.sensitivity = max(0.1, min(1.0, sensitivity))
        logging.info(f"Wake word sensitivity set to: {self.sensitivity}")

