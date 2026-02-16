"""
DebAI Email Assistant - FastAPI Server

Web API server for the email assistant with session-based conversation memory.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Optional

from langchain_groq import ChatGroq
from langchain.agents import create_agent
from langchain_core.tools import tool

from email_service import send_email_direct
from config import GROQ_API_KEY, EMAIL_ADDRESS

# Initialize FastAPI app
app = FastAPI(
    title="DebAI - Email Assistant API",
    description="AI-powered email assistant with LangChain and Groq",
    version="1.0.0"
)

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM
llm = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name="openai/gpt-oss-120b",
    temperature=0
)

# Define email tool
@tool
def send_email_tool(receiver_email: str, subject: str, message: str) -> str:
    """Send an email to a specific address."""
    return send_email_direct(receiver_email, subject, message)

# Create agent
agent = create_agent(
    model=llm,
    tools=[send_email_tool],
    system_prompt="You are DebAI, an AI assistant that helps users send emails. Be Professional and helpful. When users ask you to send an email, extract the recipient, subject, and message from their request and use the send_email_tool. You can remember previous conversations in this session. IMPORTANT: When composing email messages, do NOT include sign-offs like 'Best regards' or 'Sincerely' at the end - these are added automatically.",
    debug=True,
)

# Session storage for conversation history with window limit (in-memory)
# In production, use Redis or database
session_storage: Dict[str, List[Dict[str, str]]] = {}
MAX_MESSAGES_PER_SESSION = 10  # Keep last 5 exchanges (10 messages)

# Request/Response models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"  # Session ID for conversation tracking

class ChatResponse(BaseModel):
    response: str
    session_id: str

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "DebAI Email Assistant API is running!",
        "version": "1.0.0",
        "status": "active"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "groq_api_configured": bool(GROQ_API_KEY),
        "email_configured": bool(EMAIL_ADDRESS)
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint - processes user messages and returns AI responses
    
    Args:
        request: ChatRequest containing user message
        
    Returns:
        ChatResponse with AI-generated response
    """
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Get or create session history
        session_id = request.session_id or "default"
        
        # Initialize session storage if needed
        if session_id not in session_storage:
            session_storage[session_id] = []
        
        # Add user message to history
        session_storage[session_id].append({"role": "user", "content": request.message})
        
        # Apply window limit (keep last MAX_MESSAGES_PER_SESSION messages)
        if len(session_storage[session_id]) > MAX_MESSAGES_PER_SESSION:
            session_storage[session_id] = session_storage[session_id][-MAX_MESSAGES_PER_SESSION:]
        
        # Invoke the agent with windowed conversation history
        response = agent.invoke(
            {"messages": session_storage[session_id]}
        )
        
        # Extract the bot's response
        bot_message = response["messages"][-1].content
        
        # Add AI response to history
        session_storage[session_id].append({"role": "assistant", "content": bot_message})
        
        # Apply window limit again
        if len(session_storage[session_id]) > MAX_MESSAGES_PER_SESSION:
            session_storage[session_id] = session_storage[session_id][-MAX_MESSAGES_PER_SESSION:]
        
        return ChatResponse(response=bot_message, session_id=session_id)
    
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your request: {str(e)}"
        )

@app.post("/send-email")
async def send_email_endpoint(
    receiver_email: str,
    subject: str,
    message: str
):
    """
    Direct email sending endpoint (alternative to chat-based sending)
    
    Args:
        receiver_email: Recipient email address
        subject: Email subject
        message: Email body
        
    Returns:
        Success/failure message
    """
    try:
        result = send_email_direct(receiver_email, subject, message)
        return {"status": "success", "message": result}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )

@app.delete("/chat/history/{session_id}")
async def clear_history(session_id: str):
    """
    Clear conversation history for a specific session
    
    Args:
        session_id: Session ID to clear
        
    Returns:
        Success message
    """
    # Clear session storage
    if session_id in session_storage:
        del session_storage[session_id]
        return {"status": "success", "message": f"History cleared for session: {session_id}"}
    return {"status": "success", "message": "No history found for this session"}


# Mount static files (Frontend)
app.mount("/app", StaticFiles(directory="../frontend", html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting DebAI Email Assistant API...")
    print("📧 Frontend available at: http://127.0.0.1:8000/app/")
    print("🔗 API docs available at: http://127.0.0.1:8000/docs")
    uvicorn.run(app, host="127.0.0.1", port=8000)
