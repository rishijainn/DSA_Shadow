import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const user_id = searchParams.get('user_id')
        const limitParam = searchParams.get('limit')
        const limit = limitParam ? Math.min(parseInt(limitParam), 500) : 200

        if (!user_id) {
            return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
        }

        const { data: submissions, error } = await supabaseAdmin
            .from('submissions')
            .select('*')
            .eq('user_id', user_id)
            .order('timestamp', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({
                error: error.message,
                hint: error.hint,
                details: error.details
            }, { status: 500 })
        }

        return NextResponse.json({ submissions: submissions || [] })
    } catch (err: any) {
        console.error('Runtime Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
