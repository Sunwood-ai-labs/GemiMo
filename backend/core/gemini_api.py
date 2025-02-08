import google.generativeai as genai
from PIL import Image
from loguru import logger
import json
import os
from dotenv import load_dotenv
import numpy as np

class GeminiAPI:
    DEFAULT_MODEL = "gemini-2.0-flash"
    ALLOWED_MODELS = [
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
        "gemini-2.0-flash-lite-preview-02-05",
        "gemini-2.0-pro-preview-02-05"
    ]

    def __init__(self):
        self._load_api_key()
        self.current_model = self.DEFAULT_MODEL
        self._update_model(self.current_model)

    def _load_api_key(self):
        load_dotenv(override=True)
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        genai.configure(api_key=api_key)
        logger.info("API key reloaded")

    def _update_model(self, model_id: str) -> None:
        if model_id not in self.ALLOWED_MODELS:
            logger.warning(f"Invalid model ID: {model_id}, using default: {self.DEFAULT_MODEL}")
            model_id = self.DEFAULT_MODEL
        
        self.current_model = model_id
        self.model = genai.GenerativeModel(model_id)
        logger.info(f"Model updated to: {model_id}")

    async def detect_pose(self, frame: Image.Image) -> dict:
        try:
            # Geminiへのプロンプト
            response = self.model.generate_content([
                frame,
                """
                Detect the 3D bounding boxes of objects in the image.
                For each detected object, output its label and 3D bounding box parameters:
                [x_center, y_center, z_center, width, height, depth, roll, pitch, yaw, confidence]
                
                Format the output as a JSON object where each key is the object label
                and the value is the array of 10 parameters.
                
                Focus on detecting:
                - person (highest priority)
                - bed or furniture
                - relevant objects in the scene
                
                Ensure coordinates are normalized to image dimensions.
                """
            ])

            # レスポンスのパースと検証
            logger.info(f"Raw Gemini response: {response}")
            
            try:
                # JSONの抽出（マークダウンやプレーンテキストから）
                text = response.text
                json_start = text.find('{')
                json_end = text.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = text[json_start:json_end]
                    boxes = json.loads(json_str)
                else:
                    raise ValueError("No valid JSON found in response")

                logger.info(f"Extracted and parsed JSON from response: {boxes}")
                return boxes

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Gemini response as JSON: {e}")
                return {"person": [0, 0, 2, 1, 1, 1, 0, 0, 0, 0.5]}  # フォールバック値

        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return {"person": [0, 0, 2, 1, 1, 1, 0, 0, 0, 0.5]}  # フォールバック値
