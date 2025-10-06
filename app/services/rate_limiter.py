import time
from threading import Lock
import logging

class RateLimiter:
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
    
    def acquire(self, tokens=1, timeout=None):
        """
        Attempt to acquire tokens. Returns True if successful, False if rate limited.
        
        Args:
            tokens (int): Number of tokens to acquire
            timeout (float): Maximum time to wait for tokens in seconds
        """
        start_time = time.time()
        
        with self.lock:
            while True:
                self._add_tokens()
                
                if self.tokens >= tokens:
                    self.tokens -= tokens
                    return True
                
                if timeout is not None:
                    if time.time() - start_time >= timeout:
                        return False
                    
                    # Wait a small amount before trying again
                    time.sleep(0.1)
                else:
                    return False
    
    def wait(self, tokens=1):
        """
        Wait until tokens are available.
        
        Args:
            tokens (int): Number of tokens needed
        """
        while not self.acquire(tokens, timeout=0.1):
            time.sleep(0.1)

class APIRateLimiter:
    """Rate limiter specifically for API calls with retry logic"""
    
    def __init__(self, rate_limit=60, per_seconds=60, burst_limit=None, max_retries=3):
        self.rate_limiter = RateLimiter(rate_limit, per_seconds, burst_limit)
        self.max_retries = max_retries
    
    async def execute_with_retry(self, func, *args, **kwargs):
        """
        Execute a function with rate limiting and retry logic.
        
        Args:
            func: Async function to execute
            *args: Positional arguments for func
            **kwargs: Keyword arguments for func
        """
        retries = 0
        
        while retries <= self.max_retries:
            if not self.rate_limiter.acquire():
                wait_time = (2 ** retries) + (time.time() % 1)  # Exponential backoff with jitter
                logging.warning(f"Rate limit exceeded. Waiting {wait_time:.2f} seconds before retry.")
                time.sleep(wait_time)
                retries += 1
                continue
            
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                if "quota exceeded" in str(e).lower() and retries < self.max_retries:
                    wait_time = (2 ** retries) + (time.time() % 1)
                    logging.warning(f"API quota exceeded. Waiting {wait_time:.2f} seconds before retry.")
                    time.sleep(wait_time)
                    retries += 1
                else:
                    raise
        
        raise Exception("Max retries exceeded due to rate limiting")