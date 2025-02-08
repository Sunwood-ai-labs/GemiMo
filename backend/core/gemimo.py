from dataclasses import dataclass
from enum import Enum
from typing import Optional, Tuple, List, Dict
import numpy as np
from PIL import Image
import time
from loguru import logger
import google.generativeai as genai
import os
from dotenv import load_dotenv
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
    position: Tuple[float, float, float]  # x, y, z
    orientation: Tuple[float, float, float]  # roll, pitch, yaw
    timestamp: float
    boxes: Optional[Dict] = None

class GemiMo:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
            
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro-vision')
        self.state_history: List[SleepData] = []
        self.current_state: Optional[SleepData] = None
        logger.info("GemiMo initialized with Gemini API")

    async def process_frame(self, frame: Image.Image) -> SleepData:
        try:
            # Analyze frame with Gemini Vision API
            boxes = await self._detect_pose(frame)
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

    async def _detect_pose(self, frame: Image.Image) -> Optional[Dict]:
        try:
            response = await self.model.generate_content([
                frame,
                """
                Detect the 3D bounding boxes of bed and person.
                Output a JSON object where each key is the object name
                and value contains its 3D bounding box as
                [x_center, y_center, z_center, x_size, y_size, z_size, roll, pitch, yaw].
                Include confidence scores for each detection.
                """
            ])
            return response.text
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
            frame = await websocket.receive_bytes()
            analysis = await gemimo.process_frame(frame)
            if analysis:
                await websocket.send_json({
                    "analysis": analysis
                })
    except Exception as e:
        print(f"WebSocket error: {e}")
