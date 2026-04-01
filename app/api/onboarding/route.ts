import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { user_id, daily_commitment, self_assessed_level, leetcode_username, notification_time } = body

    if (!user_id || !daily_commitment || !self_assessed_level) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Save user settings
    const { error } = await supabaseAdmin
        .from('user_settings')
        .upsert({
            id: user_id,
            daily_commitment,
            self_assessed_level,
            current_level: self_assessed_level,
            leetcode_username: leetcode_username || null,
            notification_time: notification_time || '20:00',
            onboarding_complete: true
        })

    if (error) {
        console.log('Onboarding error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If LeetCode username provided → fetch solved problems
    let solvedProblems: string[] = []
    if (leetcode_username) {
        try {
            const res = await fetch(
                `https://alfa-leetcode-api.onrender.com/${leetcode_username}/solved`
            )
            const data = await res.json()
            solvedProblems = data?.solvedProblem?.map((p: any) => p.titleSlug) || []
        } catch (err) {
            console.log('LeetCode fetch failed:', err)
            // Don't fail onboarding if LeetCode fetch fails
        }
    }

    return NextResponse.json({
        success: true,
        solved_count: solvedProblems.length
    })
}