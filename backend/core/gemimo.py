import io
from typing import Optional, Dict, Union, List
import time
from loguru import logger
from PIL import Image
import json
import numpy as np
from fastapi import APIRouter, WebSocket

from .types import SleepState, SleepData, Box3D, AlarmParameters
from .alarm import AlarmController
from .gemini_api import GeminiAPI
from .frame_processor import FrameProcessor

class GemiMo:
    def __init__(self):
        self.gemini_api = GeminiAPI()
        self.alarm_controller = AlarmController()
        self.frame_processor = FrameProcessor()
        logger.info(f"GemiMo initialized with model: {self.gemini_api.current_model}")

    async def handle_message(self, message: Union[bytes, str]) -> Optional[Dict]:
        if isinstance(message, bytes):
            try:
                frame = Image.open(io.BytesIO(message))
                return await self.process_frame(frame)
            except Exception as e:
                logger.error(f"Error processing image: {e}")
                return {"status": "error", "message": str(e)}
        elif isinstance(message, str):
            try:
                data = json.loads(message)
                if data.get("type") == "config":
                    if data.get("reload_settings", False):
                        self.gemini_api._load_api_key()
                    self.gemini_api._update_model(data.get("model", self.gemini_api.DEFAULT_MODEL))
                    return {"status": "ok", "model": self.gemini_api.current_model}
                elif data.get("type") == "recognize":
                    if self.current_state:
                        return {
                            "state": self.current_state.state.value,
                            "alarm": {
                                "volume": self.current_state.alarm.volume,
                                "frequency": self.current_state.alarm.frequency
                            }
                        }
                    return {"status": "error", "message": "No analysis available"}
            except json.JSONDecodeError:
                logger.error("Invalid JSON message")
                return None
        return {"status": "error", "message": "Invalid message format"}

    async def process_frame(self, frame: Image.Image) -> SleepData:
        try:
            logger.info("Starting frame processing")
            boxes = await self.gemini_api.detect_pose(frame)
            
            if not boxes:
                return self.frame_processor.create_unknown_state()

            sleep_data = self.frame_processor.analyze_frame(boxes)
            alarm_params = self.alarm_controller.get_alarm_parameters(sleep_data)
            
            sleep_data.alarm = AlarmParameters(
                volume=alarm_params["volume"],
                frequency=alarm_params["frequency"]
            )
            
            return sleep_data

        except Exception as e:
            logger.error(f"Error processing frame: {e}")
            return self.frame_processor.create_unknown_state()

router = APIRouter()

@router.websocket("/ws/gemimo")
async def gemimo_feed(websocket: WebSocket):
    gemimo = GemiMo()
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive()
            if "bytes" in message:
                response = await gemimo.handle_message(message["bytes"])
            elif "text" in message:
                response = await gemimo.handle_message(message["text"])
            else:
                response = {"status": "error", "message": "Invalid message type"}
            
            if response:
                await websocket.send_json(response)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
