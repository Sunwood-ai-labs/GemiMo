import io
from typing import Optional, Dict, Union, List
import time
from loguru import logger
from PIL import Image
import json
import numpy as np
from fastapi import APIRouter, WebSocket

from .types import SleepState, SleepData
from .alarm import AlarmController
from .gemini_api import GeminiAPI

class GemiMo:
    def __init__(self):
        self.gemini_api = GeminiAPI()
        self.alarm_controller = AlarmController()
        self.state_history: List[SleepData] = []
        self.current_state: Optional[SleepData] = None
        logger.info(f"GemiMo initialized with model: {self.gemini_api.current_model}")

    async def handle_message(self, message: Union[bytes, str]) -> Optional[Dict]:
        if isinstance(message, bytes):
            try:
                frame = Image.open(io.BytesIO(message))
                frame = frame.convert('RGB')
                sleep_data = await self.process_frame(frame)
                if sleep_data:
                    return {
                        "state": sleep_data.state.value,
                        "confidence": sleep_data.confidence,
                        "position": sleep_data.position,
                        "orientation": sleep_data.orientation,
                        "timestamp": sleep_data.timestamp,
                        "boxes": sleep_data.boxes,
                        "alarm": self.alarm_controller.get_alarm_parameters(sleep_data)
                    }
                return {"status": "error", "message": "Failed to process frame"}
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
                            "alarm": self.alarm_controller.get_alarm_parameters(self.current_state)
                        }
                    return {"status": "error", "message": "No analysis available"}
            except json.JSONDecodeError:
                logger.error("Invalid JSON message")
                return None
        return {"status": "error", "message": "Invalid message format"}

    async def process_frame(self, frame: Image.Image) -> SleepData:
        try:
            # 3Dボックス検出
            raw_boxes = await self.gemini_api.detect_pose(frame)
            
            # ボックスデータの正規化と変換
            normalized_boxes = {}
            for label, box_data in raw_boxes.items():
                # 位置とスケールの正規化（-1.0 から 1.0 の範囲に）
                pos = np.array(box_data[:3]) / frame.width
                dim = np.array(box_data[3:6]) / frame.width
                rot = np.array(box_data[6:9])  # 角度はそのまま
                conf = box_data[9] if len(box_data) > 9 else 0.8

                normalized_boxes[label] = {
                    "position": pos.tolist(),
                    "dimensions": dim.tolist(),
                    "rotation": rot.tolist(),
                    "confidence": float(conf)
                }

            # 睡眠状態の分析
            state, confidence = self._analyze_sleep_state(raw_boxes)
            position = self._extract_position(raw_boxes)
            orientation = self._extract_orientation(raw_boxes)

            # 結果の生成
            sleep_data = SleepData(
                state=state,
                confidence=confidence,
                position=position,
                orientation=orientation,
                timestamp=time.time(),
                boxes=normalized_boxes
            )

            self.state_history.append(sleep_data)
            if len(self.state_history) > 300:  # 30秒分のデータを保持
                self.state_history.pop(0)

            self.current_state = sleep_data
            return sleep_data

        except Exception as e:
            logger.error(f"Frame processing error: {e}")
            return self._create_unknown_state()

    def _analyze_sleep_state(self, boxes: Dict) -> tuple[SleepState, float]:
        if "person" not in boxes:
            return SleepState.UNKNOWN, 0.0

        person = boxes["person"]
        pitch = person[7]  # pitch angle from 3D box
        confidence = person[9] if len(person) > 9 else 0.8

        if abs(pitch) < 20:
            return SleepState.SLEEPING, confidence
        elif abs(pitch) > 45:
            return SleepState.AWAKE, confidence
        else:
            return SleepState.STRUGGLING, confidence * 0.8

    def _extract_position(self, boxes: Dict) -> tuple[float, float, float]:
        if "person" not in boxes:
            return (0.0, 0.0, 0.0)
        return tuple(boxes["person"][:3])

    def _extract_orientation(self, boxes: Dict) -> tuple[float, float, float]:
        if "person" not in boxes:
            return (0.0, 0.0, 0.0)
        return tuple(boxes["person"][6:9])

    def _create_unknown_state(self) -> SleepData:
        return SleepData(
            state=SleepState.UNKNOWN,
            confidence=0.0,
            position=(0.0, 0.0, 0.0),
            orientation=(0.0, 0.0, 0.0),
            timestamp=time.time()
        )

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
