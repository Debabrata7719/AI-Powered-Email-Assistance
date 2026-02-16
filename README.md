# DebAI - AI Email Assistant 📧

A modern, conversational AI-powered email assistant built with FastAPI, LangChain, and Groq LLM. Features a beautiful chat-style interface for sending emails through natural language with automatic email signatures.

## 🌟 Features

- **Conversational AI Interface**: Chat-style UI similar to ChatGPT
- **Natural Language Email Sending**: Just describe what you want to send
- **Conversation Memory**: Remembers last 5 exchanges per session
- **Automatic Email Signature**: Adds "Best regards, [Your Name]" automatically
- **LangChain Agent**: Intelligent email parameter extraction
- **Groq LLM**: Fast, powerful language model
- **MCP Support**: Uses Model Context Protocol (MCP) in the workflow
- **Modern UI**: Beautiful gradient design with smooth animations
- **Real-time Processing**: Instant AI responses with typing indicators

## 🏗️ Project Structure

```
AI_EMAIL_WRITER/
├── src/                    # Source code directory
│   ├── __init__.py        # Package initialization
│   ├── config.py          # Configuration management
│   ├── main.py            # FastAPI backend server
│   ├── chat.py            # CLI chatbot (standalone)
│   └── email_service.py   # Email sending logic
├── frontend/              # Web interface
│   ├── index.html         # Chat UI
│   ├── style.css          # Modern styling
│   └── script.js          # Frontend logic
├── docs/                  # Documentation
├── .env                   # Environment variables (gitignored)
├── .gitignore             # Git ignore rules
├── requirements.txt       # Python dependencies
├── start.bat              # Quick start script (Windows)
└── README.md              # This file
```

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create/update `.env` file with your credentials:

```env
GROQ_API_KEY=your_groq_api_key_here
EMAIL_ADDRESS=your_gmail@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password
SENDER_NAME=Your Name
```

**Getting Gmail App Password:**
1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account → Security → 2-Step Verification → App passwords
3. Generate a new app password for "Mail"

### 3. Run the Application

**Option 1: Using start.bat (Windows)**
```bash
start.bat
```

**Option 2: Manual start**
```bash
cd src
python main.py
```

The server will start on `http://127.0.0.1:8000`

## 📡 API Endpoints

### `POST /chat`
Main chat endpoint for conversational email sending.

**Request:**
```json
{
  "message": "Send an email to john@example.com about tomorrow's meeting"
}
```

**Response:**
```json
{
  "response": "Email sent successfully to john@example.com!"
}
```

### `POST /send-email`
Direct email sending endpoint.

**Parameters:**
- `receiver_email`: Recipient email address
- `subject`: Email subject
- `message`: Email body

### `GET /health`
Health check endpoint to verify API and configuration status.

### `GET /docs`
Interactive API documentation (Swagger UI)

## 🎨 Frontend Access

Once the server is running, access the web interface at:

**http://127.0.0.1:8000/app/**

## 💡 Usage Examples

### Via Web Interface:
1. Open `http://127.0.0.1:8000/app/`
2. Type natural language commands like:
   - "Send an email to boss@company.com about sick leave tomorrow"
   - "Email team@startup.com with project update"
   - "Write to hr@company.com requesting vacation"

### Via CLI (Alternative):
```bash
python chat.py
```

### Via API:
```bash
curl -X POST "http://127.0.0.1:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Send email to test@example.com saying hello"}'
```

## 🛠️ Technology Stack

- **Backend**: FastAPI, Python 3.x
- **AI/ML**: LangChain, Groq LLM
- **Protocol**: MCP (Model Context Protocol)
- **Email**: SMTP (Gmail)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Styling**: Modern gradient design with Inter font

## 🔧 Configuration

### Supported LLM Models
Currently using `openai/gpt-oss-120b` via Groq. You can change this in `main.py`:

```python
llm = ChatGroq(
    groq_api_key=groq_api_key,
    model_name="openai/gpt-oss-120b",  # Change model here
    temperature=0
)
```

### CORS Settings
For production, update CORS origins in `main.py`:

```python
allow_origins=["https://yourdomain.com"]  # Replace "*" with specific domains
```

## 📝 Notes

- The AI extracts recipient, subject, and message from natural language
- Emails are sent via Gmail SMTP (port 587)
- The agent uses LangChain's tool-calling capabilities
- Frontend includes typing indicators and smooth animations

## 🐛 Troubleshooting

**Email not sending?**
- Verify Gmail app password is correct
- Check 2FA is enabled on Google account
- Ensure "Less secure app access" is not blocking

**API errors?**
- Verify Groq API key is valid
- Check all dependencies are installed
- Review console logs for detailed errors



**Built with FastAPI, LangChain, Groq, and MCP (Model Context Protocol)**
