from enum import Enum
from dataclasses import dataclass
from typing import Optional, Tuple, Dict

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
