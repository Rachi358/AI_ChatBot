import time
from threading import Lock
import logging

class SyncRateLimiter:
    """Token bucket algorithm implementation for rate limiting"""
    
    def __init__(self, rate_limit=60, per_seconds=60, burst_limit=None):
        self.rate_limit = rate_limit  # Number of tokens per time period
        self.per_seconds = per_seconds  # Time period in seconds
        self.burst_limit = burst_limit or rate_limit  # Maximum tokens allowed
        
        self.tokens = self.burst_limit  # Current token count
        self.last_update = time.time()  # Last token update timestamp
        self.lock = Lock()  # Thread safety lock
    
    def _add_tokens(self):
        """Add new tokens based on elapsed time"""
        now = time.time()
        elapsed = now - self.last_update
        new_tokens = (elapsed * self.rate_limit) / self.per_seconds
        
        self.tokens = min(self.burst_limit, self.tokens + new_tokens)
        self.last_update = now
    
    def execute(self, func, *args, max_retries=3, **kwargs):
        """
        Execute a function with rate limiting and retry logic.
        
        Args:
            func: Function to execute
            *args: Positional arguments for the function
            max_retries: Maximum number of retries
            **kwargs: Keyword arguments for the function
        """
        retries = 0
        while retries <= max_retries:
            with self.lock:
                self._add_tokens()
                if self.tokens >= 1:
                    self.tokens -= 1
                    try:
                        return func(*args, **kwargs)
                    except Exception as e:
                        if "quota exceeded" in str(e).lower() and retries < max_retries:
                            wait_time = (2 ** retries) + (time.time() % 1)
                            logging.warning(f"API quota exceeded. Waiting {wait_time:.2f} seconds before retry.")
                            time.sleep(wait_time)
                            retries += 1
                            continue
                        raise
            
            # If we don't have enough tokens, wait
            wait_time = (2 ** retries) + (time.time() % 1)
            logging.warning(f"Rate limit exceeded. Waiting {wait_time:.2f} seconds before retry.")
            time.sleep(wait_time)
            retries += 1
            
        raise Exception("Max retries exceeded due to rate limiting")