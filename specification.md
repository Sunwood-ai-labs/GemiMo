# ジェミーモ (GemiMo) 仕様書
スマート3D睡眠認識アラームシステム

## 1. システム概要

### 1.1 製品コンセプト
「ジェミーモ」(GemiMo) は、Gemini AIの3D認識技術とスマートアラーム（アラーモ）機能を組み合わせた、次世代型目覚ましアプリケーションです。あなたの睡眠を見守る優しいAIアシスタントとして、最適なタイミングと方法で目覚めをサポートします。

### 1.2 ブランドアイデンティティ
- 名称：ジェミーモ (GemiMo)
- タグライン：「AIが見守る、やさしい目覚め」
- ブランドカラー：
  - プライマリ：スカイブルー (#87CEEB)
  - セカンダリ：ラベンダー (#E6E6FA)
  - アクセント：サンライズイエロー (#FFDB58)

### 1.3 目的
高度な3D空間認識技術を活用し、ユーザーの睡眠状態をリアルタイムで把握。個々の状況に応じた最適な目覚めを実現する、パーソナライズされた目覚ましアプリケーションを提供します。

### 1.2 主要機能
- ベッド上の人物の3D認識
- 睡眠/起床状態の判定
- 状態に応じたアラーム音の制御
- リアルタイムモニタリング画面の提供

## 2. システムアーキテクチャ

### 2.1 フロントエンド (Next.js)
- TypeScript + Next.js 14
- ディレクトリ構成:
```
frontend/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   └── dashboard/
│       └── page.tsx
├── components/
│   ├── debug/
│   │   ├── CameraFeed.tsx
│   │   ├── StateMonitor.tsx
│   │   └── SystemLog.tsx
│   └── ui/
│       └── shared components
└── lib/
    ├── types/
    └── utils/
```

### 2.2 バックエンド (Python)
- FastAPI
- ディレクトリ構成:
```
backend/
├── app/
│   ├── main.py
│   ├── config.py
│   └── api/
│       ├── endpoints/
│       │   ├── camera.py
│       │   └── alarm.py
│       └── models/
│           └── schema.py
├── services/
│   ├── gemini_service.py
│   ├── camera_service.py
│   └── alarm_service.py
└── tests/
```

### 2.3 通信プロトコル
- WebSocket: カメラフィードとリアルタイムデータ
- REST API: 設定と制御
- Server-Sent Events: システムログとアラート

## 3. 技術仕様

### 3.1 Gemini API実装
```python
# backend/services/gemini_service.py

from google import genai
from google.genai import types
import numpy as np
from PIL import Image

class GeminiService:
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.0-pro-exp-02-05"

    async def analyze_frame(self, frame: Image.Image) -> dict:
        try:
            # Geminiに3D認識リクエスト
            response = self.client.models.generate_content(
                model=self.model,
                contents=[
                    frame,
                    """
                    Detect the 3D bounding boxes of bed and person.
                    Output a json list where each entry contains the object name 
                    in "label" and its 3D bounding box in "box_3d".
                    The 3D bounding box format should be 
                    [x_center, y_center, z_center, x_size, y_size, z_size, roll, pitch, yaw].
                    """
                ],
                config=types.GenerateContentConfig(
                    temperature=0.5
                )
            )
            
            # レスポンスの解析と状態判定
            boxes = self._parse_response(response.text)
            state = self._analyze_sleep_state(boxes)
            
            return {
                "boxes": boxes,
                "sleep_state": state,
                "confidence": self._calculate_confidence(boxes)
            }
            
        except Exception as e:
            print(f"Error in Gemini analysis: {e}")
            return None

    def _parse_response(self, response_text: str) -> dict:
        # JSONレスポンスのパース処理
        pass

    def _analyze_sleep_state(self, boxes: dict) -> str:
        person = boxes.get("person", {})
        if not person:
            return "unknown"
            
        # 姿勢の解析
        rotation = person.get("box_3d", [])[6:9]  # roll, pitch, yaw
        if abs(rotation[1]) < 30:  # pitch < 30度
            return "sleeping"
        return "awake"

    def _calculate_confidence(self, boxes: dict) -> float:
        # 認識信頼度の計算
        pass
```

### 3.2 FastAPI エンドポイント
```python
# backend/app/api/endpoints/camera.py

from fastapi import APIRouter, WebSocket
from services.gemini_service import GeminiService
from services.camera_service import CameraService

router = APIRouter()
gemini = GeminiService(api_key="YOUR_API_KEY")
camera = CameraService()

@router.websocket("/ws/camera")
async def camera_feed(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            frame = await camera.get_frame()
            analysis = await gemini.analyze_frame(frame)
            
            if analysis:
                await websocket.send_json({
                    "frame": frame.tobytes().hex(),
                    "analysis": analysis
                })
    except Exception as e:
        print(f"WebSocket error: {e}")
```

### 3.3 Next.js実装
```typescript
// src/components/debug/CameraFeed.tsx

import { useEffect, useRef, useState } from 'react'
import { useWebSocket } from '@/lib/hooks/useWebSocket'

export const CameraFeed = () => {
  const ws = useWebSocket('ws://localhost:8000/ws/camera')
  const [analysis, setAnalysis] = useState<any>(null)

  useEffect(() => {
    if (!ws) return

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setAnalysis(data.analysis)
      // フレームの更新処理
    }
  }, [ws])

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full h-64" />
      {analysis && (
        <div className="absolute top-0 left-0">
          {/* 3Dバウンディングボックスのオーバーレイ */}
        </div>
      )}
    </div>
  )
}
```

## 4. 状態管理とアラーム制御

### 4.1 睡眠状態の判定と状態遷移

#### 4.1.1 状態定義
1. 睡眠状態（SLEEPING）
   - 特徴：
     - 安定した水平姿勢
     - 微小な体の動き
     - 一定の呼吸パターン
   - パラメータ閾値：
     - ピッチ角: < 20度
     - 体の動き: < 0.1m/秒
     - 姿勢変化: < 5度/秒

2. もがき状態（STRUGGLING）
   - 特徴：
     - 急激な体の動き
     - 不規則な姿勢変化
     - 短時間での位置変更
   - パラメータ閾値：
     - 体の動き: > 0.3m/秒
     - 姿勢変化: > 30度/秒
     - 位置変化: > 0.2m/フレーム

3. 起床状態（AWAKE）
   - 特徴：
     - 上体の起き上がり
     - 意図的な動作
     - 持続的な姿勢変化
   - パラメータ閾値：
     - ピッチ角: > 45度
     - 持続時間: > 3秒
     - 安定した上体姿勢

#### 4.1.2 状態遷移ロジック
```python
from enum import Enum
from dataclasses import dataclass
from typing import List, Optional

class SleepState(Enum):
    SLEEPING = "SLEEPING"
    STRUGGLING = "STRUGGLING"
    AWAKE = "AWAKE"

@dataclass
class MovementData:
    pitch: float
    roll: float
    yaw: float
    movement_speed: float
    position_change: float
    time_stamp: float

class SleepStateManager:
    def __init__(self):
        self.current_state = SleepState.SLEEPING
        self.state_history: List[SleepState] = []
        self.movement_history: List<MovementData] = []
        self.struggle_start_time: Optional[float] = None
        self.awake_start_time: Optional[float] = None
        
    def update_state(self, movement_data: MovementData) -> SleepState:
        # 過去3秒のデータを保持
        self.movement_history.append(movement_data)
        if len(self.movement_history) > 30:  # 10fps想定
            self.movement_history.pop(0)
            
        new_state = self._determine_state(movement_data)
        
        # 状態遷移の検証と更新
        if new_state != self.current_state:
            if self._is_valid_transition(new_state):
                self.current_state = new_state
                self.state_history.append(new_state)
                
        return self.current_state
    
    def _determine_state(self, data: MovementData) -> SleepState:
        # もがき状態の判定（優先度高）
        if self._is_struggling(data):
            return SleepState.STRUGGLING
            
        # 起床状態の判定
        if self._is_awake(data):
            return SleepState.AWAKE
            
        # デフォルトは睡眠状態
        return SleepState.SLEEPING
    
    def _is_struggling(self, data: MovementData) -> bool:
        # もがき判定のロジック
        is_rapid_movement = data.movement_speed > 0.3
        is_rapid_rotation = abs(data.pitch) > 30 or abs(data.roll) > 30
        position_changed = data.position_change > 0.2
        
        return is_rapid_movement and (is_rapid_rotation or position_changed)
    
    def _is_awake(self, data: MovementData) -> bool:
        # 起床判定のロジック
        is_upright = data.pitch > 45
        is_stable = self._check_stability(data)
        
        return is_upright and is_stable
    
    def _check_stability(self, data: MovementData) -> bool:
        # 直近3秒間の姿勢の安定性を確認
        if len(self.movement_history) < 20:  # 最低2秒のデータ
            return False
            
        recent_movements = self.movement_history[-20:]
        pitch_variance = np.var([m.pitch for m in recent_movements])
        
        return pitch_variance < 10  # 安定した姿勢と判断する閾値
    
    def _is_valid_transition(self, new_state: SleepState) -> bool:
        # 許可する状態遷移のルール
        valid_transitions = {
            SleepState.SLEEPING: [SleepState.STRUGGLING, SleepState.AWAKE],
            SleepState.STRUGGLING: [SleepState.SLEEPING, SleepState.AWAKE],
            SleepState.AWAKE: [SleepState.STRUGGLING, SleepState.SLEEPING]
        }
        
        return new_state in valid_transitions[self.current_state]
```

#### 4.1.3 状態に応じたアラーム制御
```python
@dataclass
class AlarmSettings:
    base_volume: float
    frequency: float
    fade_duration: float

class AlarmController:
    def __init__(self):
        self.state_settings = {
            SleepState.SLEEPING: AlarmSettings(
                base_volume=0.3,
                frequency=400,  # Hz
                fade_duration=30.0  # seconds
            ),
            SleepState.STRUGGLING: AlarmSettings(
                base_volume=0.5,
                frequency=800,
                fade_duration=15.0
            ),
            SleepState.AWAKE: AlarmSettings(
                base_volume=0.2,
                frequency=600,
                fade_duration=5.0
            )
        }
    
    def get_alarm_parameters(self, state: SleepState, duration: float) -> dict:
        settings = self.state_settings[state]
        volume = min(
            settings.base_volume * (1 + duration / settings.fade_duration),
            1.0
        )
        
        return {
            "volume": volume,
            "frequency": settings.frequency,
            "fade_duration": settings.fade_duration
        }
```

### 4.2 アラーム制御システム
1. 音量制御:
   ```python
   class AlarmController:
       def __init__(self):
           self.base_volume = 0.7
           self.current_state = "DEEP_SLEEP"
           
       def adjust_volume(self, sleep_state: str) -> float:
           volume_map = {
               "DEEP_SLEEP": lambda t: min(self.base_volume * (1 + t/30), 1.0),
               "LIGHT_SLEEP": lambda _: self.base_volume,
               "AWAKE": lambda _: self.base_volume * 0.5
           }
           
           return volume_map[sleep_state](self.elapsed_time)
   ```

## 5. デプロイメント構成

### 5.1 開発環境
- Node.js 18.x以上
- Python 3.10以上
- Poetry（Python依存関係管理）
- Docker + Docker Compose

### 5.2 本番環境
- Vercel (Next.js)
- Cloud Run (Python バックエンド)
- Cloud Storage (画像データ)
- Cloud SQL (設定データ)

## 6. セキュリティ要件

### 6.1 認証・認可
- JWT認証
- OAuth2.0対応
- CORS設定

### 6.2 データ保護
- カメラデータの暗号化
- 個人情報の非永続化
- アクセスログの保存

## 7. テスト計画

### 7.1 単体テスト
```python
# backend/tests/test_gemini_service.py

import pytest
from services.gemini_service import GeminiService

def test_sleep_state_analysis():
    service = GeminiService("test_key")
    mock_boxes = {
        "person": {
            "box_3d": [0, 0, 2, 1.7, 0.4, 0.3, 0, 10, 0]
        }
    }
    
    assert service._analyze_sleep_state(mock_boxes) == "sleeping"
```

### 7.2 E2Eテスト
- Cypress/Playwright
- API統合テスト
- パフォーマンステスト

## 8. 実装スケジュール

### フェーズ1（基盤構築）: 1ヶ月
- プロジェクト構成
- CI/CD構築
- 基本API実装

### フェーズ2（コア機能）: 2ヶ月
- 3D認識システム
- アラーム制御
- フロントエンド実装

### フェーズ3（改善）: 1ヶ月
- パフォーマンス最適化
- セキュリティ強化
- バグ修正
