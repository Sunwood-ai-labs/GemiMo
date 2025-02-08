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

class GemiMo:
    def __init__(self):
        self.gemini_api = GeminiAPI()
        self.alarm_controller = AlarmController()
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
                        "alarm": {
                            "volume": sleep_data.alarm.volume,
                            "frequency": sleep_data.alarm.frequency
                        }
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
            # Gemini APIで3Dボックスを検出
            logger.info("Detecting pose with Gemini API...")
            boxes = await self.gemini_api.detect_pose(frame)
            logger.info(f"Detected boxes: {boxes}")

            if not boxes:
                logger.warning("No boxes detected")
                return self._create_unknown_state()

            # 睡眠状態の分析
            logger.info("Analyzing sleep state...")
            state, confidence = self._analyze_sleep_state(boxes)
            logger.info(f"Analyzed state: {state}, confidence: {confidence}")

            # 位置と向きの抽出
            position = self._extract_position(boxes)
            orientation = self._extract_orientation(boxes)
            logger.info(f"Extracted position: {position}, orientation: {orientation}")

            # SleepDataの作成用に一時的なオブジェクトを作成
            temp_data = SleepData(
                state=state,
                confidence=confidence,
                position=position,
                orientation=orientation,
                timestamp=time.time(),
                boxes=boxes,
                alarm=AlarmParameters(volume=0.0, frequency=400)
            )

            # アラームパラメータの取得と更新
            alarm_params = self.alarm_controller.get_alarm_parameters(temp_data)
            alarm = AlarmParameters(
                volume=alarm_params["volume"],
                frequency=alarm_params["frequency"]
            )

            sleep_data = SleepData(
                state=state,
                confidence=confidence,
                position=position,
                orientation=orientation,
                timestamp=time.time(),
                boxes=boxes,
                alarm=alarm
            )
            logger.info(f"Created sleep data: {sleep_data}")

            return sleep_data

        except Exception as e:
            logger.error(f"Error processing frame: {e}")
            return self._create_unknown_state()

    def _analyze_sleep_state(self, boxes: Dict) -> tuple[SleepState, float]:
        if not boxes:
            return SleepState.UNKNOWN, 0.0

        # 検出されたオブジェクトの分析
        num_objects = len(boxes)
        total_confidence = 0.0

        for label, box_data in boxes.items():
            if len(box_data) > 9:  # confidence値が存在する場合
                total_confidence += box_data[9]

        # 信頼度の平均を計算
        avg_confidence = total_confidence / num_objects if num_objects > 0 else 0.0

        # オブジェクトの組み合わせによる状態判定
        keyboard_present = "keyboard" in boxes
        mouse_present = "mouse" in boxes
        stuffed_animal_present = any(label.lower().startswith(("stuffed", "toy", "doll")) for label in boxes)

        if keyboard_present and mouse_present:
            return SleepState.AWAKE, avg_confidence
        elif stuffed_animal_present:
            return SleepState.SLEEPING, avg_confidence
        
        return SleepState.UNKNOWN, avg_confidence

    def _extract_position(self, boxes: Dict) -> tuple[float, float, float]:
        if "person" in boxes and len(boxes["person"]) >= 3:
            return tuple(boxes["person"][:3])
        return (0.0, 0.0, 0.0)

    def _extract_orientation(self, boxes: Dict) -> tuple[float, float, float]:
        if "person" in boxes and len(boxes["person"]) >= 9:
            return tuple(boxes["person"][6:9])
        return (0.0, 0.0, 0.0)

    def _create_unknown_state(self) -> SleepData:
        return SleepData(
            state=SleepState.UNKNOWN,
            confidence=0.0,
            position=(0.0, 0.0, 0.0),
            orientation=(0.0, 0.0, 0.0),
            timestamp=time.time(),
            boxes={},
            alarm=AlarmParameters(volume=0.0, frequency=400)
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
