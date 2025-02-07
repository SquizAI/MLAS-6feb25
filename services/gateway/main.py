import asyncio
import httpx
from fastapi import FastAPI

app = FastAPI(title="Gateway Service", debug=True)

# Define a mapping of service names to their internal health (or default) endpoint URLs.
SERVICES = {
    "video_analysis": "http://video_analysis:8000/",
    "voice_workflow": "http://voice_workflow:8000/",
    "document_management": "http://document_management:8000/",
    "dashboard": "http://dashboard:8002/",  # Note: This returns HTML so we capture a snippet.
    "agent_interaction": "http://agent_interaction:8000/",
    "knowledge_graph": "http://knowledge_graph:8000/",
    "task_management": "http://task_management:8000/",
    "ml_emotional_processing": "http://ml_emotional_processing:8000/"
}

@app.get("/overview")
async def overview():
    results = {}
    async with httpx.AsyncClient(timeout=5.0) as client:
        tasks = []
        for service_name, url in SERVICES.items():
            tasks.append(fetch_service_status(client, service_name, url))
        responses = await asyncio.gather(*tasks)
        for service_status in responses:
            if service_status:
                results[service_status["service"]] = service_status
    return results

async def fetch_service_status(client: httpx.AsyncClient, service_name: str, url: str):
    try:
        response = await client.get(url)
        # If the service returns JSON, parse it; otherwise, return first 200 chars.
        if response.headers.get("content-type", "").startswith("application/json"):
            data = response.json()
        else:
            data = {"text": response.text.strip()[:200]}
        return {"service": service_name, "status": "ok", "data": data}
    except Exception as e:
        return {"service": service_name, "status": "error", "error": str(e)}

@app.get("/health")
async def health():
    return {"status": "ok", "message": "Gateway is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.gateway.main:app", host="0.0.0.0", port=8010, reload=True) 