import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query') || ''
    const topic = searchParams.get('topic')
    const difficulty = searchParams.get('difficulty')
    const user_id = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let supabaseQuery = supabaseAdmin
        .from('problems')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)

    if (query) {
        supabaseQuery = supabaseQuery.ilike('title', `%${query}%`)
    }

    if (difficulty) {
        supabaseQuery = supabaseQuery.eq('difficulty', difficulty)
    }

    if (topic) {
        // topics is a text array, we use cs (contains)
        supabaseQuery = supabaseQuery.contains('topics', [topic])
    }

    const { data: problems, count, error } = await supabaseQuery.order('title', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!problems) return NextResponse.json({ problems: [], total: 0 })

    // If user_id provided, join with their scores to show progress
    let problemsWithSolvedStatus = problems
    if (user_id) {
        const problemIds = problems.map(p => p.title_slug)
        const { data: userScores } = await supabaseAdmin
            .from('problem_scores')
            .select('problem_id, retrievability, stability')
            .eq('user_id', user_id)
            .in('problem_id', problemIds)

        const scoreMap = (userScores || []).reduce((acc: any, s) => {
            acc[s.problem_id] = s
            return acc
        }, {})

        problemsWithSolvedStatus = problems.map(p => ({
            ...p,
            solved: !!scoreMap[p.title_slug],
            mastery: scoreMap[p.title_slug] ? Math.round(scoreMap[p.title_slug].retrievability * 100) : 0
        }))
    }

    return NextResponse.json({
        problems: problemsWithSolvedStatus,
        total: count,
        has_more: count ? offset + problems.length < count : false
    })
}
