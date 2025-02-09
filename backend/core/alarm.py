from .types import SleepState, SleepData
from typing import Dict, Optional
from loguru import logger

class AlarmController:
    def __init__(self):
        # 各状態のベースとなるアラームパラメータ
        self.base_params = {
            SleepState.SLEEPING: {
                "volume": 0.3,
                "frequency": 400,
                "fade_duration": 30.0  # seconds
            },
            SleepState.STRUGGLING: {
                "volume": 0.5,
                "frequency": 800,
                "fade_duration": 15.0
            },
            SleepState.AWAKE: {
                "volume": 0.2,
                "frequency": 600,
                "fade_duration": 5.0
            },
            SleepState.UNKNOWN: {
                "volume": 0.0,
                "frequency": 400,
                "fade_duration": 0.0
            }
        }
        logger.info("AlarmController initialized with base parameters")

    def get_alarm_parameters(self, sleep_data: Optional[SleepData] = None) -> Dict:
        """Get alarm parameters based on current sleep state"""
        try:
            if not sleep_data:
                logger.warning("No sleep data provided, using default parameters")
                return {
                    "volume": 0.0,
                    "frequency": 400,
                    "fade_duration": 0.0
                }

            # 基本パラメータを取得
            params = self.base_params[sleep_data.state].copy()
            
            # 信頼度に基づいて音量を調整
            base_volume = params["volume"]
            adjusted_volume = base_volume * sleep_data.confidence
            params["volume"] = min(max(adjusted_volume, 0.1), 1.0)  # 0.1-1.0の範囲に制限

            logger.debug(
                f"Alarm parameters calculated: state={sleep_data.state.value}, "
                f"confidence={sleep_data.confidence:.2f}, "
                f"volume={params['volume']:.2f}, "
                f"frequency={params['frequency']}"
            )

            return params

        except Exception as e:
            logger.error(f"Error calculating alarm parameters: {e}")
            # エラー時はサイレントモード
            return {
                "volume": 0.0,
                "frequency": 400,
                "fade_duration": 0.0
            }

    def should_play_alarm(self, sleep_data: Optional[SleepData] = None) -> bool:
        """アラームを再生すべきかどうかを判断"""
        if not sleep_data:
            return False

        try:
            # 信頼度が低すぎる場合は再生しない
            if sleep_data.confidence < 0.5:
                logger.warning(f"Low confidence ({sleep_data.confidence:.2f}), skipping alarm")
                return False

            # UNKNOWNステートではアラームを鳴らさない
            if sleep_data.state == SleepState.UNKNOWN:
                logger.debug("Unknown state, skipping alarm")
                return False

            logger.info(f"Alarm should play for state: {sleep_data.state.value}")
            return True

        except Exception as e:
            logger.error(f"Error determining if alarm should play: {e}")
            return False
