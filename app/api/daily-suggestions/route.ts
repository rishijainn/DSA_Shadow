import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getDifficultyMix(level: string, commitment: number): ('Easy' | 'Medium' | 'Hard')[] {
    const mix: ('Easy' | 'Medium' | 'Hard')[] = []

    if (level === 'beginner') {
        for (let i = 0; i < commitment; i++) mix.push('Easy')
    } else if (level === 'intermediate') {
        for (let i = 0; i < commitment; i++) {
            mix.push(i === 0 ? 'Easy' : 'Medium')
        }
    } else if (level === 'advanced') {
        for (let i = 0; i < commitment; i++) {
            if (i === 0) mix.push('Easy')
            else if (i === 1) mix.push('Medium')
            else mix.push('Hard')
        }
    }

    return mix
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
        return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]

    // 1. Check if suggestions already generated for today
    const { data: existing } = await supabaseAdmin
        .from('daily_suggestions')
        .select('*')
        .eq('user_id', user_id)
        .eq('suggested_date', today)

    if (existing && existing.length > 0) {
        return NextResponse.json({ suggestions: existing, already_generated: true })
    }

    // 2. Get user settings
    const { data: settings } = await supabaseAdmin
        .from('user_settings')
        .select('*')
        .eq('id', user_id)
        .single()

    const commitment = settings?.daily_commitment || 3
    const level = settings?.current_level || 'beginner'

    // 3. Rollover unsolved from yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: unsolved } = await supabaseAdmin
        .from('daily_suggestions')
        .select('*')
        .eq('user_id', user_id)
        .eq('suggested_date', yesterdayStr)
        .eq('status', 'pending')

    const rolledOver = unsolved || []

    // Update rolled over status and apply neglect penalty
    for (const problem of rolledOver) {
        // Apply 2% stability penalty for neglecting a suggestion
        const { data: score } = await supabaseAdmin
            .from('problem_scores')
            .select('stability')
            .eq('user_id', user_id)
            .eq('problem_id', problem.problem_id)
            .single()

        if (score) {
            const newStability = Math.max(1.0, score.stability * 0.98)
            await supabaseAdmin
                .from('problem_scores')
                .update({ stability: newStability })
                .eq('user_id', user_id)
                .eq('problem_id', problem.problem_id)
        }

        await supabaseAdmin
            .from('daily_suggestions')
            .update({ status: 'rolled_over', suggested_date: today })
            .eq('id', problem.id)
    }

    // 4. How many new slots remain
    const slotsRemaining = Math.max(0, commitment - rolledOver.length)

    // 5. Get all already suggested problem ids to avoid repeats
    const { data: allSuggested } = await supabaseAdmin
        .from('daily_suggestions')
        .select('problem_id')
        .eq('user_id', user_id)

    const excludeIds = allSuggested?.map(s => s.problem_id) || []

    // 6. Get problems due for review first
    const { data: reviewsDue } = await supabaseAdmin
        .from('problem_scores')
        .select('*')
        .eq('user_id', user_id)
        .lte('next_review_date', today)
        .order('next_review_date', { ascending: true })
        .limit(slotsRemaining)

    const reviews = reviewsDue || []

    // Insert review problems
    for (const review of reviews) {
        await supabaseAdmin
            .from('daily_suggestions')
            .insert({
                user_id,
                problem_id: review.problem_id,
                problem_title: review.problem_title,
                difficulty: 'Medium',
                status: 'pending',
                suggested_date: today,
                is_review: true
            })
    }

    // 7. Fill remaining with new problems from our problems table
    const newSlotsNeeded = Math.max(0, slotsRemaining - reviews.length)
    const difficultyMix = getDifficultyMix(level, newSlotsNeeded)

    for (let i = 0; i < newSlotsNeeded; i++) {
        const difficulty = difficultyMix[i]

        // Get random problem of required difficulty not already suggested
        const { data: candidates } = await supabaseAdmin
            .from('problems')
            .select('*')
            .eq('difficulty', difficulty)
            .not('title_slug', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`)
            .limit(50)

        if (!candidates || candidates.length === 0) continue

        // Pick random from candidates
        const problem = candidates[Math.floor(Math.random() * candidates.length)]

        await supabaseAdmin
            .from('daily_suggestions')
            .insert({
                user_id,
                problem_id: problem.title_slug,
                problem_title: problem.title,
                difficulty: problem.difficulty,
                status: 'pending',
                suggested_date: today,
                is_review: false
            })

        excludeIds.push(problem.title_slug)
    }

    // 8. Return today's full list
    const { data: todaysSuggestions } = await supabaseAdmin
        .from('daily_suggestions')
        .select('*')
        .eq('user_id', user_id)
        .eq('suggested_date', today)

    return NextResponse.json({
        suggestions: todaysSuggestions || [],
        already_generated: false
    })
}