# backend/app.py
import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import chromadb
from chromadb.config import Settings
import google.generativeai as genai
from dotenv import load_dotenv
from chromadb.errors import NotFoundError

# Import constants
from constants import (
    COLLECTION_NAME,
    API_VERSION,
    API_TITLE,
    API_DESCRIPTION
)

# Import Gemini utilities
from utils.gemini import (
    create_gemini_embedding_function
)

# Import Pydantic models
from models.models import (
    StoreRequest,
    ContextRequest
)

# Import business logic modules
from src.context import (
    store_conversation,
    get_all_conversations,
    clear_all_data as clear_all_data_func,
    clear_user_data as clear_user_data_func,
    delete_context_by_id as delete_context_by_id_func
)
from src.generate_context import (
    generate_context_from_all_conversations,
    generate_context_from_specific_conversation
)

# Load environment variables from .env file
load_dotenv()

# Environment-based configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("Set GEMINI_API_KEY in environment or .env file")

genai.configure(api_key=GEMINI_API_KEY)

# Chroma client - local persistent folder
client = chromadb.PersistentClient(path="./chroma_data")

# Single collection for user memory
try:
    collection = client.get_collection(name=COLLECTION_NAME)
except NotFoundError:
    # Collection doesn't exist, create it
    collection = client.create_collection(name=COLLECTION_NAME)

# Create Gemini embedding function instance
gemini_ef = create_gemini_embedding_function()


app = FastAPI(title=API_TITLE, version=API_VERSION)

# Add CORS middleware to allow requests from anywhere
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


@app.post("/store")
async def store(req: StoreRequest):
    """Store conversation data with auto-generated title"""
    return await store_conversation(req, collection, gemini_ef)

@app.get("/get_all")
async def get_all(user_id: str):
    return await get_all_conversations(user_id, collection)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check if collection exists and is accessible
        collections = client.list_collections()
        collection_exists = any(c.name == COLLECTION_NAME for c in collections)
        
        return {
            "status": "healthy",
            "collection_exists": collection_exists,
            "api_version": API_VERSION
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.delete("/clear")
async def clear_all_data():
    """Clear all data from ChromaDB collection"""
    return await clear_all_data_func(collection)

@app.delete("/clear/{user_id}")
async def clear_user_data(user_id: str):
    """Clear all data for a specific user"""
    return await clear_user_data_func(user_id, collection)

@app.delete("/delete_context/{context_id}")
async def delete_context(
    context_id: str,
    user_id: str = Query(..., description="User ID to verify ownership")
):
    """Delete a specific context by context_id, verifying it belongs to user_id"""
    return await delete_context_by_id_func(context_id, user_id, collection)


@app.post("/generate_context")
async def generate_context(request: ContextRequest):
    """Generate intelligent context summary using Gemini from stored conversations"""
    return await generate_context_from_all_conversations(request, collection)

@app.get("/generate_context/{context_id}")
async def generate_context_by_id(
    context_id: str, 
    user_id: str = Query(..., description="User ID"), 
    max_length: int = Query(2000, description="Maximum context length")
):
    """Generate intelligent context summary for a specific stored conversation"""
    return await generate_context_from_specific_conversation(context_id, user_id, max_length, collection)

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": API_TITLE,
        "version": API_VERSION,
        "description": API_DESCRIPTION,
        "endpoints": {
            "POST /store": "Store conversation data with auto-generated title",
            "GET /get_all": "Retrieve all conversations for a user",
            "POST /search": "Search for relevant context",
            "POST /generate_context": "Generate intelligent context summary from all conversations",
            "GET /generate_context/{context_id}": "Generate intelligent context summary for specific conversation",
            "DELETE /clear": "Clear all data",
            "DELETE /clear/{user_id}": "Clear data for specific user",
            "DELETE /delete_context/{context_id}": "Delete a specific context by context_id (requires user_id query param)",
            "GET /health": "Health check"
        }
    }

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Get port from environment (Railway sets this)
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print("🚀 Starting SabkiSoch Backend...")
    print(f"📡 API will be available at: http://{host}:{port}")
    print(f"📚 API docs available at: http://{host}:{port}/docs")
    print(f"❤️  Health check at: http://{host}:{port}/health")
    print("=" * 50)
    
    uvicorn.run(app, host=host, port=port)