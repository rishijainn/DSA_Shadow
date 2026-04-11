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
    if (difficulty_feel === 'Forgot') {
        stabilityBoost = 0.0 // Will be handled specifically
    } else if (!hint_used) {
        if (difficulty_feel === 'Easy') stabilityBoost = 1.6 // Slightly increased for clean solves
        if (difficulty_feel === 'Medium') stabilityBoost = 2.0
        if (difficulty_feel === 'Hard') stabilityBoost = 2.5
    } else {
        stabilityBoost = 0.6 // Penalty for hints
    }

    // 3. Get existing problem score
    const { data: existing } = await supabaseAdmin
        .from('problem_scores')
        .select('*')
        .eq('user_id', user_id)
        .eq('problem_id', problem_id)
        .single()

    let newStability = 1.0
    if (difficulty_feel === 'Forgot') {
        newStability = 1.0 // Total reset
    } else if (existing) {
        // Apply consistency penalty: -5% per day overdue
        const today = new Date()
        const dueDate = new Date(existing.next_review_date)
        const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
        
        const consistencyPenalty = Math.pow(0.95, daysOverdue)
        newStability = existing.stability * consistencyPenalty * stabilityBoost
    } else {
        newStability = stabilityBoost * 2.0 // Initial stability
    }

    const daysUntilReview = Math.max(1, Math.round(newStability))
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