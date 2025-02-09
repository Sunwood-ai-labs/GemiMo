export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const envPath = path.join(process.cwd(), '../../.env')

// GET /api/settings
export async function GET() {
  try {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const lines = envContent.split('\n')
    
    const apiKey = lines
      .find(line => line.startsWith('GEMINI_API_KEY='))
      ?.split('=')[1] || ''
      
    const model = lines
      .find(line => line.startsWith('GEMINI_MODEL='))
      ?.split('=')[1] || 'gemini-2.0-flash'
      
    return NextResponse.json({
      apiKey,
      model
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
    const { apiKey, model } = await request.json()
    
    let envContent = ''
    try {
      envContent = fs.readFileSync(envPath, 'utf-8')
    } catch (error) {
      envContent = ''
    }

    const lines = envContent.split('\n').filter(line => line.trim() !== '')
    
    // Update or add API key
    const apiKeyIndex = lines.findIndex(line => line.startsWith('GEMINI_API_KEY='))
    if (apiKeyIndex >= 0) {
      lines[apiKeyIndex] = `GEMINI_API_KEY=${apiKey}`
    } else {
      lines.push(`GEMINI_API_KEY=${apiKey}`)
    }

    // Update or add model setting
    const modelIndex = lines.findIndex(line => line.startsWith('GEMINI_MODEL='))
    if (modelIndex >= 0) {
      lines[modelIndex] = `GEMINI_MODEL=${model}`
    } else {
      lines.push(`GEMINI_MODEL=${model}`)
    }

    // Write back to .env file
    fs.writeFileSync(envPath, lines.join('\n') + '\n')

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
