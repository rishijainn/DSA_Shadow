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

    const todayStr = new Date().toISOString().split('T')[0]

    // ── DAILY LIMIT GUARD ──
    // Enforce hard cap: reviews_solved + new_solved must not exceed daily_commitment
    const { data: settings } = await supabaseAdmin
        .from('user_settings')
        .select('daily_commitment')
        .eq('id', user_id)
        .single()
    const commitment = settings?.daily_commitment || 3

    const { data: todayCheck } = await supabaseAdmin
        .from('daily_activity_summary')
        .select('reviews_solved, new_solved')
        .eq('user_id', user_id)
        .eq('date', todayStr)
        .single()

    const currentTotal = (todayCheck?.reviews_solved || 0) + (todayCheck?.new_solved || 0)
    if (currentTotal >= commitment) {
        return NextResponse.json({
            error: 'limit_reached',
            message: `Daily limit of ${commitment} reached. Come back tomorrow!`
        }, { status: 429, headers })
    }

    // Check if this is a review problem
    const { data: existingCheck } = await supabaseAdmin
        .from('problem_scores')
        .select('next_review_date')
        .eq('user_id', user_id)
        .eq('problem_id', problem_id)
        .single()

    const isReviewProblem = existingCheck && existingCheck.next_review_date <= todayStr

    // Count remaining reviews (capped at commitment)
    const { count: rawDue } = await supabaseAdmin
        .from('problem_scores')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .lte('next_review_date', todayStr)

    const reviewsDueCapped = Math.min(rawDue || 0, commitment)
    const remainingReviews = Math.max(0, reviewsDueCapped - (todayCheck?.reviews_solved || 0))
    const newAllowed = Math.max(0, commitment - remainingReviews - currentTotal)

    // Block new problems when reviews are pending and no new slots available
    if (!isReviewProblem && remainingReviews > 0 && newAllowed <= 0) {
        return NextResponse.json({
            error: 'reviews_pending',
            message: `You have ${remainingReviews} review(s) to complete first!`
        }, { status: 429, headers })
    }

    // ── SHIFT EXCESS REVIEWS ──
    // If total reviews due exceed commitment, push excess to tomorrow
    if ((rawDue || 0) > commitment) {
        // Get all due reviews ordered by date, skip the ones within limit
        const { data: allDueReviews } = await supabaseAdmin
            .from('problem_scores')
            .select('problem_id, next_review_date')
            .eq('user_id', user_id)
            .lte('next_review_date', todayStr)
            .order('next_review_date', { ascending: true })

        if (allDueReviews && allDueReviews.length > commitment) {
            const excessReviews = allDueReviews.slice(commitment)
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            const tomorrowStr = tomorrow.toISOString().split('T')[0]

            for (const excess of excessReviews) {
                await supabaseAdmin
                    .from('problem_scores')
                    .update({ next_review_date: tomorrowStr })
                    .eq('user_id', user_id)
                    .eq('problem_id', excess.problem_id)
            }
        }
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
    const wasDue = existing && existing.next_review_date <= todayStr

    // Fetch or create today's summary (re-fetch since submission was just inserted)
    const { data: todaySummary } = await supabaseAdmin
        .from('daily_activity_summary')
        .select('*')
        .eq('user_id', user_id)
        .eq('date', todayStr)
        .single()

    if (!todaySummary) {
        // Reviews due capped at commitment (already computed above as reviewsDueCapped)
        const currentlyDue = reviewsDueCapped

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