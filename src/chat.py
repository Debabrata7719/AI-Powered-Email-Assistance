"""
DebAI Email Assistant - CLI Chatbot

Command-line interface for the email assistant with conversation memory.
"""

from langchain_groq import ChatGroq
from langchain.agents import create_agent
from langchain_core.tools import tool

from email_service import send_email_direct
from config import GROQ_API_KEY

# Initialize LLM
llm = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name="openai/gpt-oss-120b",
    temperature=0
)

@tool
def send_email_tool(receiver_email: str, subject: str, message: str) -> str:
    """Send an email to a specific address."""
    return send_email_direct(receiver_email, subject, message)


agent = create_agent(
    model=llm,
    tools=[send_email_tool],
    system_prompt="You are an AI assistant that helps users send emails. You can remember previous conversations in this session. IMPORTANT: When composing email messages, do NOT include sign-offs like 'Best regards' or 'Sincerely' - these are added automatically.",
    debug=True,
)


# Chat loop with conversation memory
def chatbot():
    print("AI Email Assistant Ready! Type 'exit' to quit.")
    print("I can remember our conversation! 🧠\n")
    
    # Store conversation history using messages list (keep last 10 messages = 5 pairs)
    conversation_history = []
    MAX_MESSAGES = 10  # Keep last 5 exchanges (10 messages)

    while True:
        user_input = input("You: ")

        if user_input.lower() == "exit":
            print("\nGoodbye! 👋")
            break

        # Add user message to history
        conversation_history.append({"role": "user", "content": user_input})
        
        # Keep only last MAX_MESSAGES messages (window)
        if len(conversation_history) > MAX_MESSAGES:
            conversation_history = conversation_history[-MAX_MESSAGES:]
        
        # Invoke agent with windowed conversation history
        response = agent.invoke(
            {"messages": conversation_history}
        )
        
        # Extract bot response
        bot_message = response["messages"][-1].content
        
        # Add AI response to history
        conversation_history.append({"role": "assistant", "content": bot_message})
        
        # Apply window limit again
        if len(conversation_history) > MAX_MESSAGES:
            conversation_history = conversation_history[-MAX_MESSAGES:]
        
        print("\nBot:", bot_message, "\n")


if __name__ == "__main__":
    chatbot()
