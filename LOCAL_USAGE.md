# SabkiSoch Extension - Local Usage Guide

## Quick Start

Use the SabkiSoch extension.

### Requirements

- Chrome Browser (or Chromium-based browser)
- Extension folder from this project
- Internet connection

### Installation

1. **Download Extension Files**
   - Clone repository and navigate to `extension/` folder

2. **Load Extension in Chrome**
   - Open `chrome://extensions/`
   - Enable Developer mode (top-right toggle)
   - Click "Load unpacked"
   - Select the `extension/` folder

3. **Pin Extension (Optional)**
   - Click puzzle piece icon in Chrome toolbar
   - Pin "SabkiSoch" for quick access

### Backend Options

**Option 2: Self-Host Backend**
- Full control and privacy
- Requires manual setup
- See `README.md` for instructions

### Usage

**Basic Actions:**
1. Click the extension icon
2. **Store Context** - Save current page conversations
3. **Load Context** - Retrieve saved conversations
4. **Generate & Send Context** - Create AI summary and send

**Supported Sites:**
- Gemini (gemini.google.com)
- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- Other chat-based websites

### Features

**With Hosted Backend:**
- Vector embeddings for semantic search
- AI-generated summaries using Gemini
- Persistent storage across sessions
- Smart context injection
- User-specific data isolation

**UI Features:**
- Floating interface in bottom-right corner
- Centered modal with controls
- Loading states and auto-close

### Troubleshooting

**Extension Not Loading:**
- Select `extension/` folder, not root folder
- Enable Developer mode
- Refresh extensions page

**Backend Connection Issues:**
- Check internet connection
- Verify backend service status
- Check browser console for errors

**Context Not Saving:**
- Only conversation content is saved
- Must be on supported chat website
- Check console for API errors

**Context Not Injecting:**
- Click "Load Context" first
- Ensure you're in chat input field
- Verify backend connection

### Keyboard Shortcuts

- **Ctrl+Shift+S** - Toggle floating modal

### Best Practices

- Store context regularly after important discussions
- Clear old data periodically
- Test functionality on different sites
- Verify backend status before use

**Supported Content:**
- Text messages
- Code blocks
- Questions and answers
- AI responses

**Not Supported:**
- Images
- File attachments

### Privacy & Security

**Hosted Backend:**
- HTTPS communication
- User data isolation
- No data sharing between users
- Encrypted storage

**Extension:**
- CSP compliant
- Local code execution
- Minimal permissions

### Advanced Usage

**Self-Hosting:**
1. Clone repository
2. Set up Python environment
3. Configure API keys and database
4. Update extension backend URL
5. See `README.md` for details

### Support

**Need Help?**
- Check service status page
- Review browser console errors
- Check extension console logs
- Report issues on GitHub

### Updates

**Extension:** Download new files and reload manually

**Backend:** Automatic updates maintained by us

---

## Ready to Use

Load the extension and start storing AI conversations with intelligent context management.