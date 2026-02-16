"""
DebAI Email Assistant - Email Service Module

Handles email sending functionality with automatic signature.
"""

from fastmcp import FastMCP
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from config import EMAIL_ADDRESS, EMAIL_APP_PASSWORD, SENDER_NAME

# Create MCP server
mcp = FastMCP("Email Tool")


def send_email_direct(receiver_email: str, subject: str, message: str) -> str:
    """Send an email to a specific address with automatic signature."""
    
    # Add signature to message
    email_signature = f"\n\nBest regards,\n{SENDER_NAME}"
    full_message = message + email_signature
    
    msg = MIMEMultipart()
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = receiver_email
    msg["Subject"] = subject

    msg.attach(MIMEText(full_message, "plain"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_APP_PASSWORD)
        server.send_message(msg)
        server.quit()

        return "Email sent successfully."

    except Exception as e:
        return f"Error: {str(e)}"


@mcp.tool
def send_email(receiver_email: str, subject: str, message: str) -> str:
    """MCP tool wrapper for sending an email."""
    return send_email_direct(receiver_email, subject, message)


if __name__ == "__main__":
    mcp.run()
