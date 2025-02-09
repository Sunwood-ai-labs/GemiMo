# GemiMo - AIスマート睡眠認識システム

## 概要
GemiMoは、Gemini AIの3D認識技術とスマートアラーム機能を組み合わせた、次世代型目覚ましアプリケーションです。ユーザーの睡眠を見守るAIアシスタントとして、最適なタイミングと方法で目覚めをサポートします。

## 技術スタック

### フロントエンド (Next.js)
- TypeScript + Next.js 14
- WebSocket for リアルタイム通信
- モジュール化されたカメラ制御システム
  - カメラ設定と権限管理
  - デバイス選択と解像度制御
  - リアルタイムプレビュー

### バックエンド (Python)
- FastAPI
- Gemini API for 3D認識
- WebSocket for ストリーミング
- モジュール化された解析システム

## プロジェクト構造

```
frontend/
├── components/
│   ├── debug/
│   │   ├── camera/
│   │   │   ├── CameraControls.tsx    # カメラ制御UI
│   │   │   └── CameraPreview.tsx     # カメラプレビュー
│   │   └── CameraFeed.tsx           # メインカメラコンポーネント
│   └── settings/
│       ├── ApiSettings.tsx          # API設定
│       ├── CameraSettings.tsx       # カメラ設定
│       ├── ModelSettings.tsx        # モデル設定
│       └── SettingsForm.tsx         # 設定フォーム
├── lib/
│   ├── hooks/
│   │   ├── camera/
│   │   │   ├── useCameraPermission.ts  # カメラ権限
│   │   │   └── useCameraSelection.ts   # カメラ選択
│   │   └── useCameraDevices.ts        # カメラデバイス管理
│   └── types/
│       └── camera.ts                  # 型定義

backend/
├── core/
│   ├── gemimo.py          # メインロジック
│   ├── frame_processor.py # フレーム解析
│   ├── gemini_api.py     # Gemini API通信
│   ├── alarm.py          # アラーム制御
│   └── types.py          # 型定義
└── app/
    └── main.py           # FastAPIアプリ

```

## 主要機能

- 🎥 カメラ制御システム
  - マルチカメラサポート
  - 解像度設定
  - フロント/バックカメラ切り替え

- 🤖 AI解析システム
  - リアルタイム姿勢認識
  - 睡眠状態判定
  - アラーム制御

- ⚙️ 設定管理
  - API鍵管理
  - モデル選択
  - カメラ設定

## 開発環境のセットアップ

1. フロントエンド
```bash
cd frontend
npm install
npm run dev
```

2. バックエンド
```bash
cd backend
pip install -r requirements.txt
python main.py
```

## ライセンス
MIT License
