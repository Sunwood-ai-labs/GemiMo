from enum import Enum
from dataclasses import dataclass
from typing import Optional, Tuple, Dict, TypedDict

class SleepState(Enum):
    UNKNOWN = "UNKNOWN"
    SLEEPING = "SLEEPING"
    STRUGGLING = "STRUGGLING"
    AWAKE = "AWAKE"

class Box3D(TypedDict):
    position: list[float]  # [x, y, z]
    dimensions: list[float]  # [width, height, depth]
    rotation: list[float]  # [roll, pitch, yaw]
    confidence: float

@dataclass
class SleepData:
    state: SleepState
    confidence: float
    position: Tuple[float, float, float]
    orientation: Tuple[float, float, float]
    timestamp: float
    boxes: Optional[Dict[str, Box3D]] = None
