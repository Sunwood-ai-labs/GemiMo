<div align="center">

![GemiMo - AIスマート睡眠認識システム](https://github.com/user-attachments/assets/5f10edaf-5550-450e-88c4-a0096140acba)

# GemiMo - AIスマート睡眠認識システム

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.1-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black?logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)](https://www.python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org)

</div>

## 🎯 概要

GemiMoは、Gemini AIの3D認識技術とスマートアラーム機能を組み合わせた、次世代型目覚ましアプリケーションです。ユーザーの睡眠を見守るAIアシスタントとして、最適なタイミングと方法で目覚めをサポートします。

https://github.com/user-attachments/assets/feff5ad4-31e4-4839-9ee9-b3cbdeb98f53

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 14**: TypeScriptベースのReactフレームワーク
- **TailwindCSS**: ユーティリティファーストCSSフレームワーク
- **WebSocket**: リアルタイム通信用

### バックエンド
- **FastAPI**: 高性能なPythonウェブフレームワーク
- **Gemini API**: Google提供の次世代AI API
- **WebSocket**: ストリーミング処理用

## 🔍 主要機能

### 🎥 カメラ制御システム
- マルチカメラサポート
- 解像度設定
- フロント/バックカメラ切り替え

### 🤖 AI解析システム
- リアルタイム姿勢認識
- 睡眠状態判定
- アラーム制御

### ⚙️ 設定管理
- API鍵管理
- モデル選択
- カメラ設定

## 📂 プロジェクト構造

```
frontend/
├── components/          # UIコンポーネント
│   ├── alarm/          # アラーム関連
│   ├── debug/          # デバッグ機能
│   ├── settings/       # 設定画面
│   └── ui/             # 共通UI
├── lib/                # ユーティリティ
│   ├── hooks/          # カスタムフック
│   ├── types/          # 型定義
│   └── utils/          # ヘルパー関数
└── app/                # ページコンポーネント

backend/
├── core/               # コアロジック
│   ├── gemimo.py      # メインエンジン
│   ├── gemini_api.py  # Gemini API通信
│   └── alarm.py       # アラーム制御
└── app/               # APIエンドポイント
```

## 🚀 開発環境のセットアップ

### フロントエンド
```bash
cd frontend
npm install
npm run dev
```

### バックエンド
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## 🔒 環境変数の設定

`.env`ファイルをプロジェクトルートに作成:

```bash
GEMINI_API_KEY=your_api_key_here
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/gemimo
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 📝 ライセンス

本プロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) をご確認ください。
