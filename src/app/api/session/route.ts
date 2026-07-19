import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert([{}])
      .select('id')
      .single()

    if (error) {
      console.error('Error creating game session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sessionId: data.id })
  } catch (error) {
    console.error('Unexpected error in session endpoint:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
