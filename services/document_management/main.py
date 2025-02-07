from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from common.config import config
from common.logger import get_logger
import os

logger = get_logger("document_management")
app = FastAPI(title="Document Management Service", debug=config.DEBUG)

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    logger.info(f"Received file upload: {file.filename}")
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        logger.info(f"File saved: {file_path}")
        return JSONResponse(content={"filename": file.filename, "status": "uploaded"})
    except Exception as e:
        logger.error(f"Failed to save file {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail="File upload failed") 