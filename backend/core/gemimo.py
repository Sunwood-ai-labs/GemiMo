import io
from dataclasses import dataclass
from enum import Enum
from typing import Optional, Tuple, List, Dict, Union
import numpy as np
from PIL import Image
import time
from loguru import logger
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
from fastapi import APIRouter, WebSocket

load_dotenv()

class SleepState(Enum):
    UNKNOWN = "UNKNOWN"
    SLEEPING = "SLEEPING"
    STRUGGLING = "STRUGGLING"
    AWAKE = "AWAKE"

@dataclass
class SleepData:
    state: SleepState
    confidence: float
    position: Tuple[float, float, float]
    orientation: Tuple[float, float, float]
    timestamp: float
    boxes: Optional[Dict] = None

class GemiMo:
    DEFAULT_MODEL = "gemini-2.0-flash"
    ALLOWED_MODELS = [
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
        "gemini-2.0-flash-lite-preview-02-05",
        "gemini-2.0-pro-preview-02-05"
    ]

    def __init__(self):
        self._load_api_key()
        self.current_model = self.DEFAULT_MODEL
        self._update_model(self.current_model)
        self.state_history: List[SleepData] = []
        self.current_state: Optional[SleepData] = None
        logger.info(f"GemiMo initialized with model: {self.current_model}")

    def _update_model(self, model_id: str) -> None:
        """
        指定されたモデルIDでGeminiモデルを更新する
        """
        if model_id not in self.ALLOWED_MODELS:
            logger.warning(f"Invalid model ID: {model_id}, using default: {self.DEFAULT_MODEL}")
            model_id = self.DEFAULT_MODEL
        
        self.current_model = model_id
        self.model = genai.GenerativeModel(model_id)
        logger.info(f"Model updated to: {model_id}")

    def _load_api_key(self):
        # .envファイルを再読み込み
        load_dotenv(override=True)
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        genai.configure(api_key=api_key)
        logger.info("API key reloaded")

    async def handle_message(self, message: Union[bytes, str]) -> Optional[Dict]:
        if isinstance(message, bytes):
            # Handle binary image data
            try:
                frame = Image.open(io.BytesIO(message))
                frame = frame.convert('RGB')  # Ensure RGB format
                sleep_data = self.process_frame(frame)  # 同期的に呼び出し
                if sleep_data:
                    return {
                        "state": sleep_data.state.value,
                        "confidence": sleep_data.confidence,
                        "position": sleep_data.position,
                        "orientation": sleep_data.orientation,
                        "timestamp": sleep_data.timestamp,
                        "boxes": sleep_data.boxes,
                        "alarm": self.get_alarm_parameters()
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
                        self._load_api_key()
                    self._update_model(data.get("model", self.DEFAULT_MODEL))
                    return {"status": "ok", "model": self.current_model}
                elif data.get("type") == "recognize":
                    # Return the last analysis result if available
                    if self.current_state:
                        return {
                            "state": self.current_state.state.value,
                            "confidence": self.current_state.confidence,
                            "position": self.current_state.position,
                            "orientation": self.current_state.orientation,
                            "timestamp": self.current_state.timestamp,
                            "boxes": self.current_state.boxes,
                            "alarm": self.get_alarm_parameters()
                        }
                    return {"status": "error", "message": "No analysis available"}
            except json.JSONDecodeError:
                logger.error("Invalid JSON message")
                return None
        return {"status": "error", "message": "Invalid message format"}

    def process_frame(self, frame: Image.Image) -> SleepData:
        try:
            # Analyze frame with Gemini Vision API
            boxes = self._detect_pose(frame)
            if not boxes:
                return self._create_unknown_state()

            # Calculate sleep state based on 3D pose
            state, confidence = self._analyze_sleep_state(boxes)
            position = self._extract_position(boxes)
            orientation = self._extract_orientation(boxes)

            sleep_data = SleepData(
                state=state,
                confidence=confidence,
                position=position,
                orientation=orientation,
                timestamp=time.time(),
                boxes=boxes
            )

            self.current_state = sleep_data
            self.state_history.append(sleep_data)
            if len(self.state_history) > 300:  # Keep last 30 seconds at 10fps
                self.state_history.pop(0)

            return sleep_data

        except Exception as e:
            logger.error(f"Frame processing error: {e}")
            return self._create_unknown_state()

    def _detect_pose(self, frame: Image.Image) -> Optional[Dict]:
        try:
            response = self.model.generate_content([
                frame,
                """
                Detect the 3D bounding boxes of bed and person.
                Output a JSON object where each key is the object name
                and value contains its 3D bounding box as
                [x_center, y_center, z_center, x_size, y_size, z_size, roll, pitch, yaw].
                Include confidence scores for each detection.
                """
            ])
            # レスポンスのテキストをJSONとしてパース
            try:
                result = json.loads(response.text)
                logger.info(f"Gemini response: {result}")
                return result
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Gemini response as JSON: {e}")
                return None
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return None

    def _analyze_sleep_state(self, boxes: Dict) -> Tuple[SleepState, float]:
        if "person" not in boxes:
            return SleepState.UNKNOWN, 0.0

        person = boxes["person"]
        pitch = person[7]  # pitch angle from 3D box
        confidence = person.get("confidence", 0.8)

        if abs(pitch) < 20:
            return SleepState.SLEEPING, confidence
        elif abs(pitch) > 45:
            return SleepState.AWAKE, confidence
        else:
            return SleepState.STRUGGLING, confidence * 0.8

    def _extract_position(self, boxes: Dict) -> Tuple[float, float, float]:
        if "person" not in boxes:
            return (0.0, 0.0, 0.0)
        return tuple(boxes["person"][:3])

    def _extract_orientation(self, boxes: Dict) -> Tuple[float, float, float]:
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

    def get_alarm_parameters(self) -> Dict:
        """Get alarm parameters based on current sleep state"""
        if not self.current_state:
            return {"volume": 0.0, "frequency": 400}

        base_params = {
            SleepState.SLEEPING: {"volume": 0.3, "frequency": 400},
            SleepState.STRUGGLING: {"volume": 0.5, "frequency": 800},
            SleepState.AWAKE: {"volume": 0.2, "frequency": 600},
            SleepState.UNKNOWN: {"volume": 0.0, "frequency": 400}
        }

        params = base_params[self.current_state.state]
        
        # Adjust volume based on confidence
        params["volume"] *= self.current_state.confidence
        return params

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
