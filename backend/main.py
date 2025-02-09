import uvicorn
from fastapi import FastAPI, WebSocket, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from PIL import Image
import io
import sys
import json
from pathlib import Path
import os
from datetime import datetime

# パスの設定を修正
sys.path.append(str(Path(__file__).parent))
from core.gemimo import GemiMo

app = FastAPI(title="GemiMo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 画像保存用のディレクトリを作成
CAPTURES_DIR = Path("captures")
CAPTURES_DIR.mkdir(exist_ok=True)

@app.get("/")
async def root():
    return {"message": "GemiMo API is running"}

@app.post("/api/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """
    画像を受け取って解析結果を返すエンドポイント
    """
    try:
        logger.info("Starting image analysis...")
        
        # 画像の読み込み
        logger.info("Reading uploaded file...")
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        logger.info(f"Image loaded: {image.size}x{image.mode}")
        
        # RGBAの場合はRGBに変換
        if image.mode == 'RGBA':
            logger.info("Converting RGBA to RGB...")
            image = image.convert('RGB')
        
        # 画像を保存
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        image_path = CAPTURES_DIR / f"capture_{timestamp}.jpg"
        logger.info(f"Saving capture to {image_path}...")
        image.save(image_path, 'JPEG')
        logger.info("Image saved successfully")
        
        # GemiMo処理の実行
        logger.info("Initializing GemiMo processing...")
        gemimo = GemiMo()
        logger.info("Starting frame processing...")
        result = await gemimo.process_frame(image)
        logger.info("Frame processing completed")
        
        # レスポンスの準備
        logger.info("Preparing response data...")
        response_data = {
            "raw_result": result,
            "state": result.state.value if result else None,
            "confidence": result.confidence if result else None,
            "position": result.position if result else None,
            "orientation": result.orientation if result else None,
            "timestamp": result.timestamp if result else None,
            "boxes": result.boxes if result else None,
            "alarm": gemimo.alarm_controller.get_alarm_parameters(result) if result else None,
            "image_path": str(image_path),
            "status": "success"
        }
        logger.info(f"Analysis completed successfully: {json.dumps(response_data, default=str)}")
        
        return response_data
        
    except Exception as e:
        error_msg = f"Error processing image: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "status": "error"}

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
