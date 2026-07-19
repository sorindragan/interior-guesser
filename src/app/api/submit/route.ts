import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { sessionId, answers, score, demographics } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
    }

    const updateData: {
      updated_at: string;
      answers?: unknown;
      score?: number;
      demographics?: unknown;
    } = {
      updated_at: new Date().toISOString()
    }
    
    if (answers !== undefined) updateData.answers = answers
    if (score !== undefined) updateData.score = score
    if (demographics !== undefined) updateData.demographics = demographics

    const { error } = await supabase
      .from('game_sessions')
      .update(updateData)
      .eq('id', sessionId)

    if (error) {
      console.error('Error updating game session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in submit POST:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const scoreStr = searchParams.get('score')
    
    if (scoreStr === null) {
      return NextResponse.json({ error: 'Missing score parameter' }, { status: 400 })
    }
    
    const currentScore = parseInt(scoreStr, 10)
    if (isNaN(currentScore)) {
      return NextResponse.json({ error: 'Invalid score parameter' }, { status: 400 })
    }

    // Fetch all scores to compute the distribution/percentile
    const { data, error } = await supabase
      .from('game_sessions')
      .select('score')
      // Only include sessions that have actually answered questions
      .not('answers', 'eq', '[]')

    if (error) {
      console.error('Error fetching global scores:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const scores = data.map((d) => d.score)
    const totalGames = scores.length

    let percentile = 100
    if (totalGames > 0) {
      const beatCount = scores.filter((s) => s < currentScore).length
      percentile = Math.round((beatCount / totalGames) * 100)
    }

    return NextResponse.json({
      percentile,
      totalPlayers: totalGames,
    })
  } catch (error) {
    console.error('Unexpected error in submit GET:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
