import os
import sys
from pathlib import Path
import uvicorn  # 追加

# Add the project root directory to Python path
root_dir = Path(__file__).parent.parent
sys.path.append(str(root_dir))

from fastapi import FastAPI, WebSocket, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from PIL import Image
import io
import json

from backend.core.gemimo import GemiMo

app = FastAPI(title="GemiMo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "GemiMo API is running"}

@app.post("/api/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """
    画像を受け取って解析結果を返すエンドポイント
    """
    try:
        contents = await file.read()
        gemimo = GemiMo()
        result = await gemimo.handle_message(contents)
        return result
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        return {"error": str(e)}

@app.websocket("/ws/gemimo")
async def gemimo_feed(websocket: WebSocket):
    gemimo = GemiMo()
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    try:
        while True:
            message = await websocket.receive()
            
            # テキストメッセージ（設定）またはバイナリメッセージ（フレーム）を処理
            if "text" in message:
                result = await gemimo.handle_message(message["text"])
            elif "bytes" in message:
                result = await gemimo.handle_message(message["bytes"])
            else:
                logger.warning(f"Unsupported message type: {message}")
                continue

            if result:
                await websocket.send_json(result)
                
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        logger.info("WebSocket connection closed")

if __name__ == "__main__":
    logger.info("Starting GemiMo server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
