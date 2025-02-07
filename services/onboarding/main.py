import uvicorn
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI(title="Onboarding Service", debug=True)

@app.get("/", response_class=HTMLResponse)
async def onboarding_page():
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Welcome to Your Command Center</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .step { margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; }
        </style>
    </head>
    <body>
        <h1>Welcome!</h1>
        <p>Get started with your personalized command center by following these simple steps:</p>
        <div class="step">
            <h2>Step 1: Connect Your Accounts</h2>
            <p>Integrate your email, calendar, and external productivity tools to centralize your work.</p>
        </div>
        <div class="step">
            <h2>Step 2: Set Your Preferences</h2>
            <p>Customize your dashboard layout and notification settings so it works just the way you need.</p>
        </div>
        <div class="step">
            <h2>Step 3: Learn the Features</h2>
            <p>Take our interactive tour to see how live video analysis, voice-guided workflows, and more make your life easier.</p>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(html)

if __name__ == "__main__":
    uvicorn.run("services.onboarding.main:app", host="0.0.0.0", port=8042, reload=True)
