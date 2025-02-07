import logging
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import random

logger = logging.getLogger("analytics")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Analytics Service", debug=False)

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
async def analytics_dashboard():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
      <title>Analytics Dashboard</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
      <h1>Advanced Analytics</h1>
      <canvas id="myChart" width="400" height="200"></canvas>
      <script>
        fetch('/data').then(res => res.json()).then(data => {
            const ctx = document.getElementById('myChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Task Completion',
                        data: data.values,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }).catch(error => {
            console.error("Error loading chart data:", error);
        });
      </script>
    </body>
    </html>
    """
    return HTMLResponse(html_content)

@app.get("/data", response_class=JSONResponse)
async def get_chart_data():
    try:
        labels = [f"Day {i}" for i in range(1, 8)]
        values = [random.randint(5, 20) for _ in range(7)]
        return {"labels": labels, "values": values}
    except Exception as e:
        logger.exception("Error generating chart data")
        raise HTTPException(status_code=500, detail="Internal Server Error")

if __name__ == "__main__":
    uvicorn.run("services.analytics.main:app", host="0.0.0.0", port=8040, reload=False)
