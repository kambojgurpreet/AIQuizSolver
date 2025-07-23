"""
Quiz processing routes
"""

import asyncio
from typing import List
from fastapi import APIRouter, HTTPException
from schemas.requests import QuestionRequest, BatchRequest
from schemas.responses import AnswerResponse, BatchAnswerResponse
from services.ai_service import get_ai_answer
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["quiz"])


@router.post("/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    """
    Process a single quiz question - Main endpoint for Chrome extension
    """
    try:
        logger.info(f"Processing question: {request.question[:50]}...")
        result = await get_ai_answer(request.question, request.options)
        return result
    except Exception as e:
        logger.error(f"Error in /ask endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask-batch", response_model=List[BatchAnswerResponse])
async def ask_questions_batch(request: BatchRequest):
    """
    Process multiple questions in parallel for better performance
    """
    try:
        logger.info(f"Processing batch of {len(request.questions)} questions")
        
        async def process_question(index: int, question_data) -> BatchAnswerResponse:
            try:
                result = await get_ai_answer(question_data.question, question_data.options)
                return BatchAnswerResponse(
                    index=index,
                    answer=result.answer,
                    confidence=result.confidence,
                    raw=result.raw
                )
            except Exception as e:
                logger.error(f"Error processing question {index}: {e}")
                return BatchAnswerResponse(
                    index=index,
                    error=str(e)
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
                    error=str(result)
                ))
            else:
                processed_results.append(result)
        
        logger.info(f"Batch processing completed: {len(processed_results)} results")
        return processed_results
        
    except Exception as e:
        logger.error(f"Error in batch processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))
