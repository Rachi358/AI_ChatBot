import speech_recognition as sr
import io
import logging

class STTService:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = 4000
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.pause_threshold = 0.8
        self.recognizer.phrase_threshold = 0.3
    
    def speech_to_text(self, audio_data: bytes) -> str:
        """Convert speech to text using Google Speech Recognition (free)"""
        try:
            # Convert bytes to AudioFile
            audio_file = sr.AudioFile(io.BytesIO(audio_data))
            
            with audio_file as source:
                # Record the audio data
                audio = self.recognizer.record(source)
            
            # Use Google Speech Recognition (free tier)
            text = self.recognizer.recognize_google(audio)
            return text.strip()
        
        except sr.UnknownValueError:
            return ""  # Could not understand audio
        except sr.RequestError as e:
            logging.error(f"STT API error: {e}")
            return ""
        except Exception as e:
            logging.error(f"STT error: {e}")
            return ""
    
    def listen_from_microphone(self, timeout=5, phrase_time_limit=10):
        """Listen directly from microphone (for server-side usage)"""
        try:
            with sr.Microphone() as source:
                # Adjust for ambient noise
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
                
                # Listen for audio
                audio = self.recognizer.listen(
                    source, 
                    timeout=timeout, 
                    phrase_time_limit=phrase_time_limit
                )
            
            # Convert to text
            text = self.recognizer.recognize_google(audio)
            return text.strip()
        
        except sr.WaitTimeoutError:
            return ""  # No speech detected
        except sr.UnknownValueError:
            return ""  # Could not understand audio
        except sr.RequestError as e:
            logging.error(f"STT API error: {e}")
            return ""
        except Exception as e:
            logging.error(f"STT error: {e}")
            return ""