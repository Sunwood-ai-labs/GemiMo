from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Literal, Optional
from enum import Enum

router = APIRouter()

class SleepState(str, Enum):
    UNKNOWN = "UNKNOWN"
    SLEEPING = "SLEEPING"
    STRUGGLING = "STRUGGLING"
    AWAKE = "AWAKE"

class Resolution(BaseModel):
    width: int
    height: int
    label: str

MODEL_OPTIONS = Literal[
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-2.0-pro-preview-02-05"
]

class Settings(BaseModel):
    apiKey: str
    model: MODEL_OPTIONS
    cameraId: str
    facingMode: Literal['user', 'environment']
    resolution: Resolution
    alarmSounds: Optional[Dict[SleepState, str]] = None

DEFAULT_ALARM_SOUNDS = {
    SleepState.SLEEPING: '/sounds/sleeping/Moonlight-Bamboo-Forest.mp3',
    SleepState.STRUGGLING: '/sounds/struggling/Feline Symphony.mp3',
    SleepState.AWAKE: '/sounds/awake/Silent Whisper of the Sakura.mp3',
    SleepState.UNKNOWN: ''
}

@router.get("/")
async def get_settings():
    try:
        # 環境変数から設定を取得
        from dotenv import load_dotenv
        import os
        load_dotenv()
        
        return {
            "apiKey": os.getenv("GEMINI_API_KEY", ""),
            "model": os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
            "cameraId": "",
            "facingMode": "environment",
            "resolution": {
                "width": 1280,
                "height": 720,
                "label": "HD (1280x720)"
            },
            "alarmSounds": DEFAULT_ALARM_SOUNDS
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"設定の読み込みに失敗しました: {str(e)}"
        )

@router.post("/")
async def update_settings(settings: Settings):
    try:
        # .envファイルを更新
        from dotenv import set_key
        env_path = ".env"
        
        set_key(env_path, "GEMINI_API_KEY", settings.apiKey)
        set_key(env_path, "GEMINI_MODEL", settings.model)
        
        # アラーム音の設定があれば更新
        if settings.alarmSounds:
            set_key(env_path, "ALARM_SOUNDS", str(dict(settings.alarmSounds)))
        
        return {"success": True, "message": "設定を保存しました"}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"設定の保存に失敗しました: {str(e)}"
        )
