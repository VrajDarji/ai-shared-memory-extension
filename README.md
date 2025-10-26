# AI Shared Memory Extension (SabkiSoch)

A Chrome extension that enables users to store and retrieve AI chat conversations across different platforms using hosted vector storage and semantic search capabilities.

## 🚀 Quick Start Options

> **📖 [LOCAL_USAGE.md](./LOCAL_USAGE.md)** - **Easiest setup!** Just load extension in Chrome  
> **📋 [README.md](./README.md)** - Complete setup with self-hosted backend

## 🚀 Features

- **Universal Chat Storage**: Automatically captures conversations from various AI platforms (ChatGPT, Gemini, etc.)
- **Hosted Vector Database**: Uses ChromaDB with DuckDB+Parquet for persistent cloud storage
- **Semantic Search**: Leverages Google Gemini's text-embedding-004 model for intelligent content retrieval
- **Cross-Platform Memory**: Store conversations from any website and load them into any chat interface
- **Floating UI**: Beautiful brain icon (🧠) with glass-morphism modal interface
- **Smart Context Generation**: AI-powered conversation summarization using Gemini
- **Auto-Injection**: Context automatically sent to AI without manual pasting
- **User-Specific Data**: Each user's data is completely isolated and secure
- **Loading States**: Visual feedback with spinners during API operations
- **CSP Compliant**: Secure DOM manipulation following Chrome's security policies
- **No Setup Required**: Extension works out-of-the-box with our hosted backend

## 🏗️ Architecture

The project consists of two main components:

### Backend (FastAPI Server)
- **Location**: `backend/` (for self-hosting)
- **Purpose**: Handles storage and retrieval of chat data using vector embeddings
- **Database**: ChromaDB with DuckDB+Parquet persistence
- **AI Integration**: Google Gemini API for text embeddings
- **Hosted**: Available at our hosted service (no setup required)

### Chrome Extension
- **Location**: `extension/`
- **Purpose**: Browser extension that captures and injects chat data
- **Components**:
  - `background.js`: Service worker for API communication
  - `content.js`: Content script for page interaction and context management
  - `injected.js`: Injected script for API interception
  - `component.js`: Floating UI component (brain icon + modal)
  - `popup.html/js`: Extension popup interface
  - `icons/`: Extension icons and assets

## 📋 Prerequisites

- Chrome/Chromium browser
- Internet connection (for hosted backend)
- Google Gemini API key (for self-hosting only)

## 🛠️ Installation

### Quick Start (Recommended)

1. **Download Extension**: Clone or download this repository
2. **Load Extension**: 
   - Open Chrome and go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" and select the `extension/` folder
3. **Start Using**: The extension automatically connects to our hosted backend

### Self-Hosting Backend (Advanced)

If you prefer to host your own backend:

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Option 1: Create .env file (recommended)
cp env.example .env
# Edit .env file and add your Gemini API key

# Option 2: Set environment variable directly
export GEMINI_API_KEY="your_gemini_api_key_here"
# Windows:
set GEMINI_API_KEY=your_gemini_api_key_here

# Run the server
uvicorn app:app --reload
```

The backend will be available at `http://localhost:8000`

### 2. Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `extension/` folder
4. The "SabkiSoch" extension should now appear in your extensions

## 🎯 Usage

### Quick Start with Floating UI

1. **Navigate to any AI chat platform** (ChatGPT, Gemini, Claude, etc.)
2. **Look for the brain icon** (🧠) in the bottom-right corner of the page
3. **Click the brain icon** to open the floating modal
4. **Use the controls**:
   - **Store Context**: Save current page conversations with AI embeddings
   - **Load Context**: Retrieve and display saved conversations
   - **Generate & Send Context**: Create intelligent AI summary and send it automatically
   - **Clear My Data**: Remove all your stored data

### Detailed Workflow

#### **Storing Conversations:**
1. Have a conversation on any AI platform
2. Click the brain icon (🧠) in bottom-right corner
3. Click "Store Context" to save with vector embeddings
4. Get confirmation notification with conversation count

#### **Loading Context:**
1. Navigate to any chat interface
2. Click the brain icon (🧠)
3. Click "Load Context" to retrieve saved conversations
4. Context is automatically injected and sent to AI

#### **Smart Context Generation:**
1. Click "Generate & Send Context"
2. AI creates intelligent summary of your stored conversations
3. Summary is automatically sent to current chat
4. Only relevant context is included based on current conversation

## 🎨 UI Features

### **Floating Brain Icon (🧠)**
- **Position**: Bottom-right corner of web pages
- **Design**: Glass-morphism with subtle animations
- **Interaction**: Click to open modal, hover for visual feedback
- **Accessibility**: Keyboard shortcut (Ctrl+Shift+S) support

### **Centered Modal Interface**
- **Layout**: Clean, modern design with glass-morphism effects
- **Controls**: Four main action buttons with loading states
- **Feedback**: Real-time status updates and notifications
- **Responsive**: Works on all screen sizes
- **Animations**: Smooth transitions and hover effects

### **Smart Notifications**
- **Design**: Matches modal theme with glass-morphism
- **Position**: Top-right corner with auto-dismiss
- **Content**: Conversation count and status updates
- **Interaction**: Click to dismiss, auto-hide after 5 seconds

### **Loading States**
- **Spinners**: Visual feedback during API calls
- **Disabled Buttons**: Prevent multiple simultaneous requests
- **Status Messages**: Clear indication of current operation
- **Auto-Close**: Popup closes automatically after successful operations

## 🔧 API Endpoints

### POST `/store`
Store a new conversation in the vector database with AI embeddings.

**Request Body:**
```json
{
  "user_id": "string",
  "source": "string", 
  "text": "string",
  "url": "string"
}
```

**Response:**
```json
{
  "ok": true,
  "id": "uuid"
}
```

### GET `/get_all`
Retrieve all conversations for a user.

**Query Parameters:**
- `user_id`: User identifier

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "text": "conversation content",
      "metadata": {
        "user_id": "string",
        "source": "string",
        "url": "string"
      }
    }
  ]
}
```

### POST `/generate_context`
Generate intelligent context summary using Gemini AI.

**Request Body:**
```json
{
  "user_id": "string",
  "query": "optional search query"
}
```

**Response:**
```json
{
  "generated_context": "AI-generated summary",
  "conversation_count": 5
}
```

### DELETE `/clear/{user_id}`
Clear all data for a specific user.

**Response:**
```json
{
  "ok": true,
  "message": "Data cleared successfully"
}
```

### GET `/search`
Perform semantic search through stored conversations.

**Query Parameters:**
- `user_id`: User identifier
- `query`: Search query
- `limit`: Number of results (default: 5)

**Response:**
```json
{
  "results": [
    {
      "text": "relevant conversation",
      "metadata": {...},
      "distance": 0.85
    }
  ]
}
```

## 🏛️ Project Structure

```
AI-Shared-Memory-Extension/
├── backend/
│   ├── app.py                 # FastAPI server with ChromaDB integration
│   ├── requirements.txt       # Python dependencies
│   └── venv/                 # Virtual environment
├── extension/
│   ├── manifest.json         # Chrome extension configuration
│   ├── background.js         # Service worker for API communication
│   ├── content.js           # Content script for page interaction
│   ├── injected.js          # Script for intercepting API calls
│   ├── component.js         # Floating UI component (brain icon + modal)
│   ├── popup.html           # Extension popup interface
│   ├── popup.js             # Popup functionality
│   └── icons/               # Extension icons
├── LOCAL_USAGE.md           # Quick start guide for extension-only usage
└── README.md                # This file
```

## 🔍 How It Works

1. **Floating UI**: The `component.js` creates a brain icon (🧠) in the bottom-right corner of web pages
2. **Content Capture**: The `injected.js` script intercepts API calls from AI platforms to capture conversation data
3. **Data Processing**: The `content.js` script processes captured data and sends it to the backend
4. **Vector Storage**: The backend generates embeddings using Gemini's text-embedding-004 model and stores them in ChromaDB
5. **Smart Context Generation**: When loading context, AI creates intelligent summaries of stored conversations
6. **Auto-Injection**: Context is automatically injected and sent to the current chat interface
7. **User Isolation**: Each user has a unique ID for secure data separation

## 🎨 Supported Platforms

The extension is designed to work with various AI chat platforms including:
- ChatGPT
- Google Gemini
- Claude
- Other platforms with similar API patterns

## 🔒 Privacy & Security

- **Hosted Backend**: All data is stored securely on our hosted ChromaDB instance
- **User Isolation**: Each user has a unique ID for complete data separation
- **Encrypted Communication**: All API calls use HTTPS encryption
- **No Data Sharing**: Your conversations are never shared with other users
- **Minimal Permissions**: Extension only requests necessary browser permissions
- **CSP Compliant**: Follows Chrome's Content Security Policy for security

## 🚧 Development

### Backend Development

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Extension Development

1. Make changes to files in the `extension/` directory
2. Go to `chrome://extensions/`
3. Click the refresh button on the SabkiSoch extension
4. Test your changes

## 📝 Dependencies

### Backend Dependencies
- `fastapi`: Web framework
- `uvicorn`: ASGI server
- `chromadb`: Vector database
- `google-generativeai`: Gemini API client
- `pydantic`: Data validation

### Extension Dependencies
- Chrome Extension Manifest V3
- Modern JavaScript (ES6+)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source. Please check the license file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Extension not loading**: Check Chrome developer console for errors, ensure Developer mode is enabled
2. **Backend connection issues**: Verify internet connection and hosted backend status
3. **Context not saving**: Ensure you're on a supported chat website, check browser console for API errors
4. **Context not injecting**: Click "Load Context" first, ensure you're in a chat input field
5. **Floating icon not appearing**: Refresh the page after loading the extension
6. **Modal not opening**: Check browser console for CSP errors, try clicking the extension icon instead

### Debug Mode

Enable debug logging by opening Chrome DevTools and checking the console for detailed error messages. The extension provides comprehensive logging for troubleshooting.

### Keyboard Shortcuts

- **Ctrl+Shift+S**: Toggle the floating modal (on supported sites)

## 🔮 Future Enhancements

- [x] **Floating UI**: Brain icon with centered modal interface
- [x] **Smart Context Generation**: AI-powered conversation summarization
- [x] **Auto-Injection**: Automatic context sending to AI
- [x] **User-Specific Data**: Individual user data isolation
- [x] **Loading States**: Visual feedback during API calls
- [x] **CSP Compliance**: Secure DOM manipulation
- [ ] **Cross-Device Sync**: Access data from different devices
- [ ] **Advanced Filtering**: Search and filter conversations by topic
- [ ] **Conversation Categorization**: Organize conversations by type
- [ ] **Export/Import**: Backup and restore functionality
- [ ] **Multi-User Support**: Team collaboration features
- [ ] **Conversation Analytics**: Usage insights and patterns
- [ ] **Custom AI Models**: Support for different embedding models
- [ ] **Offline Mode**: Local storage fallback when backend is unavailable

---

**Note**: This extension is designed for personal use and educational purposes. Always respect the terms of service of the platforms you're using.
