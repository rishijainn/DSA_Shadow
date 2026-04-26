import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers })
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')
    const problem_id = searchParams.get('problem_id')

    if (!user_id) {
        return NextResponse.json({ error: 'Missing user_id' }, { status: 400, headers })
    }

    const today = new Date().toISOString().split('T')[0]

    // 1. Get daily commitment
    const { data: settings } = await supabaseAdmin
        .from('user_settings')
        .select('daily_commitment')
        .eq('id', user_id)
        .single()

    const dailyLimit = settings?.daily_commitment || 3

    // 2. Get today's activity summary
    const { data: todaySummary } = await supabaseAdmin
        .from('daily_activity_summary')
        .select('*')
        .eq('user_id', user_id)
        .eq('date', today)
        .single()

    const reviewsSolved = todaySummary?.reviews_solved || 0
    const newSolved = todaySummary?.new_solved || 0
    const totalSolved = reviewsSolved + newSolved

    // 3. Count reviews due today — CAPPED at dailyLimit
    const { count: rawReviewsDue } = await supabaseAdmin
        .from('problem_scores')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .lte('next_review_date', today)

    const reviewsDueTotal = rawReviewsDue || 0
    // Cap reviews at the daily limit — excess will be shifted
    const reviewsDueCapped = Math.min(reviewsDueTotal, dailyLimit)
    const remainingReviews = Math.max(0, reviewsDueCapped - reviewsSolved)

    // 4. How many new problems are allowed
    const newAllowed = Math.max(0, dailyLimit - remainingReviews - totalSolved)

    // 5. Check if this specific problem is a review
    let isReview = false
    if (problem_id) {
        const { data: score } = await supabaseAdmin
            .from('problem_scores')
            .select('next_review_date')
            .eq('user_id', user_id)
            .eq('problem_id', problem_id)
            .single()

        if (score && score.next_review_date <= today) {
            isReview = true
        }
    }

    // 6. Decision logic
    let allowed = true
    let message: string | null = null

    if (totalSolved >= dailyLimit) {
        // Hard limit reached
        allowed = false
        message = `You've reached your daily limit of ${dailyLimit} questions. Rest well and come back tomorrow! 🌙`
    } else if (!isReview && remainingReviews > 0 && newAllowed <= 0) {
        // Trying to solve a new problem but reviews are pending and no new slots
        allowed = false
        message = `You have ${remainingReviews} review${remainingReviews > 1 ? 's' : ''} pending. Complete them first — don't lose what you've already learned! 🧠`
    } else if (!isReview && remainingReviews > 0) {
        // Allowed, but warn about reviews
        allowed = true
        message = `You have ${remainingReviews} review${remainingReviews > 1 ? 's' : ''} pending. Consider doing those first!`
    }

    return NextResponse.json({
        allowed,
        is_review: isReview,
        daily_limit: dailyLimit,
        reviews_due: reviewsDueCapped,
        reviews_due_total: reviewsDueTotal,
        reviews_solved: reviewsSolved,
        new_solved: newSolved,
        total_solved: totalSolved,
        remaining_reviews: remainingReviews,
        new_allowed: newAllowed,
        message
    }, { headers })
}
