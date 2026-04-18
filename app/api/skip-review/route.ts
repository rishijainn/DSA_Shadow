import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { user_id, problem_id } = body

    if (!user_id || !problem_id) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Get existing problem score
    const { data: existing } = await supabaseAdmin
        .from('problem_scores')
        .select('*')
        .eq('user_id', user_id)
        .eq('problem_id', problem_id)
        .single()

    if (!existing) {
        return NextResponse.json({ error: 'Problem not found in queue' }, { status: 404 })
    }

    // 2. Apply explicit Skip penalty (e.g., 20% stability reduction)
    // This directly reduces retrievability and topic strength.
    const newStability = Math.max(1.0, existing.stability * 0.8)
    
    // 3. Move next review date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextReviewStr = tomorrow.toISOString().split('T')[0]

    // 4. Update the score
    const { error } = await supabaseAdmin
        .from('problem_scores')
        .update({
            stability: newStability,
            next_review_date: nextReviewStr
        })
        .eq('user_id', user_id)
        .eq('problem_id', problem_id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, next_review: nextReviewStr })
}
