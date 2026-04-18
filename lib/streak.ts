import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function calculateTrueStreak(userId: string, targetDateStr: string): Promise<number> {
    // targetDateStr in YYYY-MM-DD
    
    // 1. Get all daily activity ascending
    const { data: activity } = await supabaseAdmin
        .from('daily_activity_summary')
        .select('*')
        .eq('user_id', userId)
        .lte('date', targetDateStr)
        .order('date', { ascending: true })

    if (!activity || activity.length === 0) return 0

    // 2. Get user setting limit
    const { data: settings } = await supabaseAdmin
        .from('user_settings')
        .select('daily_commitment')
        .eq('id', userId)
        .single()
    const commitment = settings?.daily_commitment || 3

    let streak = 0
    let lastActiveDate = new Date(activity[0].date)
    lastActiveDate.setDate(lastActiveDate.getDate() - 1) // start 1 day before first activity
    
    // Convert array to map for fast lookup
    const actMap = new Map()
    activity.forEach(a => actMap.set(a.date, a))

    // Walk forward from the first activity day to the target date
    const start = new Date(activity[0].date)
    const end = new Date(targetDateStr)
    
    const { data: allScores } = await supabaseAdmin
        .from('problem_scores')
        .select('next_review_date')
        .eq('user_id', userId)

    const scores = allScores || []

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        const act = actMap.get(dateStr)

        if (act) {
            // Day has activity recorded
            let isGreen = false
            if (act.reviews_due > 0) {
                if (act.reviews_solved >= act.reviews_due || act.reviews_solved >= commitment) {
                    isGreen = true
                }
            } else if (act.new_solved > 0) {
                isGreen = true
            }

            if (isGreen) {
                streak++
            } else {
                // Orange day -> Streak usually carries but what if they just solved 1?
                // Anki maintains streak if you do 1 card? Usually you need to clear your quota.
                // Right now, logic says if they solve something but not all, it's orange. Does it break streak?
                // Let's break streak if it's not green. Wait!
                // Original logic: "isNowGreen ? baseStreak + 1 : 0". So streak ONLY increments if Green!
                // Wait! Original logic resets streak to 0 if it's not green. Let's keep that.
                streak = 0
            }
        } else {
            // No activity this day. 
            // Was anything due?
            // A problem was due on dateStr if its next_review_date <= dateStr.
            // Since they didn't do it, the next_review_date is unchanged today.
            let hadDue = false
            for (const s of scores) {
                if (s.next_review_date <= dateStr) {
                    hadDue = true
                    break
                }
            }

            if (hadDue) {
                // They missed their reviews. Break the streak.
                streak = 0
            } else {
                // They had literally 0 reviews due! It's a "free" day. Streak carries perfectly.
            }
        }
    }

    return streak
}
