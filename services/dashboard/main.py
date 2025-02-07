import asyncio
from fastapi import FastAPI, Request, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import uvicorn

app = FastAPI(title="Dashboard Service", debug=True)

# Set up Jinja2 templates directory to the copied folder.
templates = Jinja2Templates(directory="templates")

# Global stats simulation (in production, these would be fetched from other services)
global_stats = {
    "active_agents": 5,
    "system_health": "Good",
    "success_rate": "98%",
    "knowledge_nodes": 233,
}

@app.get("/", response_class=HTMLResponse)
async def get_dashboard(request: Request):
    """
    Serves the dashboard HTML page.
    """
    return templates.TemplateResponse("dashboard.html", {"request": request, "stats": global_stats})

@app.websocket("/ws/dashboard")
async def dashboard_ws(websocket: WebSocket):
    """
    WebSocket endpoint for pushing live dashboard updates.
    In production, you'd merge real-time data from your other modules.
    """
    await websocket.accept()
    try:
        while True:
            # Simulate dynamic updates.
            await asyncio.sleep(2)
            update = {
                "active_agents": global_stats["active_agents"] + 1,  # simulate a change
                "system_health": global_stats["system_health"],
                "success_rate": global_stats["success_rate"],
                "knowledge_nodes": global_stats["knowledge_nodes"] + 5,
                "live_transcription": "Live transcription update at time " + str(int(asyncio.get_event_loop().time())),
            }
            await websocket.send_json(update)
    except Exception as e:
        print("WebSocket disconnect:", e)
        await websocket.close()

if __name__ == "__main__":
    uvicorn.run("services.dashboard.main:app", host="0.0.0.0", port=8002, reload=True) 