# backend/src/generate_context.py
"""
Context generation functions for creating intelligent summaries from conversations
"""

from fastapi import HTTPException
from typing import Dict, Any

from constants import (
    MAX_CONTEXT_LENGTH,
    CONTEXT_GENERATION_PROMPT
)
from models.models import ContextRequest
from utils.gemini import generate_context_with_gemini
from utils.formatters import (
    format_conversations_for_prompt,
    format_single_conversation_for_prompt
)


async def generate_context_from_all_conversations(
    request: ContextRequest, 
    collection
) -> Dict[str, Any]:
    """
    Generate intelligent context summary using Gemini from all stored conversations.
    
    Args:
        request: ContextRequest object with user_id and max_length
        collection: ChromaDB collection instance
        
    Returns:
        Dictionary with generated context and metadata
        
    Raises:
        HTTPException: If validation fails or generation error occurs
    """
    try:
        if not request.user_id or len(request.user_id.strip()) == 0:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        user_id = request.user_id.strip()
        max_length = min(request.max_length or 2000, MAX_CONTEXT_LENGTH)
        
        # Get all conversations for the user
        try:
            results = collection.get(where={"user_id": user_id})
            documents = results.get("documents", [])
            metadatas = results.get("metadatas", [])
            
            if not documents:
                return {
                    "context": "",
                    "summary": "No previous conversations found",
                    "conversation_count": 0
                }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error retrieving conversations: {str(e)}")
        
        # Prepare conversation data for Gemini
        conversations_text = format_conversations_for_prompt(documents, metadatas)
        
        # Generate intelligent context using Gemini
        prompt = CONTEXT_GENERATION_PROMPT.format(
            max_length=max_length,
            conversation_text=conversations_text
        )
        
        generated_context, success = generate_context_with_gemini(prompt, max_length)
        
        if success:
            return {
                "context": generated_context,
                "summary": f"Generated intelligent context from {len(documents)} conversations",
                "conversation_count": len(documents),
                "context_length": len(generated_context)
            }
        else:
            # Fallback to simple concatenation if Gemini fails
            fallback_context = f"Previous conversations ({len(documents)} total):\n\n" + conversations_text[:max_length]
            return {
                "context": fallback_context,
                "summary": f"Fallback context from {len(documents)} conversations",
                "conversation_count": len(documents),
                "context_length": len(fallback_context),
                "note": "Gemini generation failed, using fallback"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating context: {str(e)}")


async def generate_context_from_specific_conversation(
    context_id: str,
    user_id: str,
    max_length: int,
    collection
) -> Dict[str, Any]:
    """
    Generate intelligent context summary for a specific stored conversation.
    
    Args:
        context_id: The ID of the specific conversation
        user_id: The user ID
        max_length: Maximum length for generated context
        collection: ChromaDB collection instance
        
    Returns:
        Dictionary with generated context and metadata
        
    Raises:
        HTTPException: If validation fails or generation error occurs
    """
    try:
        if not user_id or len(user_id.strip()) == 0:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        if not context_id or len(context_id.strip()) == 0:
            raise HTTPException(status_code=400, detail="context_id is required")
        
        user_id = user_id.strip()
        context_id = context_id.strip()
        max_length = min(max_length or 2000, MAX_CONTEXT_LENGTH)
        
        # Get the specific conversation by ID
        try:
            results = collection.get(
                ids=[context_id],
                where={"user_id": user_id}
            )
            documents = results.get("documents", [])
            metadatas = results.get("metadatas", [])
            
            if not documents:
                raise HTTPException(status_code=404, detail="Context not found or doesn't belong to user")
            
            # Should only have one document
            document = documents[0]
            metadata = metadatas[0]
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error retrieving context: {str(e)}")
        
        # Generate intelligent context using Gemini
        conversation_text = format_single_conversation_for_prompt(document, metadata)
        prompt = CONTEXT_GENERATION_PROMPT.format(
            max_length=max_length,
            conversation_text=conversation_text
        )
        
        generated_context, success = generate_context_with_gemini(prompt, max_length)
        
        if success:
            return {
                "context": generated_context,
                "summary": f"Generated intelligent context from conversation: {metadata.get('title', 'Untitled')}",
                "context_id": context_id,
                "title": metadata.get('title', 'Untitled'),
                "source": metadata.get('source', 'unknown'),
                "time": metadata.get('time'),
                "context_length": len(generated_context)
            }
        else:
            # Fallback to simple text if Gemini fails
            fallback_context = f"Context from {metadata.get('source', 'unknown')}:\n\n{document[:max_length]}"
            return {
                "context": fallback_context,
                "summary": f"Fallback context from conversation: {metadata.get('title', 'Untitled')}",
                "context_id": context_id,
                "title": metadata.get('title', 'Untitled'),
                "source": metadata.get('source', 'unknown'),
                "time": metadata.get('time'),
                "context_length": len(fallback_context),
                "note": "Gemini generation failed, using fallback"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating context: {str(e)}")
