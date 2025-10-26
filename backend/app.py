# backend/app.py
import os
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import Optional
import chromadb
from chromadb.config import Settings
import google.generativeai as genai
from dotenv import load_dotenv
from chromadb.errors import NotFoundError

# Load environment variables from .env file
load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("Set GEMINI_API_KEY in environment or .env file")

genai.configure(api_key=GEMINI_API_KEY)

# Chroma client - local persistent folder
client = chromadb.PersistentClient(path="./chroma_data")

# single collection for user memory
COLLECTION_NAME = "ai_memory"
try:
    collection = client.get_collection(name=COLLECTION_NAME)
except NotFoundError:
    # Collection doesn't exist, create it
    collection = client.create_collection(name=COLLECTION_NAME)

# Custom embedding function for Gemini
class GeminiEmbeddingFunction:
    def __init__(self, model_name="models/text-embedding-004"):
        self.model_name = model_name
    
    def __call__(self, input_texts):
        embeddings = []
        for text in input_texts:
            result = genai.embed_content(
                model=self.model_name,
                content=text,
                task_type="retrieval_document"
            )
            embeddings.append(result['embedding'])
        return embeddings

gemini_ef = GeminiEmbeddingFunction()

app = FastAPI(title="SabkiSoch API", version="1.0.0")

# Add CORS middleware to allow requests from anywhere
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

class StoreRequest(BaseModel):
    user_id: str
    source: str = "unknown"
    text: str
    url: str | None = None
    
    @field_validator('user_id')
    @classmethod
    def validate_user_id(cls, v):
        if not v or not v.strip():
            raise ValueError('user_id cannot be empty')
        if len(v) > 100:
            raise ValueError('user_id too long (max 100 characters)')
        return v.strip()
    
    @field_validator('text')
    @classmethod
    def validate_text(cls, v):
        if not v or not v.strip():
            raise ValueError('text cannot be empty')
        if len(v) > 100000:  # 100KB limit
            raise ValueError('text too long (max 100KB)')
        return v.strip()
    
    @field_validator('source')
    @classmethod
    def validate_source(cls, v):
        if not v or not v.strip():
            return "unknown"
        if len(v) > 50:
            raise ValueError('source too long (max 50 characters)')
        return v.strip()
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v):
        if v is None:
            return v
        if not v.strip():
            return None
        if len(v) > 2000:  # URL length limit
            raise ValueError('url too long (max 2000 characters)')
        return v.strip()

@app.post("/store")
async def store(req: StoreRequest):
    try:
        # Validate text content
        if not req.text or not req.text.strip():
            raise HTTPException(status_code=422, detail="Text content cannot be empty")
    
    # Generate embedding using Gemini
    embedding = gemini_ef([req.text])[0]
    
        # Create unique ID
        uid = str(uuid.uuid4())
        
        # Prepare metadata
        metadata = {
            "user_id": req.user_id, 
            "source": req.source, 
            "url": req.url
        }
        
        # Add to chroma collection with pre-computed embedding
    collection.add(
        documents=[req.text],
        metadatas=[metadata],
        ids=[uid],
        embeddings=[embedding]
    )
        
    return {"ok": True, "id": uid}
        
    except HTTPException:
        raise
    except Exception as e:
        (f"Error storing data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to store data: {str(e)}")

@app.get("/get_all")
async def get_all(user_id: str):
    try:
        
        # Validate user_id
        if not user_id or not user_id.strip():
            raise HTTPException(status_code=400, detail="user_id is required")
        
        if len(user_id) > 100:
            raise HTTPException(status_code=400, detail="user_id too long")
        
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

class SearchRequest(BaseModel):
    user_id: str
    query: str
    limit: Optional[int] = 5

@app.post("/search")
async def search_context(request: SearchRequest):
    """Search for relevant context using semantic similarity"""
    try:
        if not request.user_id or len(request.user_id.strip()) == 0:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        if not request.query or len(request.query.strip()) == 0:
            raise HTTPException(status_code=400, detail="query is required")
        
        user_id = request.user_id.strip()
        query = request.query.strip()
        limit = min(request.limit or 5, 10)  # Max 10 results
        
        (f"🔍 Semantic search for user_id: {user_id}, query: {query[:50]}...")
        
        # Perform semantic search using ChromaDB query
        try:
            results = collection.query(
                query_texts=[query],
                n_results=limit,
                where={"user_id": user_id}
            )
            (f"🔍 Found {len(results.get('ids', [[]])[0])} relevant results")
        except Exception as query_error:
            (f"ChromaDB query error: {query_error}")
            return {"items": [], "count": 0, "query": query}
        
        # Format results
    docs = []
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        ids = results.get("ids", [[]])[0]
        distances = results.get("distances", [[]])[0]
        
        for doc, md, id_, distance in zip(documents, metadatas, ids, distances):
            docs.append({
                "id": id_, 
                "text": doc, 
                "metadata": md,
                "similarity": 1 - distance  # Convert distance to similarity
            })
        
        (f"🔍 Returning {len(docs)} relevant items")
        return {"items": docs, "count": len(docs), "query": query}
        
    except Exception as e:
        (f"Error searching context: {e}")
        raise HTTPException(status_code=500, detail=f"Error searching context: {str(e)}")

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
            "api_version": "1.0.0"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.delete("/clear")
async def clear_all_data():
    """Clear all data from ChromaDB collection"""
    try:
        ("🗑️ Clearing all data from ChromaDB...")
        
        # Get all documents first to see what we're deleting
        try:
            all_docs = collection.get()
            doc_count = len(all_docs.get('ids', []))
            (f"📊 Found {doc_count} documents to delete")
        except Exception as e:
            (f"⚠️ Could not count existing documents: {e}")
            doc_count = 0
        
        # Delete all documents
        if doc_count > 0:
            collection.delete()
            (f"✅ Successfully deleted {doc_count} documents")
        else:
            ("ℹ️ No documents found to delete")
        
        return {
            "ok": True, 
            "message": f"Cleared {doc_count} documents from ChromaDB",
            "deleted_count": doc_count
        }
        
    except Exception as e:
        (f"❌ Error clearing data: {e}")
        raise HTTPException(status_code=500, detail=f"Error clearing data: {str(e)}")

@app.delete("/clear/{user_id}")
async def clear_user_data(user_id: str):
    """Clear all data for a specific user"""
    try:
        if not user_id or len(user_id.strip()) == 0:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        user_id = user_id.strip()
        (f"🗑️ Clearing data for user: {user_id}")
        
        # Get user's documents first
        try:
            user_docs = collection.get(where={"user_id": user_id})
            doc_count = len(user_docs.get('ids', []))
            (f"📊 Found {doc_count} documents for user {user_id}")
        except Exception as e:
            (f"⚠️ Could not count user documents: {e}")
            doc_count = 0
        
        # Delete user's documents
        if doc_count > 0:
            collection.delete(where={"user_id": user_id})
            (f"✅ Successfully deleted {doc_count} documents for user {user_id}")
        else:
            (f"ℹ️ No documents found for user {user_id}")
        
        return {
            "ok": True, 
            "message": f"Cleared {doc_count} documents for user {user_id}",
            "user_id": user_id,
            "deleted_count": doc_count
        }
        
    except Exception as e:
        (f"❌ Error clearing user data: {e}")
        raise HTTPException(status_code=500, detail=f"Error clearing user data: {str(e)}")

class ContextRequest(BaseModel):
    user_id: str
    max_length: Optional[int] = 2000  # Max length for generated context

@app.post("/generate_context")
async def generate_context(request: ContextRequest):
    """Generate intelligent context summary using Gemini from stored conversations"""
    try:
        if not request.user_id or len(request.user_id.strip()) == 0:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        user_id = request.user_id.strip()
        max_length = min(request.max_length or 2000, 5000)  # Cap at 5KB
        
        (f"🧠 Generating context for user_id: {user_id}")
        
        # Get all conversations for the user
        try:
            results = collection.get(where={"user_id": user_id})
            documents = results.get("documents", [])
            metadatas = results.get("metadatas", [])
            
            if not documents:
                ("ℹ️ No conversations found for user")
                return {
                    "context": "",
                    "summary": "No previous conversations found",
                    "conversation_count": 0
                }
            
            (f"📚 Found {len(documents)} conversations to process")
            
        except Exception as e:
            (f"❌ Error retrieving conversations: {e}")
            raise HTTPException(status_code=500, detail=f"Error retrieving conversations: {str(e)}")
        
        # Prepare conversation data for Gemini
        conversations_text = ""
        for i, (doc, metadata) in enumerate(zip(documents, metadatas)):
            source = metadata.get('source', 'unknown')
            url = metadata.get('url', '')
            conversations_text += f"\n--- Conversation {i+1} (from {source}) ---\n"
            conversations_text += f"{doc}\n"
        
        # Generate intelligent context using Gemini
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            prompt = f"""You are an AI assistant that helps create context summaries from previous conversations. 

Based on the following conversations from the user, create a concise, intelligent context summary that would be useful for future AI interactions. Focus on:

1. Key topics, themes, and interests discussed
2. Important information, facts, or preferences mentioned
3. Ongoing projects, goals, or problems the user is working on
4. Personal context that would help future conversations

Keep the summary under {max_length} characters and make it natural and conversational.

Previous conversations:
{conversations_text}

Generate a context summary:"""

            response = model.generate_content(prompt)
            generated_context = response.text.strip()
            
            (f"✅ Generated context ({len(generated_context)} chars): {generated_context[:100]}...")
            (f"✅ Generated context: {generated_context}")
            return {
                "context": generated_context,
                "summary": f"Generated intelligent context from {len(documents)} conversations",
                "conversation_count": len(documents),
                "context_length": len(generated_context)
            }
            
        except Exception as e:
            (f"❌ Error generating context with Gemini: {e}")
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
        (f"❌ Error in generate_context: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating context: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "SabkiSoch API",
        "version": "1.0.0",
        "description": "AI Shared Memory Extension Backend",
        "endpoints": {
            "POST /store": "Store conversation data",
            "GET /get_all": "Retrieve all conversations for a user",
            "POST /search": "Search for relevant context",
            "POST /generate_context": "Generate intelligent context summary",
            "DELETE /clear": "Clear all data",
            "DELETE /clear/{user_id}": "Clear data for specific user",
            "GET /health": "Health check"
        }
    }

if __name__ == "__main__":
    import uvicorn
    ("🚀 Starting SabkiSoch Backend...")
    ("📡 API will be available at: http://localhost:8000")
    ("📚 API docs available at: http://localhost:8000/docs")
    ("❤️  Health check at: http://localhost:8000/health")
    ("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)