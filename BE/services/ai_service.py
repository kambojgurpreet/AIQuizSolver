"""
AI service for quiz processing using OpenAI GPT models
"""

import os
import re
import logging
from typing import List, Tuple, Optional
from datetime import datetime
from fastapi import HTTPException
from openai import AsyncOpenAI
from schemas.responses import AnswerResponse

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger(__name__)

# Global client variable
_openai_client: Optional[AsyncOpenAI] = None


def get_openai_client() -> AsyncOpenAI:
    """
    Get or create OpenAI client with lazy initialization
    """
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        _openai_client = AsyncOpenAI(api_key=api_key)
    return _openai_client


def parse_answer_response(response_content: str) -> Tuple[str, int]:
    """
    Parse AI response to extract answer and confidence with enhanced regex patterns
    """
    try:
        # Strategy 1: Look for explicit Answer: pattern
        answer_match = re.search(r'[Aa]nswer:\s*([A-Da-d])', response_content)
        if answer_match:
            answer = answer_match.group(1).upper()
        else:
            # Strategy 2: Look for standalone letter patterns
            letter_matches = re.findall(r'\b([A-Da-d])\b', response_content)
            if letter_matches:
                answer = letter_matches[0].upper()
            else:
                # Strategy 3: Fallback to first found letter
                all_letters = re.findall(r'([A-Da-d])', response_content)
                answer = all_letters[0].upper() if all_letters else "A"
        
        # Enhanced confidence parsing with multiple patterns
        confidence_patterns = [
            r'[Cc]onfidence:\s*(\d+)',
            r'[Cc]onfidence\s+[Ll]evel:\s*(\d+)',
            r'(\d+)/10',
            r'(\d+)\s*out\s*of\s*10',
            r'[Cc]ertain.*?(\d+)',
        ]
        
        confidence = 8  # Default confidence
        for pattern in confidence_patterns:
            conf_match = re.search(pattern, response_content)
            if conf_match:
                confidence = min(10, max(1, int(conf_match.group(1))))
                break
        
        return answer, confidence
        
    except Exception as e:
        logger.warning(f"Error parsing response: {e}")
        return "A", 8


async def get_ai_answer(question: str, options: List[str]) -> AnswerResponse:
    """
    Get AI answer for a single question with enhanced error handling
    """
    try:
        # Format options properly
        formatted_options = []
        for i, option in enumerate(options):
            letter = chr(65 + i)  # A, B, C, D
            formatted_options.append(f"{letter}. {option}")
        
        options_text = "\n".join(formatted_options)
        
        # Enhanced prompt for better accuracy
        prompt = f"""You are an expert quiz assistant. Analyze this question carefully and provide the best answer.

Question: {question}

Options:
{options_text}

Instructions:
1. Think through each option systematically
2. Choose the most accurate answer
3. Provide your confidence level (1-10)

Format your response as:
Answer: [A/B/C/D]
Confidence: [1-10]
Reasoning: [Brief explanation]"""

        # Get OpenAI client
        openai_client = get_openai_client()

        response = await openai_client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": "You are a highly accurate quiz assistant. Always provide clear, confident answers in the requested format."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.1  # Low temperature for consistency
        )
        
        response_content = response.choices[0].message.content
        answer, confidence = parse_answer_response(response_content)
        
        logger.info(f"Question processed: {question[:50]}... -> Answer: {answer} (Confidence: {confidence})")
        
        return AnswerResponse(
            answer=answer,
            confidence=confidence,
            raw=response_content,
            model="gpt-4.1"
        )
        
    except Exception as e:
        logger.error(f"Error getting AI answer: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
