"""
Cache service for persistent storage of AI model responses
Handles file-based caching with automatic persistence and memory management
"""

import json
import atexit
import hashlib
import logging
import asyncio
from pathlib import Path
from typing import Dict, Optional, List
from concurrent.futures import ThreadPoolExecutor

from schemas.responses import ModelResponse

logger = logging.getLogger(__name__)

# Cache configuration
CACHE_SIZE = 10000  # Number of cached responses per model
CACHE_DIR = Path("cache")  # Directory to store cache files


class CacheManager:
    """Manages persistent caches for AI model responses with background saving"""
    
    def __init__(self, cache_size: int = CACHE_SIZE, cache_dir: Path = CACHE_DIR):
        self.cache_size = cache_size
        self.cache_dir = cache_dir
        
        # Thread pool for background operations
        self.executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="cache-worker")
        
        # Track pending saves to avoid duplicate operations
        self._pending_saves = set()
        
        # Ensure cache directory exists
        self.cache_dir.mkdir(exist_ok=True)
        
        # Define cache file paths
        self.cache_files = {
            "openai": self.cache_dir / "openai_cache.json",
            "gemini": self.cache_dir / "gemini_cache.json", 
            "xai": self.cache_dir / "xai_cache.json"
        }
        
        # Initialize separate caches for each model
        self._caches = {
            "openai": {},
            "gemini": {},
            "xai": {}
        }
        
        # Load existing caches from disk
        self._load_all_caches()
        
        # Note: atexit registration is done globally, not per instance
    
    def _serialize_model_response(self, response: ModelResponse) -> dict:
        """Convert ModelResponse to dictionary for JSON serialization"""
        return {
            "model": response.model,
            "answer": response.answer,
            "confidence": response.confidence,
            "raw": response.raw,
            "reasoning": response.reasoning,
            "error": getattr(response, 'error', False)
        }
    
    def _deserialize_model_response(self, data: dict) -> ModelResponse:
        """Convert dictionary back to ModelResponse"""
        return ModelResponse(
            model=data["model"],
            answer=data["answer"],
            confidence=data["confidence"],
            raw=data["raw"],
            reasoning=data.get("reasoning"),
            error=data.get("error", False)
        )
    
    def _load_cache_from_file(self, cache_file: Path) -> Dict[str, ModelResponse]:
        """Load cache from JSON file"""
        if not cache_file.exists():
            logger.info(f"Cache file {cache_file} does not exist, starting with empty cache")
            return {}
        
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Convert dict back to ModelResponse objects
            cache = {}
            for key, response_data in data.items():
                cache[key] = self._deserialize_model_response(response_data)
            
            logger.info(f"Loaded {len(cache)} cached responses from {cache_file}")
            return cache
        
        except Exception as e:
            logger.error(f"Error loading cache from {cache_file}: {e}")
            return {}
    
    def _save_cache_to_file(self, cache: Dict[str, ModelResponse], cache_file: Path) -> None:
        """Save cache to JSON file (synchronous)"""
        try:
            # Convert ModelResponse objects to dictionaries
            data = {}
            for key, response in cache.items():
                data[key] = self._serialize_model_response(response)
            
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            logger.debug(f"Saved {len(cache)} cached responses to {cache_file}")
        
        except Exception as e:
            logger.error(f"Error saving cache to {cache_file}: {e}")
    
    def _save_cache_to_file_background(self, model_name: str) -> None:
        """Background thread function to save specific model cache"""
        try:
            cache = self._caches[model_name].copy()  # Copy to avoid threading issues
            cache_file = self.cache_files[model_name]
            self._save_cache_to_file(cache, cache_file)
            logger.debug(f"Background save completed for {model_name} cache")
        except Exception as e:
            logger.error(f"Background save failed for {model_name}: {e}")
        finally:
            # Remove from pending saves
            self._pending_saves.discard(model_name)
    
    async def _save_cache_async(self, model_name: str) -> None:
        """Asynchronously save cache for specific model in background"""
        if model_name in self._pending_saves:
            logger.debug(f"Save already pending for {model_name}, skipping duplicate")
            return
        
        if model_name not in self._caches:
            logger.warning(f"Unknown model name for async save: {model_name}")
            return
        
        self._pending_saves.add(model_name)
        
        # Run the save operation in background thread
        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(
                self.executor, 
                self._save_cache_to_file_background, 
                model_name
            )
        except Exception as e:
            logger.error(f"Async save error for {model_name}: {e}")
            self._pending_saves.discard(model_name)
    
    def _load_all_caches(self) -> None:
        """Load all caches from disk on startup"""
        logger.info("Loading persistent caches from disk...")
        
        for model_name, cache_file in self.cache_files.items():
            self._caches[model_name] = self._load_cache_from_file(cache_file)
        
        total_cached = sum(len(cache) for cache in self._caches.values())
        logger.info(f"Loaded {total_cached} total cached responses from disk")
    
    def _save_all_caches(self) -> None:
        """Save all caches to disk"""
        logger.info("Saving persistent caches to disk...")
        
        for model_name, cache in self._caches.items():
            self._save_cache_to_file(cache, self.cache_files[model_name])
        
        total_cached = sum(len(cache) for cache in self._caches.values())
        logger.info(f"Saved {total_cached} total cached responses to disk")
    
    def create_cache_key(self, question: str, options: List[str]) -> str:
        """Create a cache key for question+options combination"""
        content = f"{question}|{'|'.join(options)}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def get_from_cache(self, model_name: str, cache_key: str) -> Optional[ModelResponse]:
        """Get response from specific model cache"""
        if model_name not in self._caches:
            logger.warning(f"Unknown model name: {model_name}")
            return None
        return self._caches[model_name].get(cache_key)
    
    def add_to_cache(self, model_name: str, cache_key: str, response: ModelResponse) -> None:
        """Add response to specific model cache with size limit and background auto-save"""
        if model_name not in self._caches:
            logger.warning(f"Unknown model name: {model_name}")
            return
        
        cache = self._caches[model_name]
        
        # Implement FIFO eviction if cache is full
        if len(cache) >= self.cache_size:
            # Remove oldest entry
            oldest_key = next(iter(cache))
            del cache[oldest_key]
        
        # Add new response
        cache[cache_key] = response
        
        # Schedule background save (non-blocking)
        try:
            # Check if we're in an async context and can create tasks
            try:
                asyncio.get_running_loop()
                # We're in an async context, create task for background save
                asyncio.create_task(self._save_cache_async(model_name))
                logger.debug(f"Scheduled background save for {model_name} cache")
            except RuntimeError:
                # No event loop running, fall back to synchronous save
                logger.debug(f"No event loop running, falling back to synchronous save for {model_name}")
                self._save_cache_to_file(cache, self.cache_files[model_name])
        except Exception as e:
            logger.error(f"Error scheduling background save for {model_name}: {e}")
            # Fallback to synchronous save if async fails
            try:
                self._save_cache_to_file(cache, self.cache_files[model_name])
                logger.debug(f"Fallback synchronous save completed for {model_name}")
            except Exception as fallback_error:
                logger.error(f"Fallback save also failed for {model_name}: {fallback_error}")
    
    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache statistics for monitoring"""
        stats = {}
        total_cached = 0
        
        for model_name, cache in self._caches.items():
            cache_size = len(cache)
            stats[f"{model_name}_cache_size"] = cache_size
            total_cached += cache_size
        
        stats.update({
            "total_cached_responses": total_cached,
            "cache_size_limit": self.cache_size
        })
        
        return stats
    
    def clear_all_caches(self) -> None:
        """Clear all model caches and remove cache files"""
        # Log who is calling this method for debugging
        import traceback
        logger.warning("🚨 CLEAR_ALL_CACHES CALLED! Stack trace:")
        for line in traceback.format_stack():
            logger.warning(f"   {line.strip()}")
        
        for model_name in self._caches:
            self._caches[model_name].clear()
        
        # Also remove cache files
        for cache_file in self.cache_files.values():
            try:
                if cache_file.exists():
                    cache_file.unlink()
                    logger.warning(f"🗑️  Removed cache file: {cache_file}")
            except Exception as e:
                logger.error(f"Error removing cache file {cache_file}: {e}")
        
        logger.warning("🚨 All model caches cleared and cache files removed")
    
    def save_caches_now(self) -> None:
        """Manually trigger cache save (useful for periodic saves)"""
        self._save_all_caches()
    
    def shutdown(self) -> None:
        """Graceful shutdown - save all caches and cleanup resources"""
        logger.info("Cache manager shutting down...")
        
        # Prevent multiple shutdowns
        if hasattr(self, '_shutdown_called') and self._shutdown_called:
            logger.info("Shutdown already called, skipping...")
            return
        
        self._shutdown_called = True
        
        # Wait for any pending background saves to complete
        if self._pending_saves:
            logger.info(f"Waiting for {len(self._pending_saves)} pending saves to complete...")
            # Give background saves time to finish
            import time
            max_wait = 2.0  # Maximum 2 seconds
            waited = 0.0
            while self._pending_saves and waited < max_wait:
                time.sleep(0.1)
                waited += 0.1
            
            if self._pending_saves:
                logger.warning(f"Timeout waiting for {len(self._pending_saves)} pending saves: {self._pending_saves}")
        
        # Save all caches synchronously before shutdown
        logger.info("Saving all caches before shutdown...")
        self._save_all_caches()
        
        # Shutdown the thread pool
        if hasattr(self, 'executor') and self.executor:
            logger.info("Shutting down thread pool...")
            self.executor.shutdown(wait=True)
            logger.info("Thread pool shutdown complete")
        
        logger.info("✅ Cache manager shutdown complete - files preserved")
    
    def get_cache_for_model(self, model_name: str) -> Dict[str, ModelResponse]:
        """Get the entire cache dictionary for a specific model (for internal use)"""
        if model_name not in self._caches:
            logger.warning(f"Unknown model name: {model_name}")
            return {}
        return self._caches[model_name]


# Global cache manager instance
cache_manager = CacheManager()

# Register graceful shutdown on program exit
atexit.register(cache_manager.shutdown)

# Convenience functions for backward compatibility
def create_cache_key(question: str, options: List[str]) -> str:
    """Create a cache key for question+options combination"""
    return cache_manager.create_cache_key(question, options)

def get_from_cache(model_name: str, cache_key: str) -> Optional[ModelResponse]:
    """Get response from specific model cache"""
    return cache_manager.get_from_cache(model_name, cache_key)

def add_to_cache(model_name: str, cache_key: str, response: ModelResponse) -> None:
    """Add response to specific model cache with size limit and auto-save"""
    cache_manager.add_to_cache(model_name, cache_key, response)

def get_cache_stats() -> Dict[str, int]:
    """Get cache statistics for monitoring"""
    return cache_manager.get_cache_stats()

def clear_caches() -> None:
    """Clear all model caches and remove cache files"""
    cache_manager.clear_all_caches()

def save_caches_now() -> None:
    """Manually trigger cache save (useful for periodic saves)"""
    cache_manager.save_caches_now()
