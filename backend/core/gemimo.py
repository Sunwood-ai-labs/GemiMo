from dataclasses import dataclass
from enum import Enum
from typing import Optional, Tuple, List
import numpy as np
from PIL import Image
import time
from loguru import logger
from core.gemimo import GemiMo
from fastapi import APIRouter, WebSocket

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

class GemiMo:
    def __init__(self, config: dict = None):
        self.config = config or {}
        self.state_history: List[SleepData] = []
        self.current_state: Optional[SleepData] = None
        logger.info("GemiMo initialized")
        
    async def process_frame(self, frame: Image.Image) -> SleepData:
        try:
            gray = np.array(frame.convert('L'))
            movement = np.mean(gray) / 255.0
            
            state = SleepState.SLEEPING
            if movement > 0.6:
                state = SleepState.AWAKE
            elif movement > 0.3:
                state = SleepState.STRUGGLING

            sleep_data = SleepData(
                state=state,
                confidence=0.8,
                position=(0.0, 0.0, movement),
                orientation=(0.0, movement * 90, 0.0),
                timestamp=time.time()
            )
            
            self.current_state = sleep_data
            self.state_history.append(sleep_data)
            return sleep_data
            
        except Exception as e:
            logger.error(f"Frame processing error: {e}")
            return self._create_unknown_state()

    def _create_unknown_state(self) -> SleepData:
        """不明な状態のデータを生成"""
        return SleepData(
            state=SleepState.UNKNOWN,
            confidence=0.0,
            position=(0.0, 0.0, 0.0),
            orientation=(0.0, 0.0, 0.0),
            timestamp=time.time()
        )

    async def _detect_pose(self, frame: Image.Image) -> dict:
        # ... existing code ...

    def get_alarm_parameters(self) -> dict:
        """アラームパラメータを取得"""
        if not self.current_state:
            return {"volume": 0.0, "frequency": 400}

        params = {
            SleepState.SLEEPING: {"volume": 0.3, "frequency": 400},
            SleepState.STRUGGLING: {"volume": 0.5, "frequency": 800},
            SleepState.AWAKE: {"volume": 0.2, "frequency": 600},
            SleepState.UNKNOWN: {"volume": 0.0, "frequency": 400}
        }

        return params[self.current_state.state]

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
