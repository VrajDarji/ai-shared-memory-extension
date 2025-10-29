# backend/utils/formatters.py
"""
Text formatting utilities for SabkiSoch API
"""

from typing import List, Dict, Any


def format_conversations_for_prompt(documents: List[str], metadatas: List[Dict[str, Any]]) -> str:
    """
    Format multiple conversations for the prompt.
    
    Args:
        documents: List of conversation documents
        metadatas: List of metadata dictionaries
        
    Returns:
        Formatted string with all conversations
    """
    conversations_text = "Previous conversations:\n"
    for i, (doc, metadata) in enumerate(zip(documents, metadatas)):
        source = metadata.get('source', 'unknown')
        conversations_text += f"\n--- Conversation {i+1} (from {source}) ---\n"
        conversations_text += f"{doc}\n"
    return conversations_text


def format_single_conversation_for_prompt(document: str, metadata: Dict[str, Any]) -> str:
    """
    Format a single conversation for the prompt.
    
    Args:
        document: The conversation document
        metadata: The metadata dictionary
        
    Returns:
        Formatted string with the conversation
    """
    source = metadata.get('source', 'unknown')
    return f"Conversation (from {source}):\n{document}"
