import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    })
}

export async function POST(req: NextRequest) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    const body = await req.json()
    console.log('Received body:', body)

    const { user_id, problem_id, problem_title, hint_used, difficulty_feel } = body

    // topic is removed — no longer required
    if (!user_id || !problem_id || !difficulty_feel) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400, headers })
    }

    // 1. Log submission
    const { error: submissionError } = await supabaseAdmin
        .from('submissions')
        .insert({ user_id, problem_id, problem_title, hint_used, difficulty_feel })

    if (submissionError) {
        console.log('Submission error:', submissionError)
        return NextResponse.json({ error: submissionError.message }, { status: 500, headers })
    }

    // 2. FSRS stability boost
    let stabilityBoost = 1.0
    if (!hint_used) {
        if (difficulty_feel === 'Easy') stabilityBoost = 1.5
        if (difficulty_feel === 'Medium') stabilityBoost = 2.0
        if (difficulty_feel === 'Hard') stabilityBoost = 2.5
    } else {
        stabilityBoost = 0.5
    }

    // 3. Get existing problem score
    const { data: existing } = await supabaseAdmin
        .from('problem_scores')
        .select('*')
        .eq('user_id', user_id)
        .eq('problem_id', problem_id)
        .single()

    const newStability = existing ? existing.stability * stabilityBoost : stabilityBoost
    const daysUntilReview = Math.round(newStability * 1.5)
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + daysUntilReview)

    if (existing) {
        await supabaseAdmin
            .from('problem_scores')
            .update({
                stability: newStability,
                retrievability: 1.0,
                next_review_date: nextReview.toISOString().split('T')[0],
                last_reviewed: new Date().toISOString(),
                total_solved: existing.total_solved + 1,
                hint_count: hint_used ? existing.hint_count + 1 : existing.hint_count
            })
            .eq('user_id', user_id)
            .eq('problem_id', problem_id)
    } else {
        await supabaseAdmin
            .from('problem_scores')
            .insert({
                user_id,
                problem_id,
                problem_title,
                stability: newStability,
                retrievability: 1.0,
                next_review_date: nextReview.toISOString().split('T')[0],
                total_solved: 1,
                hint_count: hint_used ? 1 : 0
            })
    }

    return NextResponse.json({ success: true, next_review: nextReview }, { headers })
}