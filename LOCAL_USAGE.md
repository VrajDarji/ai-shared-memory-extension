# 🚀 SabkiSoch Extension - Local Usage Guide

## Quick Start (Extension + Hosted Backend)

This guide shows you how to use the SabkiSoch extension with our hosted backend service.

### 📦 What You Need

- **Chrome Browser** (or any Chromium-based browser)
- **Extension folder** (the `extension/` directory from this project)
- **Internet connection** (to connect to our hosted backend)

### 🛠️ Installation Steps

#### 1. **Download Extension Files**
- Download or clone this repository
- Navigate to the `extension/` folder

#### 2. **Load Extension in Chrome**
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `extension/` folder
5. The extension should now appear in your extensions list

#### 3. **Pin Extension (Optional)**
- Click the puzzle piece icon in Chrome toolbar
- Find "SabkiSoch" and click the pin icon to keep it visible

### 🌐 Backend Options

#### **Option 1: Use Our Hosted Backend (Recommended)**
- **No setup required**: Extension automatically connects to our hosted service
- **All features available**: Vector embeddings, AI summaries, persistent storage
- **Always up-to-date**: We maintain and update the backend
- **Free to use**: No cost for basic usage

#### **Option 2: Self-Host Backend (Advanced)**
- **Full control**: Host your own backend server
- **Privacy**: Your data stays on your own server
- **Customization**: Modify backend as needed
- **See**: `README.md` for self-hosting instructions

### 🎯 How to Use

#### **On Any Website:**
1. **Click the SabkiSoch extension icon** (🧠 brain icon)
2. **Click "Store Context"** to save current page conversations with AI embeddings
3. **Click "Load Context"** to retrieve and inject saved conversations
4. **Click "Generate & Send Context"** to create intelligent AI summary and send it

#### **Supported Websites:**
- ✅ **Gemini** (gemini.google.com)
- ✅ **ChatGPT** (chat.openai.com)
- ✅ **Claude** (claude.ai)
- ✅ **Any chat-based website**

### 🔧 Features Available

#### **✅ With Hosted Backend:**
- **Vector Embeddings**: Semantic search through your conversations
- **AI-Generated Summaries**: Intelligent context summarization using Gemini
- **Persistent Storage**: Data survives browser restarts
- **Smart Context Injection**: Only relevant context is sent to AI
- **User-Specific Data**: Each user's data is isolated and secure
- **Cross-Device Sync**: Access your data from different devices (future feature)

#### **🎨 UI Features:**
- **Floating Interface**: Brain icon appears in bottom-right corner
- **Click to Open**: Opens centered modal with all controls
- **Modern Design**: Glass-morphism with smooth animations
- **Responsive**: Works on all screen sizes
- **Loading States**: Visual feedback during API calls
- **Auto-Close**: Popup closes automatically after successful operations

### 🔍 Troubleshooting

#### **Extension Not Loading:**
- Make sure you selected the `extension/` folder (not the root project folder)
- Check that Developer mode is enabled
- Try refreshing the extensions page

#### **Backend Connection Issues:**
- Check your internet connection
- Ensure our hosted backend is running (check status at our service URL)
- Look for error messages in the browser console
- Try refreshing the page and reloading the extension

#### **Context Not Saving:**
- The extension only saves conversation content, not UI elements
- Make sure you're on a supported chat website
- Try scrolling to load more conversation history
- Check browser console for any API errors

#### **Context Not Injecting:**
- Click "Load Context" first to retrieve saved data
- Make sure you're in a chat input field
- The extension will automatically find and use the send button
- Verify backend connection is working

### 📱 Keyboard Shortcuts

- **Ctrl+Shift+S**: Toggle the floating modal (on supported sites)

### 🎯 Best Practices

#### **For Best Results:**
1. **Store Context Regularly**: Save conversations after important discussions
2. **Use Descriptive Context**: The extension extracts conversation content automatically
3. **Clear Old Data**: Use "Clear My Data" to remove outdated information
4. **Test on Different Sites**: The extension works across multiple AI chat platforms
5. **Check Backend Status**: Ensure our hosted service is running for full functionality

#### **Supported Content Types:**
- ✅ **Text Messages**: All text-based conversations
- ✅ **Code Blocks**: Code snippets and technical discussions
- ✅ **Questions & Answers**: Q&A format conversations
- ✅ **AI Responses**: Both your questions and AI responses
- ❌ **Images**: Image content is not captured
- ❌ **Files**: File attachments are not saved

### 🔒 Privacy & Security

#### **Hosted Backend:**
- **Secure API**: All communication uses HTTPS
- **User Isolation**: Each user's data is completely separate
- **No Data Sharing**: Your conversations are never shared with other users
- **Encrypted Storage**: Data is encrypted at rest and in transit

#### **Extension Security:**
- **CSP Compliant**: Follows Chrome's Content Security Policy
- **No External Scripts**: All code runs locally in your browser
- **Minimal Permissions**: Only requests necessary browser permissions

### 🚀 Advanced Usage

#### **Self-Hosting Backend:**
If you prefer to host your own backend:
1. **Clone the repository**: Get the full source code
2. **Set up Python environment**: Install dependencies
3. **Configure environment**: Set up API keys and database
4. **Update extension**: Point to your local backend URL
5. **See**: `README.md` for detailed self-hosting instructions

#### **Customization Options:**
- **Backend URL**: Change to point to your own server
- **API Keys**: Use your own Gemini API key
- **Database**: Use your own ChromaDB instance
- **Features**: Modify backend functionality as needed

### 📞 Support

#### **Need Help?**
- **Check our status page**: Ensure hosted backend is running
- **Browser console**: Look for error messages
- **Extension logs**: Check extension console for debugging info
- **GitHub Issues**: Report bugs or request features

#### **Service Status:**
- **Hosted Backend**: [Check our service status]
- **API Documentation**: Available at our hosted backend URL
- **Health Check**: Backend health endpoint for monitoring

### 🔄 Updates

#### **Extension Updates:**
- **Manual updates**: Download new extension files and reload
- **Version checking**: Extension will notify of available updates
- **Backward compatibility**: New versions work with existing data

#### **Backend Updates:**
- **Automatic updates**: We maintain and update the hosted backend
- **API versioning**: Backward compatible API changes
- **Feature announcements**: New features are announced via extension

---

## 🎉 You're All Set!

The SabkiSoch extension is now ready to use with our hosted backend. Simply load the extension and start storing your AI conversations with intelligent context management! 🧠✨

### 🌟 What Makes This Special:
- **No Chrome Web Store**: Load directly as unpacked extension
- **Hosted Backend**: No local setup required for full features
- **Intelligent Context**: AI-powered conversation summarization
- **Cross-Platform**: Works on any Chromium-based browser
- **Privacy-First**: Your data is isolated and secure