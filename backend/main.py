import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from PIL import Image
import io
import sys
from pathlib import Path

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

@app.get("/")
async def root():
    return {"message": "GemiMo API is running"}

@app.websocket("/ws/gemimo")
async def gemimo_feed(websocket: WebSocket):
    gemimo = GemiMo()
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    try:
        while True:
            frame_data = await websocket.receive_bytes()
            frame = Image.open(io.BytesIO(frame_data))
            logger.info(f"Received frame with size: {frame.size}")
            
            sleep_data = await gemimo.process_frame(frame)
            logger.info(f"Sleep state: {sleep_data.state.value}")
            
            await websocket.send_json({
                "state": sleep_data.state.value,
                "confidence": sleep_data.confidence,
                "position": sleep_data.position,
                "orientation": sleep_data.orientation,
                "timestamp": sleep_data.timestamp,
                "alarm": gemimo.get_alarm_parameters()
            })
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        logger.info("WebSocket connection closed")

if __name__ == "__main__":
    logger.info("Starting GemiMo server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
