import google.generativeai as genai
from PIL import Image
from loguru import logger
import json
import os
from dotenv import load_dotenv

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
            response = self.model.generate_content([
                frame,
                """
                Detect the 3D bounding boxes of bed and person.
                Return ONLY a valid JSON object in the following format:
                {
                    "person": [x, y, z, width, height, depth, roll, pitch, yaw, confidence],
                    "bed": [x, y, z, width, height, depth, roll, pitch, yaw, confidence]
                }
                Do not include any other text or explanation.
                """
            ])
            
            logger.info(f"Raw Gemini response: {response}")
            
            text = response.text.strip()
            try:
                result = json.loads(text)
                logger.info(f"Successfully parsed Gemini response: {result}")
                return result
            except json.JSONDecodeError:
                import re
                json_pattern = r'\{[^}]*\}'
                matches = re.findall(json_pattern, text)
                if matches:
                    try:
                        result = json.loads(matches[0])
                        logger.info(f"Extracted and parsed JSON from response: {result}")
                        return result
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse extracted JSON: {matches[0]}")
                        return None
                
                logger.error(f"No JSON-like structure found in response: {text}")
                return {
                    "error": "No valid JSON found",
                    "raw_response": text
                }
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return None
