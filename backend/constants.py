# backend/constants.py
"""
Constants and configuration for SabkiSoch API
"""

# Gemini model configuration
GEMINI_MODEL_NAME = "gemini-2.5-flash"
EMBEDDING_MODEL_NAME = "models/text-embedding-004"

# Context generation prompt template
CONTEXT_GENERATION_PROMPT = """You are an AI assistant that helps create context summaries from conversations. 

Based on the following conversation(s) from the user, create a concise, intelligent context summary that would be useful for future AI interactions. Focus on:

1. Key topics, themes, and interests discussed
2. Important information, facts, or preferences mentioned
3. Ongoing projects, goals, or problems the user is working on
4. Personal context that would help future conversations

Keep the summary under {max_length} characters and make it natural and conversational.

{conversation_text}

Generate a context summary:"""

# Title generation prompt template
TITLE_GENERATION_PROMPT = "Generate a short, descriptive title (max 50 characters) for this conversation:\n\n{text}"

# Size limits
MAX_CONTEXT_LENGTH = 5000
MAX_TITLE_LENGTH = 50
MAX_TEXT_LENGTH = 30000  # Reduced to stay well under 36KB payload limit
MAX_USER_ID_LENGTH = 100
MAX_SOURCE_LENGTH = 50
MAX_URL_LENGTH = 2000

# Payload size limits
PAYLOAD_SIZE_LIMIT = 36000  # 36KB in bytes
PAYLOAD_SIZE_BUFFER = 1000  # Buffer to stay under limit
PAYLOAD_BASE_SIZE = 200  # JSON structure overhead

# ChromaDB configuration
COLLECTION_NAME = "ai_memory"

# API configuration
API_VERSION = "1.0.0"
API_TITLE = "SabkiSoch API"
API_DESCRIPTION = "AI Shared Memory Extension Backend"


def estimate_payload_size(user_id: str, source: str, text: str, url: str = None) -> int:
    """
    Estimate the JSON payload size in bytes.
    
    Args:
        user_id: User ID string
        source: Source string
        text: Text content string
        url: Optional URL string
        
    Returns:
        Estimated payload size in bytes
    """
    user_id_size = len(user_id.encode('utf-8'))
    source_size = len(source.encode('utf-8'))
    text_size = len(text.encode('utf-8'))
    url_size = len(url.encode('utf-8')) if url else 0
    
    return PAYLOAD_BASE_SIZE + user_id_size + source_size + text_size + url_size

