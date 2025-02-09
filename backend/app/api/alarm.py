from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
from datetime import time
import json
from pathlib import Path

router = APIRouter()

class AlarmSettings(BaseModel):
    time: str
    sounds: Dict[str, str]
    enabled: bool

SETTINGS_FILE = Path("data/alarm_settings.json")
SETTINGS_FILE.parent.mkdir(exist_ok=True)

def load_settings() -> AlarmSettings:
    try:
        if SETTINGS_FILE.exists():
            data = json.loads(SETTINGS_FILE.read_text())
            return AlarmSettings(**data)
    except Exception:
        pass
    return AlarmSettings(
        time="07:00",
        sounds={
            "SLEEPING": "/sounds/sleeping/Moonlight-Bamboo-Forest.mp3",
            "STRUGGLING": "/sounds/struggling/Feline Symphony.mp3",
            "AWAKE": "/sounds/awake/Silent Whisper of the Sakura.mp3",
            "UNKNOWN": ""
        },
        enabled=False
    )

def save_settings(settings: AlarmSettings):
    SETTINGS_FILE.write_text(settings.model_dump_json())

@router.get("/settings")
async def get_alarm_settings():
    return load_settings()

@router.post("/settings")
async def update_alarm_settings(settings: AlarmSettings):
    try:
        save_settings(settings)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
