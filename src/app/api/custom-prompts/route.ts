import { NextRequest } from 'next/server'
import { getCustomPrompts, createCustomPrompt, updateCustomPrompt, deleteCustomPrompt } from '@/lib/ai/generator'

export async function GET() {
  try {
    const prompts = await getCustomPrompts()
    return Response.json({ prompts })
  } catch (error) {
    console.error('Failed to fetch custom prompts:', error)
    return Response.json({ 
      error: 'Failed to fetch custom prompts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, systemPrompt } = await request.json()
    
    if (!name || !systemPrompt) {
      return Response.json({ 
        error: 'Name and system prompt are required' 
      }, { status: 400 })
    }

    const prompt = await createCustomPrompt(name, description || '', systemPrompt)
    return Response.json({ prompt }, { status: 201 })
  } catch (error) {
    console.error('Failed to create custom prompt:', error)
    return Response.json({ 
      error: 'Failed to create custom prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()
    
    if (!id) {
      return Response.json({ 
        error: 'Prompt ID is required' 
      }, { status: 400 })
    }

    const prompt = await updateCustomPrompt(id, updates)
    return Response.json({ prompt })
  } catch (error) {
    console.error('Failed to update custom prompt:', error)
    return Response.json({ 
      error: 'Failed to update custom prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return Response.json({ 
        error: 'Prompt ID is required' 
      }, { status: 400 })
    }

    await deleteCustomPrompt(id)
    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to delete custom prompt:', error)
    return Response.json({ 
      error: 'Failed to delete custom prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}