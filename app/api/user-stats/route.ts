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

    // Fetch last 365 days of activity
    const oneYearAgo = new Date()
    oneYearAgo.setDate(oneYearAgo.getDate() - 365)
    const startDate = oneYearAgo.toISOString().split('T')[0]

    const { data: activity, error } = await supabaseAdmin
        .from('daily_activity_summary')
        .select('*')
        .eq('user_id', user_id)
        .gte('date', startDate)
        .order('date', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get current streak from the latest entry
    const latest = activity?.[activity.length - 1]
    let currentStreak = 0
    
    if (latest) {
        const todayStr = new Date().toISOString().split('T')[0]
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        if (latest.date === todayStr) {
            currentStreak = latest.streak
        } else if (latest.date === yesterdayStr) {
            // Note: If they haven't solved anything today, the streak from yesterday is still valid
            // for display purposes, but today's entry hasn't been created yet.
            currentStreak = latest.streak
        }
    }

    // Process activity into statuses for the heatmap
    const processedActivity = activity?.map(day => {
        let status = 'none'
        if (day.reviews_due > 0) {
            if (day.reviews_solved >= day.reviews_due) {
                status = 'green'
            } else if (day.reviews_solved > 0) {
                status = 'orange'
            }
        } else if (day.new_solved > 0) {
            status = 'green'
        }

        return {
            date: day.date,
            status,
            reviews_due: day.reviews_due,
            reviews_solved: day.reviews_solved,
            new_solved: day.new_solved
        }
    })

    return NextResponse.json({
        streak: currentStreak,
        activity: processedActivity || []
    })
}
