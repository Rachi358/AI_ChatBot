import edge_tts
import asyncio
import io
import logging

class TTSService:
    def __init__(self):
        self.voice = "en-US-AriaNeural"  # Natural female voice
        self.rate = "+0%"
        self.volume = "+0%"
    
    def text_to_speech(self, text: str) -> bytes:
        """Convert text to speech using Edge TTS (free and fast)"""
        try:
            return asyncio.run(self._generate_speech(text))
        except Exception as e:
            logging.error(f"TTS error: {e}")
            return b""  # Return empty bytes on error
    
    async def _generate_speech(self, text: str) -> bytes:
        """Async method to generate speech"""
        communicate = edge_tts.Communicate(
            text, 
            self.voice, 
            rate=self.rate, 
            volume=self.volume
        )
        
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        
        return audio_data
    
    def get_available_voices(self):
        """Get list of available voices"""
        return asyncio.run(self._get_voices())
    
    async def _get_voices(self):
        """Get available voices asynchronously"""
        voices = await edge_tts.list_voices()
        return [
            {
                'name': voice['Name'],
                'short_name': voice['ShortName'],
                'gender': voice['Gender'],
                'locale': voice['Locale']
            }
            for voice in voices
        ]
    
    def set_voice(self, voice_name: str):
        """Change the TTS voice"""
        self.voice = voice_name
    
    def set_rate(self, rate: str):
        """Set speech rate (e.g., '+50%', '-20%')"""
        self.rate = rate
    
    def set_volume(self, volume: str):
        """Set speech volume (e.g., '+50%', '-20%')"""
        self.volume = volume