# AI Shared Memory Extension (SabkiSoch)

A Chrome extension that enables storage and retrieval of AI chat conversations across different platforms using vector storage and semantic search.

## Quick Start

**[LOCAL_USAGE.md](./LOCAL_USAGE.md)** - Extension-only setup (load directly in Chrome)  
**[README.md](./README.md)** - Complete setup with self-hosted backend

## Features

- Universal chat storage across AI platforms (ChatGPT, Gemini, Claude)
- Vector database with ChromaDB and DuckDB+Parquet persistence
- Semantic search using Google Gemini's text-embedding-004 model
- Cross-platform memory sharing
- Floating UI with glass-morphism modal interface
- AI-powered conversation summarization
- Automatic context injection
- User-specific data isolation
- CSP-compliant security

## Architecture

### Backend (FastAPI Server)
- Location: `backend/`
- Handles storage and retrieval using vector embeddings
- ChromaDB with DuckDB+Parquet persistence
- Google Gemini API integration
- Available as hosted service (no setup required)

### Chrome Extension
- Location: `extension/`
- **Components**:
  - `content.js` - Message orchestration & communication layer (186 lines)
  - `component.js` - Floating UI component (brain icon + modal, 861 lines)
  - `popup.html/js` - Extension popup interface
  - `injected.js` - API call interception
  - `background.js` - Service worker for background tasks
- **Utilities** (`utils/`):
  - `constants.js` - Message types and action constants
  - `api.js` - Backend API communication functions
  - `action-handlers.js` - Action handler functions
  - `scraping.js` - Chat content extraction utilities
  - `dom-utils.js` - DOM manipulation and UI utilities
  - `storage.js` - User data and storage management
  - `injection.js` - Script injection utilities
  - `index.js` - Central export file

## Installation

### Extension Setup

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `extension/` folder
5. Extension connects automatically to hosted backend

### Self-Hosting Backend (Optional)

```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

pip install -r requirements.txt

# Create .env file and add your Gemini API key
cp env.example .env

# Run server
uvicorn app:app --reload
```

Backend will be available at `http://localhost:8000`

## Usage

### Storing Conversations

1. Navigate to any AI chat platform
2. Click the brain icon in bottom-right corner
3. Click "Store Context" to save with vector embeddings
4. Receive confirmation notification

### Loading Context

1. Navigate to any chat interface
2. Click the brain icon
3. Click "Load Context to Chat"
4. Browse stored conversations with AI-generated titles
5. Select any conversation to load and auto-send

### Context Selection Features

- Browse all stored conversations with titles and timestamps
- One-click loading with automatic sending
- AI-generated titles for easy identification
- Visual feedback during operations

## API Endpoints

### POST `/store`
Store conversation with AI embeddings and auto-generated title.

```json
{
  "user_id": "string",
  "source": "string", 
  "text": "string",
  "url": "string"
}
```

### GET `/get_all`
Retrieve all conversations for a user.

Query Parameters: `user_id`

### POST `/generate_context`
Generate intelligent context summary from stored conversations.

```json
{
  "user_id": "string",
  "max_length": 2000
}
```

### GET `/generate_context/{context_id}`
Generate context summary for specific conversation.

Query Parameters: `user_id`, `max_length`

### DELETE `/clear/{user_id}`
Clear all data for a specific user.

### GET `/search`
Perform semantic search through stored conversations.

Query Parameters: `user_id`, `query`, `limit`

## Project Structure

```
AI-Shared-Memory-Extension/
├── backend/
│   ├── app.py              # Main API server (162 lines)
│   ├── constants.py        # Configuration constants
│   ├── src/                # Business logic modules
│   │   ├── context.py      # Data management
│   │   └── generate_context.py # AI context generation
│   ├── models/
│   │   └── models.py       # Pydantic validation models
│   ├── utils/
│   │   ├── gemini.py       # Gemini AI integration
│   │   └── formatters.py   # Text formatting utilities
│   └── requirements.txt
├── extension/
│   ├── manifest.json       # Extension manifest
│   ├── content.js          # Communication layer (186 lines)
│   ├── component.js        # Floating UI component (861 lines)
│   ├── popup.html          # Popup UI
│   ├── popup.js            # Popup logic
│   ├── injected.js         # API interception
│   ├── background.js       # Service worker
│   ├── utils/              # Modular utilities
│   │   ├── constants.js    # Message types & actions
│   │   ├── api.js          # Backend API functions
│   │   ├── action-handlers.js # Action handlers
│   │   ├── scraping.js     # Content extraction
│   │   ├── dom-utils.js    # DOM manipulation
│   │   ├── storage.js       # User data management
│   │   ├── injection.js    # Script injection
│   │   └── index.js         # Central exports
│   └── icons/              # Extension icons
└── README.md
```

## Architecture

### Backend Architecture

The backend follows modular architecture with clear separation of concerns:

- **API Layer** (`app.py`): HTTP endpoints and request handling (162 lines)
- **Business Logic** (`src/`): Data management and AI operations
  - `context.py` - Store, retrieve, and clear conversations
  - `generate_context.py` - AI-powered context generation
- **Data Models** (`models/`): Pydantic validation models
- **Utilities** (`utils/`): Gemini integration and text formatting
- **Configuration** (`constants.py`): Centralized settings

## Supported Platforms

- ChatGPT
- Google Gemini
- Claude
- Other platforms with similar API patterns

## Privacy & Security

- Secure hosted ChromaDB instance
- User isolation with unique IDs
- HTTPS encrypted communication
- No data sharing between users
- Minimal browser permissions
- CSP-compliant security

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Extension Development

1. Make changes in `extension/` directory
2. Navigate to `chrome://extensions/`
3. Click refresh on the SabkiSoch extension
4. Test changes

## Dependencies

### Backend
- fastapi - Web framework
- uvicorn - ASGI server
- chromadb - Vector database
- google-generativeai - Gemini API client
- pydantic - Data validation

### Extension
- Chrome Extension Manifest V3
- Modern JavaScript (ES6+)

## Troubleshooting

**Extension not loading**: Check Chrome developer console, ensure Developer mode is enabled

**Backend connection issues**: Verify internet connection and hosted backend status

**Context not saving**: Ensure supported chat website, check browser console

**Context not injecting**: Click "Load Context" first, ensure chat input field is active

**Floating icon not appearing**: Refresh page after loading extension

**Debug Mode**: Enable Chrome DevTools console for detailed error messages

**Keyboard Shortcut**: Ctrl+Shift+S to toggle modal

## Future Enhancements

- Cross-device sync
- Advanced filtering and search
- Conversation categorization
- Export/import functionality
- Team collaboration support
- Conversation analytics
- Custom AI model support
- Offline mode with local storage fallback

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Submit a pull request

## License

This project is open source. See license file for details.

---

Note: This extension is designed for personal use and educational purposes. Respect the terms of service of the platforms you use.