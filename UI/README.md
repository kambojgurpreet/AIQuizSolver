# UI - Chrome Extension

This folder contains the Chrome extension frontend code that provides AI quiz assistance functionality.

## Files Structure

```
UI/
├── manifest.json       # Chrome extension manifest
├── background.js       # Service worker for extension
├── content.js         # Content script for quiz pages
├── popup.html         # Extension popup interface
├── popup.js           # Popup functionality
├── icon.png           # Extension icon
└── log.html           # Logging interface
```

## Features

- **Auto Question Detection**: Automatically detects quiz questions on web pages
- **AI Answer Generation**: Gets answers from AI backend with confidence scores
- **Batch Processing**: Process multiple questions simultaneously
- **Web Search Integration**: Search functionality for question verification
- **Auto-Complete Prevention**: Stops extension before final quiz submission

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this `UI` folder
4. The extension will appear in your Chrome toolbar

## Usage

1. Navigate to any quiz or test page
2. Click the extension icon in the toolbar
3. Use the popup buttons to:
   - **Search All Questions**: Find and process all questions on the page
   - **Get Answer**: Process a single selected question
   - **Auto Complete**: Automatically answer all questions (stops before submission)

## Configuration

The extension connects to the FastAPI backend server at:
- **Development**: `http://localhost:3000`
- **Production**: Configure in `content.js` and `background.js`

## API Integration

The extension communicates with the backend using these endpoints:
- `POST /ask` - Single question processing
- `POST /ask-batch` - Batch question processing
- `GET /test` - Connection testing

## Development

To modify the extension:
1. Edit the relevant files in this folder
2. Go to `chrome://extensions/`
3. Click the refresh button for the extension
4. Test your changes

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Edge (Chromium-based)
- ⚠️ Firefox (requires Manifest V2 conversion)
- ⚠️ Safari (requires additional configuration)
