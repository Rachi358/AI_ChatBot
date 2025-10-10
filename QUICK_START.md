# Quick Start Guide

## Prerequisites
- Python 3.11+
- Google API Key for Gemini
- Supabase account (database already configured)

## Setup (5 minutes)

### 1. Clone and Navigate
```bash
cd yara-assistant
```

### 2. Create Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment
```bash
cp .env.example .env
# Edit .env and add your keys
```

Required in `.env`:
- `GOOGLE_API_KEY` - Get from https://makersuite.google.com/app/apikey
- `SECRET_KEY` - Generate a random string
- `DATABASE_URL` - Already configured for Supabase (update password)

### 5. Verify Setup (Optional but Recommended)
```bash
python verify_setup.py
```

### 6. Run Application
```bash
python run.py
```

Visit: http://localhost:5000

## API Endpoints

### Chat
- `POST /api/chat` - Send message
- `GET /api/chat/history` - Get history

### Voice
- `POST /api/voice/process` - Process voice input

### Wake Word
- `POST /api/wakeword/detect` - Detect wake word
- `GET /api/wakeword/status` - Get status

### Monitoring
- `GET /health` - Health check

## Testing Endpoints

### Chat API
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Yara!"}'
```

### Health Check
```bash
curl http://localhost:5000/health
```

## Common Issues

### Issue: "GOOGLE_API_KEY not set"
**Solution**: Add your Google API key to `.env`

### Issue: Database connection failed
**Solution**: Check `DATABASE_URL` in `.env` has correct password

### Issue: "Module not found"
**Solution**: Activate virtual environment and run `pip install -r requirements.txt`

## Project Structure

```
yara-assistant/
├── app/
│   ├── __init__.py          # App factory
│   ├── config.py            # Configuration
│   ├── database.py          # Database instance
│   ├── models/              # Data models
│   ├── routes/              # API endpoints
│   ├── services/            # Business logic
│   ├── static/              # Frontend assets
│   ├── templates/           # HTML templates
│   └── utils/               # Utilities
├── .env                     # Environment variables (create this)
├── .env.example             # Template for .env
├── requirements.txt         # Python dependencies
├── run.py                   # Application entry point
└── verify_setup.py          # Setup verification script
```

## Next Steps

1. Customize the assistant personality in `app/services/gemini_api.py`
2. Adjust wake word sensitivity in `app/config.py`
3. Add custom error templates in `app/templates/`
4. Review security settings for production deployment

## Production Deployment

Before deploying to production:

1. ✅ Generate strong `SECRET_KEY`
2. ✅ Set `FLASK_DEBUG=false`
3. ✅ Review RLS policies in Supabase
4. ✅ Configure proper CORS origins
5. ✅ Set up monitoring for `/health` endpoint
6. ✅ Use production WSGI server (gunicorn included)

Example production run:
```bash
gunicorn --bind 0.0.0.0:5000 --workers 4 run:app
```

## Support

- Check `CHANGES.md` for detailed change log
- Review `README.md` for comprehensive documentation
- Database migrations are in Supabase dashboard

## Features

✅ Chat with AI (Gemini)
✅ Voice input/output
✅ Wake word detection ("Hey Yara")
✅ Session-based chat history
✅ CORS-enabled APIs
✅ Health monitoring
✅ Environment validation
