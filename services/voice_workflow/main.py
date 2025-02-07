import asyncio
import os
import tempfile
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import uvicorn
import whisper

app = FastAPI(title="Voice Guided Workflow Service", debug=True)

# Load Whisper model once at startup (using "base" model as an example)
model = whisper.load_model("base")

async def transcribe_voice(file_bytes: bytes) -> str:
    """
    Asynchronously transcribe the provided voice file
    using the Whisper model.
    """
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp.flush()
        tmp_name = tmp.name

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, model.transcribe, tmp_name)
        transcription = result.get("text", "")
    except Exception as e:
        transcription = ""
    finally:
        os.unlink(tmp_name)
    return transcription

def parse_workflow_from_transcription(transcription: str) -> dict:
    """
    Dummy parser to extract workflow commands from the text.
    Replace this with a production-ready NLP pipeline.
    """
    tasks = []

    if "schedule" in transcription.lower():
        tasks.append({
            "task": "Schedule Meeting",
            "details": "Create a calendar event as discussed.",
        })
    elif "email" in transcription.lower():
        tasks.append({
            "task": "Send Email",
            "details": "Compose and send follow-up email.",
        })
    else:
        tasks.append({
            "task": "General Command",
            "details": transcription
        })

    return {"tasks": tasks, "raw_transcription": transcription}

@app.post("/create-workflow")
async def create_workflow(file: UploadFile = File(...)):
    try:
        file_data = await file.read()
        transcription = await transcribe_voice(file_data)
        workflow = parse_workflow_from_transcription(transcription)
        return JSONResponse(content=workflow)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/")
async def index():
    return JSONResponse(content={"message": "Voice Guided Workflow Service is running."})

if __name__ == "__main__":
    uvicorn.run("voice_workflow.main:app", host="0.0.0.0", port=8001, reload=True) 