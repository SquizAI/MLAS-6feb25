import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import uvicorn

app = FastAPI(title="Notification Service", debug=True)

# Simple connection manager to handle active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/")
async def get_notifications_page():
    html_content = """
    <!DOCTYPE html>
    <html>
        <head>
            <title>Notification Service</title>
        </head>
        <body>
            <h1>Notification Service</h1>
            <ul id="notifications"></ul>
            <script>
                const ws = new WebSocket("ws://" + location.host + "/ws/notifications");
                ws.onmessage = function(event) {
                    const li = document.createElement("li");
                    li.innerText = event.data;
                    document.getElementById("notifications").appendChild(li);
                }
            </script>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.websocket("/ws/notifications")
async def notifications_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # For demonstration, simulate periodic notifications every 5 seconds.
            await asyncio.sleep(5)
            message = f"Alert! Notification at time {int(asyncio.get_event_loop().time())}"
            await manager.broadcast(message)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run("services.notification.main:app", host="0.0.0.0", port=8020, reload=True) 