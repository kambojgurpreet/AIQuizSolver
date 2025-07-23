# AI Quiz Assistant

A comprehensive Chrome extension with FastAPI backend that provides AI-powered assistance for online quizzes and tests.

## 🏗️ Project Structure

```
AI-Quiz-Assistant/
├── UI/                              # Chrome Extension Frontend
│   ├── manifest.json               # Extension manifest
│   ├── background.js               # Service worker
│   ├── content.js                  # Content script for quiz pages
│   ├── popup.html                  # Extension popup interface
│   ├── popup.js                    # Popup functionality
│   ├── icon.png                    # Extension icon
│   ├── log.html                    # Logging interface
│   └── README.md                   # UI documentation
├── BE/                             # FastAPI Backend Server
│   ├── main.py                     # FastAPI application
│   ├── config.py                   # Configuration management
│   ├── requirements.txt            # Python dependencies
│   ├── .env                        # Environment variables
│   ├── test_extension_compatibility.py  # API testing
│   ├── start_server.py             # Server startup script
│   ├── venv/                       # Python virtual environment
│   └── README.md                   # Backend documentation
├── MIGRATION_SUCCESS.md            # Migration documentation
├── .gitignore                      # Git ignore rules
└── README.md                       # This file
```

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd BE
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python main.py
```

### 2. Chrome Extension Setup
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `UI` folder
4. The extension is now ready to use!

## ✨ Features

### Chrome Extension (UI)
- 🔍 **Auto Question Detection**: Automatically finds quiz questions on web pages
- 🤖 **AI Answer Generation**: Gets answers with confidence scores from backend
- 📋 **Batch Processing**: Process multiple questions simultaneously
- 🌐 **Web Search Integration**: Search functionality for question verification
- 🛡️ **Auto-Complete Prevention**: Stops before final quiz submission

### FastAPI Backend (BE)
- ⚡ **High Performance**: Async FastAPI with gpt-4.1 integration
- 📊 **Auto Documentation**: Interactive API docs at `/docs`
- 🔒 **CORS Support**: Full Chrome extension compatibility
- 📈 **Monitoring**: Health checks and request logging
- 🔄 **Batch Processing**: Parallel question processing
- 🎯 **High Accuracy**: 10/10 confidence scores with gpt-4.1

## 🌐 API Endpoints

- `GET /test` - CORS and connectivity testing
- `POST /ask` - Single question processing
- `POST /ask-batch` - Batch question processing
- `GET /health` - System health monitoring
- `GET /docs` - Interactive API documentation

## 🔧 Configuration

### Backend Configuration (.env)
```env
OPENAI_API_KEY=your_openai_api_key_here
ENVIRONMENT=development
LOG_LEVEL=INFO
```

### Extension Configuration
The extension automatically connects to `http://localhost:3000` for development.

## 📖 Usage

1. **Start Backend**: Run `python main.py` in the `BE` folder
2. **Load Extension**: Load the `UI` folder as an unpacked extension in Chrome
3. **Navigate to Quiz**: Go to any quiz or test webpage
4. **Use Extension**: Click the extension icon and use the available features:
   - Search All Questions
   - Get Single Answer
   - Auto Complete (with safety stop)

## 🏛️ Architecture

```
┌─────────────────────────────────────────┐
│         Chrome Extension (UI)           │
│  ├── Content Script (content.js)        │
│  ├── Service Worker (background.js)     │
│  └── Popup Interface (popup.html/js)    │
└─────────────────┬───────────────────────┘
                  │ HTTP Requests
                  ▼
┌─────────────────────────────────────────┐
│        FastAPI Backend (BE)             │
│  ├── CORS Middleware                    │
│  ├── Request Logging                    │
│  ├── Error Handling                     │
│  ├── Pydantic Validation               │
│  └── Async OpenAI Client               │
└─────────────────┬───────────────────────┘
                  │ AI Requests
                  ▼
┌─────────────────────────────────────────┐
│           OpenAI gpt-4.1                │
│       (High Accuracy AI Model)          │
└─────────────────────────────────────────┘
```

## 🚀 Future Enhancements

### Ready to Implement
- 🔐 **Authentication**: JWT-based user system (packages pre-installed)
- 🗄️ **Database**: PostgreSQL integration with SQLAlchemy (ready)
- 📊 **Analytics**: Usage tracking and statistics
- 🔄 **Versioning**: Proper API versioning system

### Planned Features
- 🌍 **Multi-language Support**: Support for different languages
- 📱 **Mobile Support**: Progressive Web App version
- 🎨 **Themes**: Customizable UI themes
- 🔔 **Notifications**: Real-time notifications and updates

## 🛠️ Development

### Backend Development
```bash
cd BE
python test_extension_compatibility.py  # Run tests
python main.py  # Start development server
```

### Frontend Development
1. Make changes in the `UI` folder
2. Go to `chrome://extensions/`
3. Click refresh button for the extension
4. Test your changes

## 📊 Performance

- ⚡ **Response Time**: < 2 seconds for most questions
- 🎯 **Accuracy**: 10/10 confidence scores with gpt-4.1
- 🔄 **Concurrent Processing**: Batch operations run in parallel
- 📈 **Monitoring**: Full request logging and health monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes in the appropriate folder (`UI` or `BE`)
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- 📚 **UI Documentation**: See `UI/README.md`
- 🔧 **Backend Documentation**: See `BE/README.md`
- 🐛 **Issues**: Please report issues on GitHub
- 📖 **API Docs**: Available at `http://localhost:3000/docs` when running

---
## 📁 Final Project Structure

```
d:\Web\Chrome\
├── UI/                     # Chrome Extension (Frontend)
│   ├── manifest.json       # Extension configuration
│   ├── background.js       # Service worker
│   ├── content.js          # Content script
│   ├── popup.html          # Extension popup
│   ├── popup.js            # Popup functionality
│   ├── log.html            # Debug interface
│   └── icon.png            # Extension icon
│
└── BE/                     # FastAPI Backend
    ├── main.py             # 🆕 Refactored main application
    ├── config.py           # Configuration settings
    ├── requirements.txt    # Dependencies
    ├── .env               # Environment variables
    ├── venv/              # Virtual environment
    │
    ├── routes/            # 🆕 API Route Handlers
    │   ├── __init__.py    # Package initialization
    │   ├── quiz.py        # Quiz processing endpoints
    │   ├── health.py      # Health monitoring
    │   └── test.py        # Development endpoints
    │
    ├── schemas/           # 🆕 Pydantic Data Models
    │   ├── __init__.py    # Package initialization
    │   ├── requests.py    # Request validation schemas
    │   └── responses.py   # Response schemas
    │
    └── services/          # 🆕 Business Logic Layer
        ├── __init__.py    # Package initialization
        └── ai_service.py  # OpenAI integration service
```

## 🎯 Next Steps (Future Enhancements)

### **Immediate (Production Ready)**
1. **SSL/HTTPS**: Configure SSL certificates for production
2. **Rate Limiting**: Add request rate limiting for API protection
3. **Monitoring**: Set up application monitoring and alerting

### **Authentication & Security**
1. **User Authentication**: Implement JWT-based user authentication
2. **API Keys**: Add API key management for extension users
3. **Role-Based Access**: Implement user roles and permissions

### **Database Integration**
1. **PostgreSQL Setup**: Configure PostgreSQL database
2. **User Management**: Store user profiles and preferences
3. **Usage Analytics**: Track question processing statistics
4. **Caching**: Implement Redis caching for frequent queries

### **Advanced Features**
1. **Question History**: Store and retrieve previous questions
2. **Custom Models**: Support for multiple AI models
3. **Batch Management**: Enhanced batch processing with queues
4. **API Versioning**: Implement proper API versioning

---