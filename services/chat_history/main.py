from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List
from datetime import datetime
import uvicorn

app = FastAPI(title="Chat History Service", debug=True)

class ChatMessage(BaseModel):
    sender: str
    message: str
    timestamp: datetime = None

# In-memory storage for chat messages.
chat_history: List[ChatMessage] = []

@app.post("/chat", response_model=ChatMessage)
async def add_chat(chat: ChatMessage):
    # If no timestamp is provided, assign the current UTC datetime.
    if chat.timestamp is None:
        chat.timestamp = datetime.utcnow()
    chat_history.append(chat)
    return chat

@app.get("/chat", response_model=List[ChatMessage])
async def get_chats():
    return chat_history

@app.get("/", response_class=HTMLResponse)
async def chat_page():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Chat History Service</title>
        <script>
            async function fetchChats() {
                const response = await fetch('/chat');
                const data = await response.json();
                const chatList = document.getElementById('chatList');
                chatList.innerHTML = '';
                data.forEach(chat => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${chat.sender}</strong>: ${chat.message} [${new Date(chat.timestamp).toLocaleTimeString()}]`;
                    chatList.appendChild(li);
                });
            }
            async function sendChat(event) {
                event.preventDefault();
                const senderInput = document.getElementById('sender');
                const messageInput = document.getElementById('message');
                const payload = {
                    sender: senderInput.value,
                    message: messageInput.value
                };
                await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                senderInput.value = '';
                messageInput.value = '';
                fetchChats();
            }
            window.onload = function() {
                fetchChats();
                setInterval(fetchChats, 5000);
            }
        </script>
    </head>
    <body>
        <h1>Chat History</h1>
        <ul id="chatList"></ul>
        <form onsubmit="sendChat(event)">
            <input id="sender" placeholder="Your Name" required />
            <input id="message" placeholder="Your Message" required />
            <button type="submit">Send</button>
        </form>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    uvicorn.run("services.chat_history.main:app", host="0.0.0.0", port=8030, reload=True) 