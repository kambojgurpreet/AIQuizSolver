"""
Multi-model AI service for quiz processing using OpenAI GPT-4.1, Google Gemini, and xAI Grok
"""

import os
import re
import asyncio
import logging
from typing import List, Tuple, Optional
from fastapi import HTTPException

# AI Model imports
from openai import AsyncOpenAI
from google import genai
from google.genai import types

# Schema imports
from schemas.responses import AnswerResponse, ModelResponse, MultiModelAnalysis

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger(__name__)

# Global client variables
_openai_client: Optional[AsyncOpenAI] = None
_xai_client: Optional[AsyncOpenAI] = None
_gemini_client: Optional[genai.Client] = None


def get_openai_client() -> AsyncOpenAI:
    """Get or create OpenAI client with lazy initialization"""
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        _openai_client = AsyncOpenAI(api_key=api_key)
    return _openai_client


def get_xai_client() -> AsyncOpenAI:
    """Get or create xAI Grok client with lazy initialization"""
    global _xai_client
    if _xai_client is None:
        api_key = os.getenv("XAI_API_KEY")
        if not api_key:
            raise ValueError("XAI_API_KEY environment variable is required")
        _xai_client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.x.ai/v1"
        )
    return _xai_client


def configure_gemini():
    """Configure Google Gemini with lazy initialization"""
    global _gemini_client
    if _gemini_client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        _gemini_client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(api_version='v1')
        )
    return _gemini_client


def parse_answer_response(response_content: str, model_name: str) -> Tuple[str, int, str]:
    """Parse AI response to extract answer, confidence, and reasoning"""
    try:

        logger.info(f"Parsing response from {model_name}")
        logger.info(f"Response content: {response_content}")

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
        
        # Enhanced confidence parsing
        confidence_patterns = [
            r'[Cc]onfidence:\s*(\d+)',
            r'[Cc]onfidence\s+[Ll]evel:\s*(\d+)',
            r'(\d+)/10',
            r'(\d+)\s*out\s*of\s*10',
        ]
        
        confidence = 1  # Default confidence
        for pattern in confidence_patterns:
            conf_match = re.search(pattern, response_content)
            if conf_match:
                confidence = min(10, max(1, int(conf_match.group(1))))
                break
        
        # Extract reasoning
        reasoning_patterns = [
            r'[Rr]easoning:\s*(.+?)(?:\n|$)',
            r'[Ee]xplanation:\s*(.+?)(?:\n|$)',
            r'[Jj]ustification:\s*(.+?)(?:\n|$)',
            r'[Bb]ecause:\s*(.+?)(?:\n|$)',
        ]
        
        reasoning = "No reasoning provided"
        for pattern in reasoning_patterns:
            reasoning_match = re.search(pattern, response_content, re.DOTALL)
            if reasoning_match:
                reasoning = reasoning_match.group(1).strip()
                break
        
        # If no explicit reasoning found, try to extract everything after the confidence
        if reasoning == "No reasoning provided":
            # Look for content after confidence line
            after_confidence = re.search(r'[Cc]onfidence:\s*\d+\s*(.+)', response_content, re.DOTALL)
            if after_confidence:
                potential_reasoning = after_confidence.group(1).strip()
                if len(potential_reasoning) > 10:  # Only use if substantial content
                    reasoning = potential_reasoning
        
        return answer, confidence, reasoning
        
    except Exception as e:
        logger.warning(f"Error parsing {model_name} response: {e}")
        return "A", 1, f"Error parsing reasoning from {model_name}"


async def get_openai_answer(question: str, options: List[str]) -> ModelResponse:
    """Get answer from OpenAI GPT-4.1"""
    try:
        formatted_options = []
        for i, option in enumerate(options):
            letter = chr(65 + i)  # A, B, C, D
            formatted_options.append(f"{letter}. {option}")
        
        options_text = "\n".join(formatted_options)
        
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

        openai_client = get_openai_client()
        
        response = await openai_client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": "You are a highly accurate quiz assistant. Always provide clear, confident answers in the requested format."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.1
        )
        
        response_content = response.choices[0].message.content
        answer, confidence, reasoning = parse_answer_response(response_content, "gpt-4.1")
        
        return ModelResponse(
            model="gpt-4.1",
            answer=answer,
            confidence=confidence,
            raw=response_content,
            reasoning=reasoning
        )
        
    except Exception as e:
        logger.error(f"Error getting OpenAI answer: {e}")
        # Return error response instead of raising exception
        return ModelResponse(
            model="gpt-4.1",
            answer="A",  # Arbitrary fallback answer
            confidence=1,  # Minimum confidence for failed request
            raw=f"OpenAI Error: {str(e)}",
            reasoning="Error: OpenAI model failed to respond",
            error=True
        )


async def get_gemini_answer(question: str, options: List[str]) -> ModelResponse:
    """Get answer from Google Gemini"""
    try:
        gemini_client = configure_gemini()
        
        formatted_options = []
        for i, option in enumerate(options):
            letter = chr(65 + i)  # A, B, C, D
            formatted_options.append(f"{letter}. {option}")
        
        options_text = "\n".join(formatted_options)
        
        prompt = f"""Analyze this educational quiz question and select the most accurate answer.

            Question: {question}

            Options:
            {options_text}

            Please provide:
            1. Your selected answer (A, B, C, or D)
            2. Your confidence level (1-10 scale)
            3. Brief reasoning

            Format your response as:
            Answer: [A/B/C/D]
            Confidence: [1-10]
            Reasoning: [Brief explanation]"""

        # check time taken by each requests to get response
        logger.info("Sending request to Gemini model...")
        # Start time
        start_time = asyncio.get_event_loop().time()

        response = await asyncio.to_thread(
            gemini_client.models.generate_content,
            model='gemini-2.5-pro',
            contents=prompt,
            # config={"tools": [{"google_search": {}}]}
        )

        # end time
        end_time = asyncio.get_event_loop().time()
        elapsed_time = end_time - start_time
        logger.info(f"Gemini response received in {elapsed_time:.2f} seconds")

        # Handle safety filtering and blocked responses
        if not response.candidates or not response.candidates[0].content.parts:
            # Check finish reason
            finish_reason = response.candidates[0].finish_reason if response.candidates else None
            logger.warning(f"Gemini response blocked - finish_reason: {finish_reason}")
            
            # Return a default response when blocked
            return ModelResponse(
                model="gemini-2.5-pro",
                answer="A",  # Default answer
                confidence=0,  # Low confidence due to blocking
                raw=f"Response blocked by safety filters (finish_reason: {finish_reason})",
                reasoning="Content blocked by safety filters"
            )
        
        response_content = response.text
        answer, confidence, reasoning = parse_answer_response(response_content, "gemini-2.5-pro")
        
        return ModelResponse(
            model="gemini-2.5-pro",
            answer=answer,
            confidence=confidence,
            raw=response_content,
            reasoning=reasoning
        )
        
    except Exception as e:
        logger.error(f"Error getting Gemini answer: {e}")
        # Return error response instead of raising exception
        return ModelResponse(
            model="gemini-2.5-pro",
            answer="B",  # Arbitrary fallback answer (different from OpenAI)
            confidence=1,  # Minimum confidence for failed request
            raw=f"Gemini Error: {str(e)}",
            reasoning="Error: Gemini model failed to respond",
            error=True
        )


async def get_xai_answer(question: str, options: List[str]) -> ModelResponse:
    """Get answer from xAI Grok"""
    try:
        formatted_options = []
        for i, option in enumerate(options):
            letter = chr(65 + i)  # A, B, C, D
            formatted_options.append(f"{letter}. {option}")
        
        options_text = "\n".join(formatted_options)
        
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

        xai_client = get_xai_client()
        
        response = await xai_client.chat.completions.create(
            model="grok-4",
            messages=[
                {"role": "system", "content": "You are a highly accurate quiz assistant. Always provide clear, confident answers in the requested format."},
                {"role": "user", "content": prompt}
            ],
            # max_tokens=150,
            # temperature=0.1
        )

        logger.info(100*"-")
        logger.info("Received response from xAI Grok model")
        logger.info(f"xAI response content: {response}")
        logger.info(100*"-")
        
        response_content = response.choices[0].message.content
        answer, confidence, reasoning = parse_answer_response(response_content, "grok-4")
        
        return ModelResponse(
            model="grok-4",
            answer=answer,
            confidence=confidence,
            raw=response_content,
            reasoning=reasoning
        )
        
    except Exception as e:
        logger.error(f"Error getting xAI answer: {e}")
        # Return error response instead of raising exception
        return ModelResponse(
            model="grok-4",
            answer="C",  # Arbitrary fallback answer (different from others)
            confidence=1,  # Minimum confidence for failed request
            raw=f"xAI Error: {str(e)}",
            reasoning="Error: xAI Grok model failed to respond",
            error=True
        )


def analyze_model_responses(model_responses: List[ModelResponse]) -> MultiModelAnalysis:
    """Analyze responses from multiple models to determine consensus and confidence"""
    try:
        answers = [resp.answer for resp in model_responses]
        confidences = [resp.confidence for resp in model_responses]
        
        avg_confidence = sum(confidences) / len(confidences)
        
        unique_answers = list(set(answers))
        consensus = len(unique_answers) == 1
        
        if consensus:
            consensus_answer = unique_answers[0]
            conflicting_answers = []
        else:
            consensus_answer = None
            conflicting_answers = unique_answers
        
        return MultiModelAnalysis(
            consensus=consensus,
            consensus_answer=consensus_answer,
            avg_confidence=round(avg_confidence, 1),
            conflicting_answers=conflicting_answers,
            ai_model_responses=model_responses
        )
        
    except Exception as e:
        logger.error(f"Error analyzing model responses: {e}")
        return MultiModelAnalysis(
            consensus=False,
            consensus_answer=None,
            avg_confidence=5.0,
            conflicting_answers=[resp.answer for resp in model_responses],
            ai_model_responses=model_responses
        )


async def get_multi_model_answer(question: str, options: List[str]) -> AnswerResponse:
    """Get answers from multiple AI models and analyze consensus"""
    try:
        logger.info(f"Processing multi-model question: {question[:50]}...")
        
        # Get responses from all models in parallel
        tasks = [
            get_openai_answer(question, options),
            get_gemini_answer(question, options),
            get_xai_answer(question, options)
        ]
        
        # Execute all tasks and handle exceptions gracefully
        model_responses = await asyncio.gather(*tasks, return_exceptions=False)
        
        # All responses should now be ModelResponse objects (including error responses)
        valid_responses = [resp for resp in model_responses if isinstance(resp, ModelResponse)]
        error_responses = [resp for resp in valid_responses if getattr(resp, 'error', False)]
        successful_responses = [resp for resp in valid_responses if not getattr(resp, 'error', False)]
        
        logger.info(f"Multi-model results: {len(successful_responses)} successful, {len(error_responses)} errors")
        
        if not valid_responses:
            logger.error("No valid responses from any AI models")
            # This should not happen with the new error handling, but keeping as fallback
            return AnswerResponse(
                answer="A",
                confidence=1,
                raw="All AI models failed to respond. This is a fallback answer.",
                model="fallback",
                consensus=False,
                individual_answers={}
            )
        
        # Modified consensus analysis: If ANY model fails, consensus is automatically FALSE
        if error_responses:
            # Force consensus to False when any model fails
            consensus_result = False
            consensus_answer = None
            logger.info(f"Consensus set to False due to {len(error_responses)} failed model(s)")
        else:
            # Only analyze consensus when all models are successful
            analysis = analyze_model_responses(successful_responses)
            consensus_result = analysis.consensus
            consensus_answer = analysis.consensus_answer
        
        # Determine primary answer and confidence
        primary_reasoning = ""
        if successful_responses and consensus_result and not error_responses:
            # True consensus only when all models succeed and agree
            analysis = analyze_model_responses(successful_responses)
            primary_answer = analysis.consensus_answer
            primary_confidence = int(round(analysis.avg_confidence))
            highlight_type = "single"
            raw_response = f"Consensus achieved: {analysis.consensus_answer} (Average confidence: {analysis.avg_confidence})"
            # Combine reasoning from successful models for consensus
            reasoning_parts = [resp.reasoning for resp in successful_responses if resp.reasoning and resp.reasoning != "No reasoning provided" and not resp.reasoning.startswith("Error:")]
            primary_reasoning = " | ".join(reasoning_parts[:2]) if reasoning_parts else "All models agree on this answer"
        else:
            # No consensus due to model failures or answer conflicts
            # Analyze all available responses to get statistics
            analysis = analyze_model_responses(valid_responses)
            
            # Use highest confidence answer as primary (prefer successful responses)
            if successful_responses:
                highest_conf_response = max(successful_responses, key=lambda x: x.confidence)
            else:
                highest_conf_response = max(valid_responses, key=lambda x: x.confidence)
            primary_answer = highest_conf_response.answer
            primary_confidence = int(round(analysis.avg_confidence))
            primary_reasoning = highest_conf_response.reasoning or "Selected highest confidence answer from available models"
            highlight_type = "multiple"
            
            # Build descriptive raw response
            if error_responses and successful_responses:
                # Mixed success/failure scenario
                raw_response = f"No consensus: {len(error_responses)} model(s) failed, remaining models disagree"
            elif error_responses:
                # All models failed scenario
                raw_response = f"No consensus: All {len(error_responses)} model(s) failed"
            else:
                # All models succeeded but disagree
                raw_response = f"No consensus: Models disagree - {', '.join(analysis.conflicting_answers)} (Average confidence: {analysis.avg_confidence})"
        
        logger.info(f"Multi-model analysis complete: {len(successful_responses)} successful, {len(error_responses)} errors, Consensus: {consensus_result}")
        
        # Create individual_answers dictionary for the extension
        individual_answers = {}
        for resp in valid_responses:
            individual_answers[resp.model] = {
                "answer": resp.answer,
                "confidence": resp.confidence,
                "reasoning": resp.reasoning or "No reasoning provided",
                "error": getattr(resp, 'error', False)
            }
        
        # Create analysis object for response (use consensus_result)
        if error_responses:
            # When any model fails, create a modified analysis that reflects no consensus
            final_analysis = MultiModelAnalysis(
                consensus=False,
                consensus_answer=None,
                avg_confidence=analysis.avg_confidence if 'analysis' in locals() else 1.0,
                conflicting_answers=list(set([resp.answer for resp in valid_responses])),
                ai_model_responses=valid_responses
            )
        else:
            # Use the original analysis when all models succeed
            final_analysis = analysis
        
        return AnswerResponse(
            answer=primary_answer,
            confidence=primary_confidence,
            raw=raw_response,
            reasoning=primary_reasoning,
            model="multi-model",
            multi_model_analysis=final_analysis,
            highlight_type=highlight_type,
            consensus=consensus_result,  # Use the forced consensus result
            individual_answers=individual_answers
        )
        
    except Exception as e:
        logger.error(f"Error in multi-model processing: {e}")
        raise HTTPException(status_code=500, detail=f"Multi-model service error: {str(e)}")
