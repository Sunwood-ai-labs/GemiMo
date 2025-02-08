import google.generativeai as genai
from PIL import Image
from loguru import logger
import json
import os
from dotenv import load_dotenv
import numpy as np
import re

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
                Analyze the image and detect objects with their 3D positions and dimensions.
                Return ONLY a JSON array of objects, where each object has:
                - "label": descriptive name of the object
                - "box_3d": array of 9 values [x,y,z,width,height,depth,roll,pitch,yaw]

                Coordinate system:
                - x,y,z: center position normalized to [-1, 1]
                - width,height,depth: dimensions normalized to [0, 1]
                - roll,pitch,yaw: rotation in degrees [-180, 180]

                Example output format:
                [
                    {"label": "person", "box_3d": [0,0,0, 0.5,1.7,0.3, 0,0,0]},
                    {"label": "chair", "box_3d": [0.5,0,0.3, 0.4,0.8,0.4, 0,0,45]}
                ]

                Focus on:
                1. Person detection (highest priority)
                2. Furniture and large objects
                3. Small objects on surfaces
                """
            ])

            # レスポンスのデバッグ出力
            logger.info(f"Raw Gemini response text: {response.text}")
            
            try:
                # テキストからJSONを抽出（マークダウンやプレーンテキストも処理）
                text = response.text.strip()
                json_pattern = r'\[\s*\{.*?\}\s*\]'  # より柔軟なJSONアレイのパターン
                json_match = re.search(json_pattern, text, re.DOTALL)
                
                if json_match:
                    json_str = json_match.group(0)
                    logger.info(f"Extracted JSON array: {json_str}")
                    boxes_array = json.loads(json_str)
                    
                    # 結果を変換してスケーリングを適用
                    boxes = {}
                    for item in boxes_array:
                        if 'label' in item and 'box_3d' in item:
                            label = item['label']
                            box_3d = item['box_3d']
                            if len(box_3d) == 9:  # x,y,z, w,h,d, roll,pitch,yaw
                                # 位置を[-1,1]から[0,1]に正規化
                                pos = [(v + 1) / 2 for v in box_3d[:3]]
                                # サイズは既に[0,1]で正規化済み
                                dim = box_3d[3:6]
                                # 角度は[-180,180]のまま
                                rot = box_3d[6:9]
                                
                                boxes[label] = pos + dim + rot + [0.8]  # confidence追加
                    
                    logger.info(f"Processed boxes: {boxes}")
                    return boxes
                else:
                    logger.error("No valid JSON array found in response")
                    return {"person": [0.5, 0.5, 0.5, 0.5, 1.7, 0.3, 0, 0, 0, 0.5]}

            except json.JSONDecodeError as e:
                logger.error(f"JSON parse error: {e}")
                logger.error(f"Problematic text: {text}")
                return {"person": [0.5, 0.5, 0.5, 0.5, 1.7, 0.3, 0, 0, 0, 0.5]}

        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return {"person": [0.5, 0.5, 0.5, 0.5, 1.7, 0.3, 0, 0, 0, 0.5]}
