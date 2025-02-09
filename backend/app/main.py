from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from core.gemimo import GemiMo
import json
from app.api import alarm

app = FastAPI(title="GemiMo API")

# CORSの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルーターの追加
app.include_router(alarm.router, prefix="/api/alarm", tags=["alarm"])

# GemiMoインスタンスの初期化
gemimo = GemiMo()

@app.websocket("/ws/gemimo")
async def gemimo_feed(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    try:
        while True:
            frame_data = await websocket.receive_bytes()
            frame = Image.frombytes('RGB', (640, 480), frame_data)
            
            # フレーム処理
            sleep_data = await gemimo.process_frame(frame)
            
            # 結果を送信
            await websocket.send_json({
                "state": sleep_data.state.value,
                "confidence": sleep_data.confidence,
                "position": sleep_data.position,
                "orientation": sleep_data.orientation,
                "alarm": gemimo.get_alarm_parameters()
            })
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        logger.info("WebSocket connection closed")
