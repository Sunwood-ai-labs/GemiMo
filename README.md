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

GemiMoは、アラーム時にユーザの状態によって鳴らす音声を変えることで快適な目覚めを実現する次世代型スマートアラームシステムです。Gemini AIの3D姿勢認識技術を活用し、ユーザーの睡眠状態をリアルタイムで把握。睡眠状態に応じて最適な音声とタイミングでアラームを制御します。

https://github.com/user-attachments/assets/feff5ad4-31e4-4839-9ee9-b3cbdeb98f53

## 🌟 特徴

### 🧠 インテリジェントな睡眠認識
- Gemini AIによるリアルタイム3D姿勢認識
- 3つの状態（睡眠中、もがき中、起床中）を自動判別
- 高精度な状態検出と信頼度スコアリング

### 🎵 アダプティブアラーム制御
- 状態に応じた最適な音声選択
  - 睡眠中：穏やかな環境音「Moonlight Bamboo Forest」
  - もがき中：エネルギッシュな「Feline Symphony」
  - 起床時：さわやかな「Silent Whisper of the Sakura」
- 音量と周波数の動的調整
- スムーズなフェードイン/アウト制御

### 📱 使いやすいインターフェース
- 直感的なアラーム設定
- リアルタイム状態モニタリング
- カメラプレビューとデバッグ機能

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 14**: 最新のReactフレームワーク
- **TypeScript**: 型安全な開発
- **TailwindCSS**: モダンなUIデザイン
- **WebSocket**: リアルタイムデータ通信

### バックエンド
- **FastAPI**: 高性能Pythonウェブフレームワーク
- **Gemini API**: Google提供のAIモデル
- **WebSocket**: ストリーミング処理
- **uvicorn**: ASGIサーバー

## 🚀 開発環境のセットアップ

### 必要条件
- Python 3.10+
- Node.js 18+
- Gemini API Key

### バックエンド
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### フロントエンド
```bash
cd frontend
npm install
npm run dev
```

## 🔧 環境設定

`.env`ファイルをプロジェクトルートに作成:

```env
GEMINI_API_KEY=your_api_key_here
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/gemimo
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 📓 開発ドキュメント

- [仕様書](./specification.md)
- [コーディングルール](./AI_CODING_AGENT_DEVELOPMENT_RULES.md)

## 📝 ライセンス

本プロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)をご確認ください。
