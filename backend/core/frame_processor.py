from typing import Dict, Tuple
import time
from .types import SleepState, SleepData, AlarmParameters

class FrameProcessor:
    def analyze_frame(self, boxes: Dict) -> SleepData:
        state, confidence = self._analyze_sleep_state(boxes)
        position = self._extract_position(boxes)
        orientation = self._extract_orientation(boxes)
        
        return SleepData(
            state=state,
            confidence=confidence,
            position=position,
            orientation=orientation,
            timestamp=time.time(),
            boxes=boxes,
            alarm=AlarmParameters(volume=0.0, frequency=400)
        )

    def _analyze_sleep_state(self, boxes: Dict) -> Tuple[SleepState, float]:
        if not boxes:
            return SleepState.UNKNOWN, 0.0

        num_objects = len(boxes)
        total_confidence = sum(box_data[9] for _, box_data in boxes.items() if len(box_data) > 9)
        avg_confidence = total_confidence / num_objects if num_objects > 0 else 0.0

        keyboard_present = "keyboard" in boxes
        mouse_present = "mouse" in boxes
        stuffed_animal_present = any(label.lower().startswith(("stuffed", "toy", "doll")) for label in boxes)

        if keyboard_present and mouse_present:
            return SleepState.AWAKE, avg_confidence
        elif stuffed_animal_present:
            return SleepState.SLEEPING, avg_confidence
        
        return SleepState.UNKNOWN, avg_confidence

    def _extract_position(self, boxes: Dict) -> Tuple[float, float, float]:
        if "person" in boxes and len(boxes["person"]) >= 3:
            return tuple(boxes["person"][:3])
        return (0.0, 0.0, 0.0)

    def _extract_orientation(self, boxes: Dict) -> Tuple[float, float, float]:
        if "person" in boxes and len(boxes["person"]) >= 9:
            return tuple(boxes["person"][6:9])
        return (0.0, 0.0, 0.0)

    def create_unknown_state(self) -> SleepData:
        return SleepData(
            state=SleepState.UNKNOWN,
            confidence=0.0,
            position=(0.0, 0.0, 0.0),
            orientation=(0.0, 0.0, 0.0),
            timestamp=time.time(),
            boxes={},
            alarm=AlarmParameters(volume=0.0, frequency=400)
        )