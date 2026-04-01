import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers })
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { user_id, problem_id } = body

    if (!user_id || !problem_id) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400, headers })
    }

    const today = new Date().toISOString().split('T')[0]

    // Mark suggestion as completed
    const { error } = await supabaseAdmin
        .from('daily_suggestions')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString()
        })
        .eq('user_id', user_id)
        .eq('problem_id', problem_id)
        .eq('suggested_date', today)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500, headers })
    }

    return NextResponse.json({ success: true }, { headers })
}