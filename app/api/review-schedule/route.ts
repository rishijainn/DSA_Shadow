import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
        return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    const todayDate = new Date()

    const { data: settings } = await supabaseAdmin
        .from('user_settings')
        .select('daily_commitment')
        .eq('id', user_id)
        .single()
    
    const commitment = settings?.daily_commitment || 3

    // Check how many reviews the user has already solved today
    const { data: todaySummary } = await supabaseAdmin
        .from('daily_activity_summary')
        .select('reviews_solved')
        .eq('user_id', user_id)
        .eq('date', today)
        .single()
    
    const reviewsSolvedToday = todaySummary?.reviews_solved || 0
    const effectiveLimit = Math.max(0, commitment - reviewsSolvedToday)

    // Get problems due for review today
    let dueProblems: any[] = []
    let error = null
    
    if (effectiveLimit > 0) {
        const { data, error: fetchError } = await supabaseAdmin
            .from('problem_scores')
            .select('*')
            .eq('user_id', user_id)
            .lte('next_review_date', today)
            .order('next_review_date', { ascending: true })
            .limit(effectiveLimit)
        
        dueProblems = data || []
        error = fetchError
    }

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get all problem scores
    const { data: allProblems } = await supabaseAdmin
        .from('problem_scores')
        .select('*')
        .eq('user_id', user_id)
        .order('last_reviewed', { ascending: false })

    // Calculate retrievability for each problem
    const problemsWithR = allProblems?.map(p => {
        const lastReviewed = new Date(p.last_reviewed)
        const daysSince = Math.floor(
            (todayDate.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24)
        )
        const retrievability = Math.pow(1 + daysSince / (9 * p.stability), -1)
        const hintRate = p.total_solved > 0
            ? Math.round((p.hint_count / p.total_solved) * 100)
            : 0

    return {
            problem_id: p.problem_id,
            problem_title: p.problem_title,
            stability: Math.round(p.stability * 10) / 10,
            retrievability: Math.round(retrievability * 100),
            next_review_date: p.next_review_date,
            total_solved: p.total_solved,
            hint_rate: hintRate,
            is_due: p.next_review_date <= today
        }
    })

    // Get submissions from today
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const { data: solvedToday } = await supabaseAdmin
        .from('submissions')
        .select('*')
        .eq('user_id', user_id)
        .gte('created_at', startOfToday.toISOString())
        .order('created_at', { ascending: false })

    // We only return the ones explicitly fetched in `dueProblems` to enforce the rollover cap.
    const validDueIds = new Set(dueProblems?.map(d => d.problem_id) || [])

    return NextResponse.json({
        due_today: dueProblems?.length || 0,
        solved_today: solvedToday || [],
        problems_due: problemsWithR?.filter(p => validDueIds.has(p.problem_id)) || [],
        all_problems: problemsWithR || []
    })
}