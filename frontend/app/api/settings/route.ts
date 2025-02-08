export const runtime = 'nodejs' // defaults to edge
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// .env ファイルのパス
const envPath = path.join(process.cwd(), '../../.env')

// GET /api/settings
export async function GET() {
  try {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const apiKey = envContent
      .split('\n')
      .find(line => line.startsWith('GEMINI_API_KEY='))
      ?.split('=')[1] || ''
      
    return NextResponse.json({
      apiKey: apiKey
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    )
  }
}

// POST /api/settings
export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json()
    
    // 現在の.env内容を読み込む
    let envContent = ''
    try {
      envContent = fs.readFileSync(envPath, 'utf-8')
    } catch (error) {
      envContent = ''
    }

    // GEMINI_API_KEYの行を探す
    const lines = envContent.split('\n')
    const keyIndex = lines.findIndex(line => line.startsWith('GEMINI_API_KEY='))

    if (keyIndex >= 0) {
      // 既存のキーを更新
      lines[keyIndex] = `GEMINI_API_KEY=${apiKey}`
    } else {
      // 新しいキーを追加
      lines.push(`GEMINI_API_KEY=${apiKey}`)
    }

    // .envファイルに書き戻す
    fs.writeFileSync(envPath, lines.join('\n'))

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
