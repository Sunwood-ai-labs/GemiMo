from backend.core.types import SleepState, SleepData
from typing import Dict

class AlarmController:
    def __init__(self):
        self.base_params = {
            SleepState.SLEEPING: {"volume": 0.3, "frequency": 400},
            SleepState.STRUGGLING: {"volume": 0.5, "frequency": 800},
            SleepState.AWAKE: {"volume": 0.2, "frequency": 600},
            SleepState.UNKNOWN: {"volume": 0.0, "frequency": 400}
        }

    def get_alarm_parameters(self, sleep_data: SleepData) -> Dict:
        """Get alarm parameters based on current sleep state"""
        if not sleep_data:
            return {"volume": 0.0, "frequency": 400}

        params = self.base_params[sleep_data.state].copy()
        # Adjust volume based on confidence
        params["volume"] *= sleep_data.confidence
        return params
