import asyncio
import time
import os
import tempfile

from fastapi import FastAPI, WebSocket, BackgroundTasks
from fastapi.responses import HTMLResponse
import uvicorn
from pydantic import BaseModel
from common.config import config
from common.logger import get_logger

# Import Whisper and load the model (ensure openai-whisper is installed)
import whisper

logger = get_logger("video_analysis")
app = FastAPI(title="Video Analysis Service", debug=config.DEBUG)

# Global async queue to hold insights for WebSocket clients
insights_queue = asyncio.Queue()

# Load whisper model once at startup (using the "base" model as an example)
model = whisper.load_model("base")


# Data model for video analysis request
class VideoAnalysisRequest(BaseModel):
    meeting_id: str
    video_url: str  # URL of the video stream
    language: str = "en"

# Data model for video analysis response
class VideoAnalysisResponse(BaseModel):
    meeting_id: str
    transcription: str
    action_items: list
    speaker_changes: list
    sentiment: dict


# --- Production Integration Functions ---

async def transcribe_audio(audio_bytes: bytes) -> str:
    """
    Transcribes audio using OpenAI Whisper.
    Writes the audio bytes to a temporary WAV file and uses run_in_executor
    to call the synchronous `model.transcribe` method.
    """
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp.flush()
        tmp_name = tmp.name

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, model.transcribe, tmp_name)
        transcription = result.get("text", "")
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        transcription = ""
    finally:
        os.unlink(tmp_name)
    return transcription


def diarization_processing(file_path: str) -> dict:
    """
    Placeholder for a production diarization function.
    In practice, integrate with a speaker diarization library (e.g., pyannote.audio).
    """
    # Simulate processing delay and return a dummy result.
    time.sleep(0.5)
    return {"speaker_1": "Speaker 1", "speaker_2": "Speaker 2"}


async def perform_diarization(audio_bytes: bytes) -> dict:
    """
    Performs diarization on the provided audio.
    Writes the audio bytes to a temporary file and uses run_in_executor
    to call a synchronous diarization function.
    """
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp.flush()
        tmp_name = tmp.name

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, diarization_processing, tmp_name)
    except Exception as e:
        logger.error(f"Diarization failed: {e}")
        result = {}
    finally:
        os.unlink(tmp_name)
    return result


async def extract_insights(transcription: str, diarization: dict) -> list:
    """
    Runs NLP processing to extract actionable insights from the transcription.
    In production, integrate with robust NLP libraries (e.g., HuggingFace Transformers, SpaCy).
    """
    await asyncio.sleep(0.5)  # Simulate processing time
    return [{
        "timestamp": time.time(),
        "speaker": diarization.get("speaker_1", "Unknown"),
        "action": "Follow up on discussion",
        "keywords": ["follow", "discussion"],
        "sentiment": "positive"
    }]


# --- Video Capture and Processing ---

async def process_video_stream(stream_url: str):
    """
    Processes a live video stream by launching FFmpeg to extract audio,
    buffering audio data, and running transcription and diarization in batches.
    """
    process = await asyncio.create_subprocess_exec(
        "ffmpeg",
        "-i", stream_url,
        "-f", "wav",
        "pipe:1",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    # Use a bytearray to accumulate audio:
    audio_buffer = bytearray()
    THRESHOLD = 100000  # bytes; adjust threshold as needed for proper segmentation

    while True:
        chunk = await process.stdout.read(1024)
        if not chunk:
            break

        audio_buffer.extend(chunk)

        # Once sufficient audio data is accumulated, offload processing to Celery
        if len(audio_buffer) >= THRESHOLD:
            current_buffer = bytes(audio_buffer)
            audio_buffer.clear()

            # Offload heavy processing to Celery using process_audio_chunk task
            from tasks import process_audio_chunk
            celery_result = process_audio_chunk.delay(current_buffer)

            try:
                # Use asyncio.to_thread to avoid blocking the event loop while waiting for result.get()
                insights = await asyncio.to_thread(celery_result.get, 10)
                for insight in insights:
                    await insights_queue.put(insight)
            except Exception as e:
                logger.error(f"Celery task processing failed: {e}")

        await asyncio.sleep(0.1)

    await process.wait()


# --- FastAPI Endpoints ---

@app.post("/analyze-video/", response_model=dict)
async def analyze_video(request: VideoAnalysisRequest, background_tasks: BackgroundTasks):
    logger.info(f"Starting video analysis for meeting {request.meeting_id}")
    background_tasks.add_task(process_video_stream, request.video_url)
    return {"status": "started", "video_url": request.video_url}


@app.websocket("/ws/insights")
async def websocket_insights(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            insight = await insights_queue.get()
            await websocket.send_json(insight)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()


@app.get("/", response_class=HTMLResponse)
async def get_index():
    html_content = """
    <!DOCTYPE html>
    <html>
      <head>
        <title>Video Analysis Insights</title>
      </head>
      <body>
        <h1>WebSocket Insights</h1>
        <ul id="insights"></ul>
        <script>
          var ws = new WebSocket("ws://" + location.host + "/ws/insights");
          ws.onmessage = function(event) {
              var insight = JSON.parse(event.data);
              var li = document.createElement("li");
              li.innerText = JSON.stringify(insight);
              document.getElementById("insights").appendChild(li);
          };
        </script>
      </body>
    </html>
    """
    return HTMLResponse(content=html_content)


if __name__ == "__main__":
    uvicorn.run("video_analysis.main:app", host="0.0.0.0", port=8000, reload=True) 