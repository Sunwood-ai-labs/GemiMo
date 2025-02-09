import google.generativeai as genai
from PIL import Image
from loguru import logger
import json
import os
from dotenv import load_dotenv
import numpy as np
import re

class GeminiAPI:
    ALLOWED_MODELS = [
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
        "gemini-2.0-flash-lite-preview-02-05",
        "gemini-2.0-pro-preview-02-05"
    ]

    def __init__(self):
        self._load_api_key()
        self.current_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self._update_model(self.current_model)
        logger.info(f"GeminiAPI initialized with model: {self.current_model}")

    def _load_api_key(self):
        load_dotenv(override=True)
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        genai.configure(api_key=api_key)
        logger.info("API key loaded successfully")

    def _update_model(self, model_id: str) -> None:
        if model_id not in self.ALLOWED_MODELS:
            logger.warning(f"Invalid model ID: {model_id}. Using default model.")
            model_id = "gemini-2.0-flash"
        self.current_model = model_id
        self.model = genai.GenerativeModel(model_id)
        logger.info(f"Model updated to: {model_id}")

    def _validate_box_3d(self, box_3d: list) -> list:
        """3Dボックスデータを検証し、必要に応じて修正する"""
        if len(box_3d) < 9:
            logger.warning(f"Invalid box_3d length: {len(box_3d)}, padding with zeros")
            # 不足している値を0で補完
            return box_3d + [0] * (9 - len(box_3d))
        return box_3d[:9]  # 必要な9つの値のみを使用

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

                Important objects to detect:
                - keyboard, mouse, monitor (indicating awake state)
                - bed, pillow, stuffed animals (indicating sleep state)
                - people and their pose
                """
            ])
            
            # レスポンスのデバッグ出力
            logger.info(f"Raw Gemini response text: {response.text}")
            
            try:
                # テキストからJSONを抽出
                text = response.text.strip()
                json_pattern = r'\[\s*\{.*?\}\s*\]'
                json_match = re.search(json_pattern, text, re.DOTALL)
                
                if json_match:
                    json_str = json_match.group(0)
                    boxes_list = json.loads(json_str)
                    
                    # 3Dボックスを標準化された形式に変換
                    processed_boxes = {}
                    for box in boxes_list:
                        try:
                            label = box["label"]
                            box_3d = self._validate_box_3d(box["box_3d"])
                            
                            # 座標を[0,1]範囲に正規化
                            x, y, z = [(v + 1) / 2 for v in box_3d[:3]]
                            w, h, d = [max(0, min(1, v)) for v in box_3d[3:6]]  # 0-1の範囲に制限
                            roll, pitch, yaw = box_3d[6:9]
                            
                            # 固定の信頼度スコアを追加
                            confidence = 0.8
                            
                            processed_boxes[label] = [x, y, z, w, h, d, roll, pitch, yaw, confidence]
                            logger.debug(f"Processed box for {label}: {processed_boxes[label]}")
                            
                        except Exception as e:
                            logger.warning(f"Error processing box {box}: {e}")
                            continue
                    
                    logger.info(f"Successfully processed {len(processed_boxes)} boxes")
                    return processed_boxes
                    
                else:
                    logger.error("No valid JSON array found in response")
                    return {}

            except json.JSONDecodeError as e:
                logger.error(f"JSON parse error: {e}")
                logger.error(f"Problematic text: {text}")
                return {}

        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return {}
