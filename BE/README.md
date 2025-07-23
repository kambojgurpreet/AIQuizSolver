# BE - FastAPI Backend Server

This folder contains the Python FastAPI backend server that provides AI-powered quiz assistance APIs.

## Files Structure

```
BE/
├── main.py                           # FastAPI server application
├── config.py                         # Configuration management
├── requirements.txt                  # Python dependencies
├── .env                             # Environment variables
├── test_extension_compatibility.py  # API testing script
├── start_server.py                  # Server startup script
├── migrate.py                       # Migration utilities
└── venv/                           # Python virtual environment
```

## Features

- **FastAPI Framework**: Modern, fast web framework with auto-documentation
- **OpenAI Integration**: gpt-4.1 model for high-accuracy question answering
- **Async Processing**: Concurrent request handling for better performance
- **CORS Support**: Full Chrome extension compatibility
- **Auto Documentation**: Interactive API docs at `/docs` and `/redoc`
- **Request Logging**: Comprehensive logging for monitoring and debugging
- **Health Monitoring**: System health checks and uptime tracking
- **Error Handling**: Robust error handling with detailed responses

## API Endpoints

- `GET /test` - CORS and connectivity testing
- `POST /ask` - Single question processing
- `POST /ask-batch` - Batch question processing (parallel)
- `GET /health` - System health and status
- `GET /docs` - Interactive API documentation (Swagger)
- `GET /redoc` - Alternative API documentation

## Installation & Setup

### 1. Environment Setup
```bash
cd BE
python -m venv venv
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create or verify `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
ENVIRONMENT=development
LOG_LEVEL=INFO
```

### 4. Start Server
```bash
python main.py
```

Server will start at: `http://localhost:3000`

## API Usage Examples

### Single Question
```bash
curl -X POST "http://localhost:3000/ask" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"]
  }'
```

### Batch Questions
```bash
curl -X POST "http://localhost:3000/ask-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "questions": [
      {
        "question": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"]
      },
      {
        "question": "Which planet is closest to the Sun?",
        "options": ["Venus", "Mercury", "Earth", "Mars"]
      }
    ]
  }'
```

## Development

### Running Tests
```bash
python test_extension_compatibility.py
```

### Development Mode
The server runs with auto-reload enabled. Changes to Python files will automatically restart the server.

### API Documentation
- Swagger UI: `http://localhost:3000/docs`
- ReDoc: `http://localhost:3000/redoc`

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `ENVIRONMENT`: development/production/testing
- `LOG_LEVEL`: DEBUG/INFO/WARNING/ERROR

### Future Configuration (Ready for Implementation)
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key for authentication
- `REDIS_URL`: Redis connection for caching

## Architecture

```
┌─────────────────────────────────────────┐
│           Chrome Extension              │
│              (UI Folder)                │
└─────────────────┬───────────────────────┘
                  │ HTTP Requests
                  ▼
┌─────────────────────────────────────────┐
│          FastAPI Server                 │
│   ├── CORS Middleware                   │
│   ├── Request Logging                   │
│   ├── Error Handling                    │
│   ├── Pydantic Validation              │
│   └── Async OpenAI Client              │
└─────────────────┬───────────────────────┘
                  │ AI Requests
                  ▼
┌─────────────────────────────────────────┐
│           OpenAI gpt-4.1                │
│        (High Accuracy AI Model)         │
└─────────────────────────────────────────┘
```

## Performance & Monitoring

- **Request Logging**: All requests logged with timing and status
- **Health Checks**: `/health` endpoint provides system status
- **Error Tracking**: Comprehensive error logging and handling
- **Async Processing**: Concurrent request processing for batch operations

## Future Enhancements (Ready to Implement)

### Authentication System
- JWT-based user authentication
- API key management
- Role-based access control

### Database Integration
- PostgreSQL for user management
- Question history storage
- Usage analytics

### Advanced Features
- Request rate limiting
- Redis caching
- Multi-model AI support
- WebSocket real-time communication

## Dependencies

Core dependencies:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `openai` - OpenAI API client
- `python-dotenv` - Environment management
- `pydantic` - Data validation

Authentication (pre-installed):
- `python-jose[cryptography]` - JWT handling
- `passlib[bcrypt]` - Password hashing
- `python-multipart` - Form data parsing

Database (pre-installed):
- `psycopg2-binary` - PostgreSQL adapter
- `sqlalchemy` - ORM
- `alembic` - Database migrations
