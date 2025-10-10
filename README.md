# Yara — AI Voice Assistant (Flask)

📌 Project Title

Yara — AI Voice Assistant (Flask)

---

📖 Overview

Yara is a lightweight Flask web application that provides a text and voice-based AI assistant. The project combines:

- A Flask backend with REST endpoints and Jinja2 templates for a simple web UI.
- Integration with Google Generative AI (Gemini) for conversational responses.
- Text-to-Speech (TTS) using Microsoft Edge TTS (via the `edge-tts` package).
- Speech-to-Text (STT) functionality (server-side using `speech_recognition` or client-side browser APIs).
- Local wake-word detection using the Vosk speech-recognition model (optional download if the model is missing).
- SQLite (via Flask-SQLAlchemy) for persisting chat history.

Technologies used:

- Python 3.11+ (recommended)
- Flask, Flask-SQLAlchemy
- google-generativeai (Gemini) for AI responses
- edge-tts for TTS
- vosk for local wake-word detection
- pyaudio / speech_recognition for STT (optional)
- Jinja2 for templates, Tailwind-like styling in templates

---

📂 Folder Structure (high level)

- `run.py` - Application entrypoint (loads `.env`, creates Flask app and runs it).
- `requirements.txt` - Python dependencies used by the project.
- `Dockerfile` - Container instructions (if present).
- `app/` - Main Flask package
  - `__init__.py` - Application factory, blueprint registration, error handlers.
  - `config.py` - Config class with defaults and env var mappings.
  - `database.py` - SQLAlchemy DB instance.
  - `models/`
    - `chat_history.py` - `ChatHistory` SQLAlchemy model for storing messages.
  - `routes/`
    - `chat.py` - Chat UI route and `/api/chat` endpoints for sending messages and fetching history.
    - `voice.py` - Voice processing endpoint (convert text to chat + TTS audio returned as base64).
    - `wakeword.py` - Endpoints for wake-word detection and status.
    - `api.py` - A small example echo API (legacy or demo).
    - `main.py` - Simple index route blueprint (renders `index.html`).
  - `services/` - Helper services
    - `gemini_api.py` - Wrapper around `google.generativeai` with rate limiting and caching.
    - `tts_api.py` - Edge TTS helper for converting text to audio bytes.
    - `stt.py` - Speech-to-text wrapper using `speech_recognition`.
    - `wakeword_local.py` - Vosk-based wake word detector (downloads model if missing).
    - `cache.py` - Simple in-memory response cache.
    - `sync_rate_limiter.py` - Token-bucket rate limiter for API calls.
  - `templates/` - Jinja2 templates (`index.html`, `chat.html`, `404.html`, `error.html`, `base.html`)
  - `static/` - CSS and JS used by the front-end (e.g., `js/chat.js`, `js/wakeword.js`).
- `instance/` - SQLite DB files when running locally (`chat_history.db`, etc.)
- `vosk-model-small-en-us-0.15/` - Optional local Vosk model directory (checked by the wakeword service)



AI_VOICE_ASSISTANT_WEB/
├── run.py                        # Application entrypoint
├── requirements.txt              # Python dependencies
├── Dockerfile                    # (Optional) Container instructions
├── app/                          # Main Flask package
│   ├── __init__.py               # App factory, blueprint registration, error handlers
│   ├── config.py                 # Config class with env var mappings
│   ├── database.py               # SQLAlchemy DB instance
│   ├── models/
│   │   └── chat_history.py       # ChatHistory SQLAlchemy model
│   ├── routes/
│   │   ├── chat.py               # Chat UI route + /api/chat endpoints
│   │   ├── voice.py              # Voice processing endpoint (TTS + response)
│   │   ├── wakeword.py           # Wake-word detection endpoints
│   │   ├── api.py                # Example/demo API
│   │   └── main.py               # Index route blueprint (renders index.html)
│   ├── services/
│   │   ├── gemini_api.py         # Wrapper for google.generativeai
│   │   ├── tts_api.py            # Edge TTS helper (text → audio)
│   │   ├── stt.py                # Speech-to-text wrapper
│   │   ├── wakeword_local.py     # Vosk-based wakeword detector
│   │   ├── cache.py              # In-memory response cache
│   │   └── sync_rate_limiter.py  # Token-bucket rate limiter
│   ├── templates/                # Jinja2 templates
│   │   ├── base.html
│   │   ├── index.html
│   │   ├── chat.html
│   │   ├── 404.html
│   │   └── error.html
│   └── static/                   # Static assets
│       ├── css/
│       │   └── style.css
│       └── js/
│           ├── main.js
│           ├── chat.js
│           ├── wakeword.js
│           └── animations.js
├── instance/                     # SQLite DB files (runtime)
│   └── chat_history.db
└── vosk-model-small-en-us-0.15/  # Optional local Vosk model


---

⚙️ Features

- Chat interface (text input) with persistent session-based chat history stored in PostgreSQL (Supabase).
- Voice processing endpoint that takes text and returns both AI text response and TTS audio (base64).
- Wake-word detection using Vosk (`WakeWordDetector`) with endpoints to detect wake-word from posted audio slices.
- Rate-limited and cached calls to Google Gemini for robust AI response handling.
- TTS using `edge-tts`; voices can be listed and changed via `TTSService`.
- CORS-enabled API endpoints for frontend integration.
- Environment variable validation on startup.
- Comprehensive error handling with custom templates for 404 and general errors.
- Health check endpoint for monitoring (`/health`).

---

🔑 Requirements

- Python 3.11+ (project uses modern libs — 3.10 may work but 3.11+ recommended)
- OS: Linux / macOS recommended for audio device access. Windows is supported but may need extra drivers for `pyaudio`.

Key Python packages (see `requirements.txt`):

- Flask, Flask-SQLAlchemy
- google-generativeai
- edge-tts
- vosk
- pyaudio (for microphone capture)
- speech_recognition
- numpy, scipy
- python-dotenv

Note: `pyaudio` can be tricky to install on Windows. Use prebuilt wheels or install portaudio dev libraries first.

---

🛠 Installation

Follow these steps to run the project locally.

1. Clone the repository:

```bash
git clone <repo-url> yara-assistant
cd yara-assistant
```

2. Create and activate a virtual environment (Windows PowerShell example):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

On macOS / Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

If you have issues with `pyaudio` on Windows, try installing a prebuilt wheel from: https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio

4. Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

Then edit `.env` and add your API keys:

```
# Flask Configuration
SECRET_KEY=your-secret-key-change-this-in-production
FLASK_DEBUG=false

# Google AI API Key (Required)
GOOGLE_API_KEY=your-google-api-key-here

# Supabase Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=postgresql://postgres.your-project:password@host:6543/postgres

# Optional: OpenAI API Key (fallback for TTS)
OPENAI_API_KEY=your-openai-api-key-here
```

Get your Google API key from: https://makersuite.google.com/app/apikey
Get Supabase credentials from: https://supabase.com/dashboard

5. Database is automatically configured with Supabase. The migration has already been applied to create the `chat_history` table. You can verify the connection using the health check endpoint after starting the app.

6. (Optional) Vosk model: The `WakeWordDetector` will try to download the Vosk model automatically if it is not found in `app/services/vosk-model-small-en-us-0.15` or in the repo root `vosk-model-small-en-us-0.15/`. If automatic download fails, manually download and extract the model into either `vosk-model-small-en-us-0.15/` in the project root or `app/services/vosk-model-small-en-us-0.15/`.

Manual model download URL (small English model):
https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip

---

▶️ Usage

Run the app locally:

```powershell
# Ensure venv is activated
python run.py
```

- The app listens on `http://0.0.0.0:5000/` by default.
- Visit `http://localhost:5000/` to open the UI.
- Visit `http://localhost:5000/chat` to open the chat UI.

You can also run with Flask CLI (from the project root):

```powershell
set FLASK_APP=run.py; set FLASK_ENV=development; flask run
```

Or use Gunicorn for production (Linux):

```bash
gunicorn --bind 0.0.0.0:5000 run:app
```

---

🌐 Routes (summary)

Note: Some routes are registered as blueprints with a prefix (see `app/__init__.py`).

- GET / -> Renders `index.html` (main UI)
- GET /chat -> Renders `chat.html`

Chat blueprint (`/api/chat`):
- POST /api/chat (chat.chat_api) -> Accepts JSON { "message": "..." }, stores user message, queries Gemini, stores AI response, returns {"response": "...", "session_id": "..."}
- GET /api/chat/history -> Returns JSON history of the current session messages.

Voice blueprint (`/api/voice` or `/voice` - note: legacy URL differences exist in templates):
- POST /voice/api/process -> Accepts JSON { "text": "..." }, stores user message, queries Gemini, returns AI text response and `audio` (base64-encoded) for TTS playback.

Wakeword blueprint (`/wakeword`):
- POST /wakeword/api/detect -> Expects JSON with `audio_data` array (float samples) or bytes converted by the client; returns `{ wake_word_detected: bool, confidence: float }`.
- GET /wakeword/api/status -> Returns detector status `{ active: bool, wake_word: str, sensitivity: float }`.

Example demo API (legacy/example):
- POST /api/chat -> Simple echo endpoint in `app/routes/api.py` (not the same as the blueprint `chat_bp`); returns `{ "response": "Echo: ..." }`.
- GET /api/chat/history -> Returns an in-memory history (for demo purposes).

---

⚡ Example Usage

1) Text chat request (client -> server)

POST /api/chat
Content-Type: application/json

```json
{ "message": "Hello Yara, what's the weather like?" }
```

Success response (200):

```json
{
  "response": "I'm not connected to live weather data, but I can help explain how to check the forecast...",
  "session_id": "..."
}
```

2) Voice processing (text -> TTS)

POST /voice/api/process
Content-Type: application/json

```json
{ "text": "Tell me a joke" }
```

Success response (200):

```json
{
  "response": "Why did the computer get cold? Because it left its Windows open!",
  "audio": "<base64-encoded-audio-bytes>",
  "session_id": "..."
}
```

Client can decode `audio` from base64 and play it as an audio blob in the browser.

3) Wake-word detection

POST /wakeword/api/detect
Content-Type: application/json

```json
{ "audio_data": [0.0, 0.01, ...] }
```

Response:

```json
{ "wake_word_detected": true, "confidence": 1.0 }
```

---

🗄 Database

The project uses PostgreSQL (Supabase) with SQLAlchemy ORM. The `ChatHistory` model (`app/models/chat_history.py`) has:

- id: UUID primary key (auto-generated)
- session_id: text (UUID per user session)
- message: text (message content)
- is_user: boolean (True for user messages, False for AI responses)
- timestamp: timestamptz (UTC by default)
- created_at: timestamptz

The database schema is managed through Supabase migrations. Row Level Security (RLS) is enabled with public access policies (suitable for demo; restrict for production).

Health check endpoint: `GET /health` - Returns database connection status.

---

🎤 Voice Assistant details

- Wake Word Detection: Implemented using Vosk (`WakeWordDetector`). The detector either uses a local model included in the repo or downloads `vosk-model-small-en-us-0.15` automatically. The detector exposes a simple API which accepts float PCM audio converted to int16 bytes.

- Speech-to-Text (STT): `app/services/stt.py` wraps `speech_recognition` and uses Google Speech Recognition as a free backend. It can process bytes or listen from microphone if the server has audio hardware access.

- Text-to-Speech (TTS): `app/services/tts_api.py` uses `edge-tts` to synthesize audio. `TTSService.text_to_speech()` returns raw audio bytes which are base64-encoded by the `/voice/api/process` endpoint for client playback.

Notes & caveats:
- Running STT/TTS on the server is convenient for demos but for production it's preferable to use client-side Web Speech API for STT and play server-provided TTS for consistency.
- `pyaudio` is optional and mainly needed if you plan to capture microphone audio on the server.

---

🔧 Configuration (.env variables)

Required environment variables (copy from `.env.example`):

- **SECRET_KEY**: Flask secret key for session management (generate a random string)
- **FLASK_DEBUG**: Set to `false` in production, `true` for development
- **GOOGLE_API_KEY**: Google Generative AI API key (required for Gemini)
- **SUPABASE_URL**: Your Supabase project URL
- **SUPABASE_ANON_KEY**: Your Supabase anonymous key
- **DATABASE_URL**: PostgreSQL connection string from Supabase
- **OPENAI_API_KEY**: OpenAI API key (optional, for TTS fallback)

Optional configuration in `app/config.py`:
- WAKE_WORD (default: `yara`)
- WAKE_WORD_SENSITIVITY (float 0.1-1.0, default: 0.6)
- TTS_SERVICE (default: `edge-tts`)
- STT_SERVICE (default: `web-speech-api`)

The application validates all required environment variables on startup and will log warnings for missing or placeholder values.

---

🛡 Error Handling

- Custom 404 page: `app/templates/404.html` is rendered for not-found routes.
- Global exception handler in `app/__init__.py` renders `error.html` and logs the exception with traceback.
- API endpoints return JSON errors with appropriate HTTP status codes (400 for client errors, 500 for server errors).

---

🙌 Contribution Guidelines

Contributions are welcome. Suggested workflow:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Implement changes, run the app locally, and add tests if applicable
4. Open a Pull Request describing the change

Please ensure:
- Code follows the existing style and patterns
- New dependencies are added to `requirements.txt`
- Sensitive keys are never committed; use `.env` for secrets

---

📜 License

This project does not include a license file. If you intend to open-source it, consider adding an OSI-approved license such as MIT. Add a `LICENSE` file to the repository root.

---

Completion & next steps

- README created at project root.
- If you want, I can also:
  - Add a sample `.env.example` to the repo.
  - Add a simple run script or a `Makefile` for common tasks.
  - Verify the app runs in this environment and fix any immediate issues (e.g., path mismatches in blueprints or template references).

If you'd like any of those, tell me which and I'll proceed.