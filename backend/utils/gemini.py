# backend/utils/gemini.py
"""
Gemini AI helper functions and classes for SabkiSoch API
"""

import google.generativeai as genai
from constants import (
    GEMINI_MODEL_NAME,
    EMBEDDING_MODEL_NAME,
    TITLE_GENERATION_PROMPT,
    MAX_TITLE_LENGTH
)


class GeminiEmbeddingFunction:
    """Custom embedding function for Gemini text embeddings"""
    
    def __init__(self, model_name=EMBEDDING_MODEL_NAME):
        self.model_name = model_name
    
    def __call__(self, input_texts):
        """Generate embeddings for input texts"""
        embeddings = []
        for text in input_texts:
            result = genai.embed_content(
                model=self.model_name,
                content=text,
                task_type="retrieval_document"
            )
            embeddings.append(result['embedding'])
        return embeddings


def generate_title_with_gemini(text: str, source: str) -> str:
    """
    Generate a title using Gemini with fallback.
    
    Args:
        text: The conversation text to generate title for
        source: The source of the conversation (for fallback)
        
    Returns:
        Generated title or fallback title
    """
    try:
        model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        title_prompt = TITLE_GENERATION_PROMPT.format(text=text[:500])
        title_response = model.generate_content(title_prompt)
        title = title_response.text.strip()[:MAX_TITLE_LENGTH]
        return title
    except Exception as e:
        # Fallback title if Gemini fails
        return f"Conversation from {source}"


def generate_context_with_gemini(prompt: str, max_length: int) -> tuple[str, bool]:
    """
    Generate context using Gemini with fallback.
    
    Args:
        prompt: The prompt to send to Gemini
        max_length: Maximum length for the generated context
        
    Returns:
        Tuple of (generated_context, success_flag)
    """
    try:
        model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        response = model.generate_content(prompt)
        generated_context = response.text.strip()
        return generated_context, True
    except Exception as e:
        return "", False


def create_gemini_embedding_function():
    """Create and return a GeminiEmbeddingFunction instance"""
    return GeminiEmbeddingFunction()
