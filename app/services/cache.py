from functools import lru_cache
from datetime import datetime, timedelta
import logging

class ResponseCache:
    """Simple cache for API responses with time-based expiration"""
    
    def __init__(self, max_size=100, ttl_seconds=3600):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.cache = {}
    
    def get(self, key):
        """Get a cached response if it exists and hasn't expired"""
        if key in self.cache:
            item = self.cache[key]
            if datetime.now() - item['timestamp'] < timedelta(seconds=self.ttl_seconds):
                logging.info("Cache hit")
                return item['response']
            else:
                logging.info("Cache expired")
                del self.cache[key]
        return None
    
    def set(self, key, response):
        """Cache a response with timestamp"""
        if len(self.cache) >= self.max_size:
            # Remove oldest item
            oldest = min(self.cache.items(), key=lambda x: x[1]['timestamp'])
            del self.cache[oldest[0]]
        
        self.cache[key] = {
            'response': response,
            'timestamp': datetime.now()
        }
    
    def clear(self):
        """Clear all cached responses"""
        self.cache.clear()

# Create a global cache instance
response_cache = ResponseCache()