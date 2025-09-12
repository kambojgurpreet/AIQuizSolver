"""
Quiz processing routes with multi-model AI support
"""

import asyncio
from typing import List
from fastapi import APIRouter, HTTPException, Query
from schemas.requests import QuestionRequest, BatchRequest
from schemas.responses import AnswerResponse, BatchAnswerResponse
from services.ai_service import get_ai_answer
from services.multi_model_service import get_multi_model_answer
from services.cache_service import get_cache_stats, clear_caches, save_caches_now
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["quiz"])


@router.post("/ask", response_model=AnswerResponse)
async def ask_question(
    request: QuestionRequest,
    multi_model: bool = Query(default=False, description="Use multi-model analysis")
):
    """
    Process a single quiz question - Main endpoint for Chrome extension
    Supports both single model (GPT 4.1) and multi-model analysis (GPT 4.1 + Gemini 2.5 Pro + Grok 4)
    """
    try:
        logger.info(f"🔍 /ask endpoint - multi_model parameter: {multi_model} (type: {type(multi_model)})")
        logger.info(f"Processing question with multi_model={multi_model}: {request.question[:50]}...")
        
        if multi_model:
            logger.info("🧠 Using multi-model analysis")
            result = await get_multi_model_answer(request.question, request.options)
        else:
            logger.info("🚀 Using single model analysis")
            result = await get_ai_answer(request.question, request.options)
            
        return result
    except Exception as e:
        logger.error(f"Error in /ask endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask-batch", response_model=List[BatchAnswerResponse])
async def ask_questions_batch(
    request: BatchRequest,
    multi_model: bool = Query(default=False, description="Use multi-model analysis")
):
    """
    Process multiple questions in parallel for better performance
    Supports both single model and multi-model analysis
    """
    try:
        logger.info(f"🔍 /ask-batch endpoint - multi_model parameter: {multi_model} (type: {type(multi_model)})")
        logger.info(f"Processing batch of {len(request.questions)} questions with multi_model={multi_model}")
        
        async def process_question(index: int, question_data) -> BatchAnswerResponse:
            try:
                if multi_model:
                    logger.info(f"🧠 Q{index+1}: Using multi-model analysis")
                    result = await get_multi_model_answer(question_data.question, question_data.options)
                else:
                    logger.info(f"🚀 Q{index+1}: Using single model analysis")
                    result = await get_ai_answer(question_data.question, question_data.options)
                
                # Ensure result is not None
                if result is None:
                    return BatchAnswerResponse(
                        index=index,
                        error_message="Model returned None result"
                    )
                    
                batch_response = BatchAnswerResponse(
                    index=index,
                    answer=getattr(result, 'answer', None),
                    confidence=getattr(result, 'confidence', None),
                    raw=getattr(result, 'raw', None),
                    reasoning=getattr(result, 'reasoning', None)
                )
                
                # Add multi-model specific fields if available
                if hasattr(result, 'consensus'):
                    batch_response.consensus = result.consensus
                if hasattr(result, 'individual_answers'):
                    batch_response.individual_answers = result.individual_answers
                    
                return batch_response
                
            except Exception as e:
                logger.error(f"Error processing question {index}: {e}")
                return BatchAnswerResponse(
                    index=index,
                    error_message=str(e)
                )
        
        # Process questions in parallel with asyncio
        tasks = [
            process_question(i, question) 
            for i, question in enumerate(request.questions)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle any exceptions in results
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append(BatchAnswerResponse(
                    index=i,
                    error_message=str(result)
                ))
            elif result is None:
                processed_results.append(BatchAnswerResponse(
                    index=i,
                    error_message="Received None result from question processing"
                ))
            elif isinstance(result, BatchAnswerResponse):
                processed_results.append(result)
            else:
                # Unexpected result type
                processed_results.append(BatchAnswerResponse(
                    index=i,
                    error_message=f"Unexpected result type: {type(result)}"
                ))
        
        logger.info(f"Batch processing completed: {len(processed_results)} results")
        return processed_results
        
    except Exception as e:
        logger.error(f"Error in batch processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cache-stats")
async def get_cache_statistics():
    """
    Get cache statistics for all AI models
    Shows how many responses are cached for each model
    """
    try:
        stats = get_cache_stats()
        return {
            "status": "success",
            "cache_stats": stats,
            "message": "Cache statistics retrieved successfully"
        }
    except Exception as e:
        logger.error(f"Error getting cache stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clear-cache")
async def clear_all_caches():
    """
    Clear all model caches and remove cache files
    Use this to reset cached responses for all models
    """
    try:
        clear_caches()
        return {
            "status": "success",
            "message": "All model caches cleared and cache files removed"
        }
    except Exception as e:
        logger.error(f"Error clearing caches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-cache")
async def save_caches():
    """
    Manually save all caches to disk
    Useful for ensuring caches are persisted without waiting for auto-save
    """
    try:
        save_caches_now()
        stats = get_cache_stats()
        return {
            "status": "success",
            "message": "All caches saved to disk successfully",
            "cache_stats": stats
        }
    except Exception as e:
        logger.error(f"Error saving caches: {e}")
        raise HTTPException(status_code=500, detail=str(e))
