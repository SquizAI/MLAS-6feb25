import logging
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent_interaction")

app = FastAPI(title="Agent Interaction Service", debug=False)

# Allow CORS for production use
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict origins appropriately.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple connection manager for WebSocket communication.
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        try:
            await websocket.accept()
            self.active_connections.append(websocket)
            logger.info(f"WebSocket connection established: {websocket.client}")
        except Exception as e:
            logger.exception("Error accepting WebSocket connection")
            raise e
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket connection removed: {websocket.client}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            raise e
    
    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Broadcast error on connection {connection.client}: {e}")
                self.disconnect(connection)

manager = ConnectionManager()

@app.get("/health", summary="Health Check")
async def health_check():
    return {"status": "ok"}

@app.get("/", response_class=HTMLResponse)
async def get_agent_ui():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Agent Interaction Interface</title>
        <script>
            const ws = new WebSocket("ws://" + location.host + "/ws/agent");
            ws.onmessage = function(event) {
                const chat = document.getElementById("chat");
                const message = document.createElement("div");
                message.innerText = event.data;
                chat.appendChild(message);
            };
            function sendMessage() {
                const input = document.getElementById("messageInput");
                if (input.value.trim() === "") return;
                ws.send(input.value);
                input.value = "";
            }
        </script>
    </head>
    <body>
        <h1>Agent Interaction</h1>
        <div id="chat" style="border:1px solid #ccc; height:300px; overflow:auto; padding:5px;"></div>
        <input type="text" id="messageInput" placeholder="Type your message" style="width:70%;" />
        <button onclick="sendMessage()">Send</button>
    </body>
    </html>
    """
    return HTMLResponse(html_content)

@app.websocket("/ws/agent")
async def agent_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received data: {data} from {websocket.client}")
            # In production, replace this with real processing logic
            response_message = f"Agent received: {data}"
            await manager.send_personal_message(response_message, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"Client disconnected: {websocket.client}")
    except Exception as e:
        logger.exception(f"Unhandled exception in WebSocket endpoint: {e}")
        manager.disconnect(websocket)
        raise HTTPException(status_code=500, detail="Internal Server Error")

if __name__ == "__main__":
    uvicorn.run("services.agent_interaction.main:app", host="0.0.0.0", port=8005, reload=False) 