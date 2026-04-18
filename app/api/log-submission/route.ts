import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { calculateTrueStreak } from '@/lib/streak'

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

    // 4. Update Daily Activity Summary (Consistency & Streaks)
    const todayStr = new Date().toISOString().split('T')[0]
    const wasDue = existing && existing.next_review_date <= todayStr

    // Fetch or create today's summary
    const { data: todaySummary } = await supabaseAdmin
        .from('daily_activity_summary')
        .select('*')
        .eq('user_id', user_id)
        .eq('date', todayStr)
        .single()

    if (!todaySummary) {
        // Get user setting limit
        const { data: settings } = await supabaseAdmin
            .from('user_settings')
            .select('daily_commitment')
            .eq('id', user_id)
            .single()
        const commitment = settings?.daily_commitment || 3

        // Calculate reviews due for the day at the moment of first activity
        const { count: currentlyDueRaw } = await supabaseAdmin
            .from('problem_scores')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id)
            .lte('next_review_date', todayStr)
            
        const currentlyDue = Math.min(currentlyDueRaw || 0, commitment)

        // Fetch yesterday's streak
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        
        const { data: yesterdaySummary } = await supabaseAdmin
            .from('daily_activity_summary')
            .select('streak')
            .eq('user_id', user_id)
            .eq('date', yesterdayStr)
            .single()

        const baseStreak = yesterdaySummary?.streak || 0
        
        // Initial status: Orange if reviews due, Green if not (since this submission solved at least one)
        // Wait, the rule is: solve all reviews -> Green. If this was the only one due, it's green.
        // If nothing was due, solving this makes it green.
        const isNowGreen = (currentlyDue === 0) || (wasDue && currentlyDue === 1)

        // the actual streak is re-evaluated reliably for UI using calculateTrueStreak,
        // but we'll try to keep this table semi-accurate.
        const newStreak = isNowGreen ? await calculateTrueStreak(user_id, todayStr) + 1 : 0

        await supabaseAdmin
            .from('daily_activity_summary')
            .insert({
                user_id,
                date: todayStr,
                reviews_due: currentlyDue || 0,
                reviews_solved: wasDue ? 1 : 0,
                new_solved: wasDue ? 0 : 1,
                streak: newStreak
            })
    } else {
        const newReviewsSolved = wasDue ? todaySummary.reviews_solved + 1 : todaySummary.reviews_solved
        const newNewSolved = wasDue ? todaySummary.new_solved : todaySummary.new_solved + 1
        
        // Final condition for Green:
        // (Due > 0 and Solved == Due) OR (Due == 0 and New > 0)
        const isNowGreen = (todaySummary.reviews_due > 0 && newReviewsSolved >= todaySummary.reviews_due) ||
                           (todaySummary.reviews_due === 0 && newNewSolved > 0)

        // Recover streak if it was 0 today but now becomes green
        let finalStreak = todaySummary.streak
        if (isNowGreen && todaySummary.streak === 0) {
            // Recalculate true streak base
            const trueBase = await calculateTrueStreak(user_id, todayStr)
            finalStreak = trueBase
        }

        await supabaseAdmin
            .from('daily_activity_summary')
            .update({
                reviews_solved: newReviewsSolved,
                new_solved: newNewSolved,
                streak: finalStreak
            })
            .eq('id', todaySummary.id)
    }

    return NextResponse.json({ success: true, next_review: nextReview }, { headers })
}