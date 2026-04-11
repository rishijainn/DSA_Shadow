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

    // 1. Get all problem scores for the user
    const { data: scores, error: scoresError } = await supabaseAdmin
        .from('problem_scores')
        .select('*')
        .eq('user_id', user_id)

    if (scoresError) {
        return NextResponse.json({ error: scoresError.message }, { status: 500 })
    }

    if (!scores || scores.length === 0) {
        return NextResponse.json({ topics: [] })
    }

    // 2. Fetch the problem details (for topics)
    const problemIds = scores.map(s => s.problem_id)
    const { data: problemsDetails, error: problemsError } = await supabaseAdmin
        .from('problems')
        .select('title_slug, topics, difficulty')
        .in('title_slug', problemIds)

    if (problemsError) {
        return NextResponse.json({ error: problemsError.message }, { status: 500 })
    }

    // 3. Map topics to scores
    const problemMap = (problemsDetails || []).reduce((acc: any, p) => {
        acc[p.title_slug] = p
        return acc
    }, {})

    const topicStats: Record<string, {
        name: string,
        total_retrievability: number,
        total_stability: number,
        count: number,
        difficulties: Record<string, number>
    }> = {}

    const todayDate = new Date()

    scores.forEach(score => {
        const problem = problemMap[score.problem_id]
        if (!problem || !problem.topics) return

        // Calculate current retrievability (consistency adjusted)
        const lastReviewed = new Date(score.last_reviewed)
        const daysSince = Math.floor(
            (todayDate.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24)
        )
        const r = Math.pow(1 + daysSince / (9 * score.stability), -1)

        problem.topics.forEach((topic: string) => {
            if (!topicStats[topic]) {
                topicStats[topic] = {
                    name: topic,
                    total_retrievability: 0,
                    total_stability: 0,
                    count: 0,
                    difficulties: { Easy: 0, Medium: 0, Hard: 0 }
                }
            }

            topicStats[topic].total_retrievability += r
            topicStats[topic].total_stability += score.stability
            topicStats[topic].count += 1
            topicStats[topic].difficulties[problem.difficulty] = (topicStats[topic].difficulties[problem.difficulty] || 0) + 1
        })
    })

    const result = Object.values(topicStats).map(t => ({
        topic: t.name,
        avg_retrievability: Math.round((t.total_retrievability / t.count) * 100),
        avg_stability: Math.round((t.total_stability / t.count) * 10) / 10,
        problem_count: t.count,
        difficulties: t.difficulties
    }))

    // Sort by weakness (lowest retrievability first)
    result.sort((a, b) => a.avg_retrievability - b.avg_retrievability)

    return NextResponse.json({
        topics: result,
        summary: {
            total_topics: result.length,
            weakest: result.slice(0, 3).map(r => r.topic),
            strongest: [...result].sort((a, b) => b.avg_retrievability - a.avg_retrievability).slice(0, 3).map(r => r.topic)
        }
    })
}
