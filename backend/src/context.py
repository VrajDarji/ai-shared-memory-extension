# backend/src/context.py
"""
Context management functions for storing, retrieving, and clearing conversation data
"""

import uuid
from datetime import datetime
from fastapi import HTTPException
from typing import Dict, Any, List

from constants import (
    MAX_USER_ID_LENGTH,
    MAX_TEXT_LENGTH,
    PAYLOAD_SIZE_LIMIT,
    PAYLOAD_SIZE_BUFFER,
    estimate_payload_size
)
from models.models import StoreRequest
from utils.gemini import generate_title_with_gemini


async def store_conversation(
    req: StoreRequest, 
    collection, 
    gemini_ef
) -> Dict[str, Any]:
    """
    Store a conversation in the database with embedding and metadata.
    
    Args:
        req: StoreRequest object with conversation data
        collection: ChromaDB collection instance
        gemini_ef: Gemini embedding function
        
    Returns:
        Dictionary with success status and conversation ID
        
    Raises:
        HTTPException: If validation fails or storage error occurs
    """
    try:
        # Check payload size and truncate if necessary
        estimated_size = estimate_payload_size(req.user_id, req.source, req.text, req.url)
        if estimated_size > (PAYLOAD_SIZE_LIMIT - PAYLOAD_SIZE_BUFFER):
            # Calculate how much to truncate
            current_text_size = len(req.text.encode('utf-8'))
            max_text_bytes = MAX_TEXT_LENGTH
            if current_text_size > max_text_bytes:
                # Truncate text to fit within payload limit
                original_length = len(req.text)
                text_bytes = req.text.encode('utf-8')
                truncated_text = text_bytes[:max_text_bytes].decode('utf-8', errors='ignore')
                req.text = truncated_text
                print(f"Warning: Text truncated due to payload size limit. Original: {original_length} chars, Truncated: {len(truncated_text)} chars")
        
        # Validate text content
        if not req.text or not req.text.strip():
            raise HTTPException(status_code=422, detail="Text content cannot be empty")
        
        # Generate embedding using Gemini
        embedding = gemini_ef([req.text])[0]
        
        # Create unique ID
        uid = str(uuid.uuid4())
        time = datetime.now()
        
        # Generate title using Gemini
        title = generate_title_with_gemini(req.text, req.source)
        
        # Prepare metadata (ChromaDB requires string values for datetime)
        metadata = {
            "user_id": req.user_id, 
            "source": req.source, 
            "url": req.url,
            "time": time.isoformat(),  # Convert datetime to ISO format string
            "title": title
        }
        
        # Add to chroma collection with pre-computed embedding
        collection.add(
            documents=[req.text],
            metadatas=[metadata],
            ids=[uid],
            embeddings=[embedding]
        )

        print(f"Metadata: {metadata}")
        
        return {"ok": True, "id": uid}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error storing data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to store data: {str(e)}")


async def get_all_conversations(user_id: str, collection) -> Dict[str, Any]:
    """
    Retrieve all conversations for a specific user.
    
    Args:
        user_id: The user ID to retrieve conversations for
        collection: ChromaDB collection instance
        
    Returns:
        Dictionary with items list and count
        
    Raises:
        HTTPException: If validation fails or retrieval error occurs
    """
    try:
        # Validate user_id
        if not user_id or not user_id.strip():
            raise HTTPException(status_code=400, detail="user_id is required")
        
        if len(user_id) > MAX_USER_ID_LENGTH:
            raise HTTPException(status_code=400, detail=f"user_id too long (max {MAX_USER_ID_LENGTH} characters)")
        
        user_id = user_id.strip()
        
        # Use get() method for metadata-based retrieval
        try:
            results = collection.get(
                where={"user_id": user_id}
            )
        except Exception as get_error:
            # Return empty results if query fails
            return {"items": [], "count": 0}
        
        # Format results
        docs = []
        documents = results.get("documents", [])
        metadatas = results.get("metadatas", [])
        ids = results.get("ids", [])
        
        for doc, md, id_ in zip(documents, metadatas, ids):
            docs.append({
                "id": id_, 
                "text": doc, 
                "metadata": md
            })
        
        return {"items": docs, "count": len(docs)}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve data: {str(e)}")


async def clear_all_data(collection) -> Dict[str, Any]:
    """
    Clear all data from ChromaDB collection.
    
    Args:
        collection: ChromaDB collection instance
        
    Returns:
        Dictionary with success status and deleted count
        
    Raises:
        HTTPException: If clearing error occurs
    """
    try:
        print("🗑️ Clearing all data from ChromaDB...")
        
        # Get all documents first to see what we're deleting
        try:
            all_docs = collection.get()
            doc_count = len(all_docs.get('ids', []))
        except Exception as e:
            print(f"Error getting documents: {e}")
            doc_count = 0
        
        # Delete all documents
        if doc_count > 0:
            collection.delete()
            print(f"✅ Deleted {doc_count} documents")
        else:
            print("ℹ️ No documents found to delete")
        
        return {
            "ok": True, 
            "message": f"Cleared {doc_count} documents from ChromaDB",
            "deleted_count": doc_count
        }
        
    except Exception as e:
        print(f"Error clearing data: {e}")
        raise HTTPException(status_code=500, detail=f"Error clearing data: {str(e)}")


async def clear_user_data(user_id: str, collection) -> Dict[str, Any]:
    """
    Clear all data for a specific user.
    
    Args:
        user_id: The user ID to clear data for
        collection: ChromaDB collection instance
        
    Returns:
        Dictionary with success status and deleted count
        
    Raises:
        HTTPException: If validation fails or clearing error occurs
    """
    try:
        if not user_id or len(user_id.strip()) == 0:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        user_id = user_id.strip()
        
        # Get user's documents first
        try:
            user_docs = collection.get(where={"user_id": user_id})
            doc_count = len(user_docs.get('ids', []))
        except Exception as e:
            print(f"Error getting user documents: {e}")
            doc_count = 0
        
        # Delete user's documents
        if doc_count > 0:
            collection.delete(where={"user_id": user_id})
            print(f"✅ Deleted {doc_count} documents for user {user_id}")
        
        return {
            "ok": True, 
            "message": f"Cleared {doc_count} documents for user {user_id}",
            "user_id": user_id,
            "deleted_count": doc_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error clearing user data: {e}")
        raise HTTPException(status_code=500, detail=f"Error clearing user data: {str(e)}")


async def delete_context_by_id(context_id: str, user_id: str, collection) -> Dict[str, Any]:
    """
    Delete a specific context by context_id, verifying it belongs to user_id.
    
    Args:
        context_id: The context ID to delete
        user_id: The user ID (to verify ownership)
        collection: ChromaDB collection instance
        
    Returns:
        Dictionary with success status and deleted context info
        
    Raises:
        HTTPException: If validation fails, context not found, or deletion error occurs
    """
    try:
        # Validate inputs
        if not user_id or len(user_id.strip()) == 0:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        if not context_id or len(context_id.strip()) == 0:
            raise HTTPException(status_code=400, detail="context_id is required")
        
        user_id = user_id.strip()
        context_id = context_id.strip()
        
        # Verify context exists and belongs to user
        try:
            results = collection.get(
                ids=[context_id],
                where={"user_id": user_id}
            )
            
            documents = results.get("documents", [])
            metadatas = results.get("metadatas", [])
            
            if not documents:
                raise HTTPException(
                    status_code=404, 
                    detail="Context not found or doesn't belong to user"
                )
            
            # Get metadata for response
            metadata = metadatas[0] if metadatas else {}
            title = metadata.get('title', 'Untitled')
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error verifying context: {e}")
            raise HTTPException(
                status_code=500, 
                detail=f"Error verifying context: {str(e)}"
            )
        
        # Delete the context by ID
        try:
            collection.delete(ids=[context_id])
            print(f"✅ Deleted context {context_id} for user {user_id}")
        except Exception as e:
            print(f"Error deleting context: {e}")
            raise HTTPException(
                status_code=500, 
                detail=f"Error deleting context: {str(e)}"
            )
        
        return {
            "ok": True,
            "message": f"Deleted context: {title}",
            "context_id": context_id,
            "user_id": user_id,
            "title": title
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting context by ID: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error deleting context: {str(e)}"
        )