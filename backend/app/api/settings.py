from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

router = APIRouter()

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
    resolution: dict

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
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def update_settings(settings: Settings):
    try:
        # .envファイルを更新
        from dotenv import set_key
        env_path = ".env"
        
        set_key(env_path, "GEMINI_API_KEY", settings.apiKey)
        set_key(env_path, "GEMINI_MODEL", settings.model)
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
