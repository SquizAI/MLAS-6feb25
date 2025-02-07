import logging
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger("integration")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Integration Service", debug=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", summary="Health Check")
async def health_check():
    return {"status": "ok"}

@app.get("/", response_class=HTMLResponse)
async def integration_ui():
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Integration Connector</title>
    </head>
    <body>
        <h1>External Productivity Tool Integration</h1>
        <p>This simulates integration with external services (e.g., Google Calendar).</p>
        <button onclick="syncCalendar()">Sync Calendar</button>
        <div id="result"></div>
        <script>
            async function syncCalendar() {
                try {
                    const response = await fetch('/sync');
                    const data = await response.json();
                    document.getElementById('result').innerText = data.message;
                } catch (err) {
                    console.error("Sync error:", err);
                }
            }
        </script>
    </body>
    </html>
    """
    return HTMLResponse(html)

@app.get("/sync", response_class=JSONResponse)
async def sync_calendar():
    try:
        # In production, implement actual API calls (with retries, error handling, etc.)
        return {"message": "Calendar synced successfully!"}
    except Exception as e:
        logger.exception("Error syncing calendar")
        raise HTTPException(status_code=500, detail="Integration Error")

if __name__ == "__main__":
    uvicorn.run("services.integration.main:app", host="0.0.0.0", port=8041, reload=False)
