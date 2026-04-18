'use client'
import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts'
import { CalendarCheck, Play, RefreshCw, FastForward, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Heatmap from './Heatmap'

interface ProblemScore {
    problem_id: string
    problem_title: string
    stability: number
    retrievability: number
    next_review_date: string
    total_solved: number
    hint_rate: number
    is_due: boolean
}

export default function Overview({
    dueProblems,
    allProblems,
    userId
}: {
    dueProblems: ProblemScore[],
    allProblems: ProblemScore[],
    userId: string | undefined
}) {
    const [streak, setStreak] = useState(0)
    const [activity, setActivity] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [skippingId, setSkippingId] = useState<string | null>(null)
    const router = useRouter()

    const fetchStats = async () => {
        if (!userId) return
        setLoading(true)
        try {
            const d = new Date()
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
            const clientDate = d.toISOString().split('T')[0]

            const res = await fetch(`/api/user-stats?user_id=${userId}&client_date=${clientDate}`, { cache: 'no-store' })
            const data = await res.json()
            setStreak(data.streak || 0)
            setActivity(data.activity || [])
        } catch (err) {
            console.error('Failed to fetch stats:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [userId])

    // Convert last 14 days of activity to chart data
    const chartData = useMemo(() => {
        if (activity.length === 0) return Array(14).fill(null).map((_, i) => ({ day: '---', value: 0 }))
        return activity.slice(-14).map(day => ({
            day: new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            value: day.reviews_solved + day.new_solved,
            date: day.date
        }))
    }, [activity])

    const totalSolved = allProblems.length
    const totalDue = dueProblems.length

    const getMockDifficulty = (id: string) => {
        const char = id.charCodeAt(0) % 3
        if (char === 0) return { label: 'Hard', color: 'text-red-400 border-red-500/40 bg-red-500/10' }
        if (char === 1) return { label: 'Medium', color: 'text-orange-400 border-orange-400/40 bg-orange-400/10' }
        return { label: 'Easy', color: 'text-green-400 border-green-500/40 bg-green-500/10' }
    }

    const handleSkip = async (e: React.MouseEvent, problemId: string) => {
        e.stopPropagation()
        if (!userId) return
        
        setSkippingId(problemId)
        try {
            await fetch('/api/skip-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, problem_id: problemId })
            })
            // Quick reload to sync all components including parent state
            window.location.reload()
        } catch (err) {
            console.error('Failed to skip:', err)
            setSkippingId(null)
        }
    }

    return (
        <div className="space-y-6">

            {/* Top Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Review Consistency Chart */}
                <div className="lg:col-span-2 bg-[#111] border border-[#1e1e1e] rounded-xl p-6 relative overflow-hidden">
                    {/* subtle glow */}
                    <div className="absolute top-0 left-0 w-48 h-48 rounded-full bg-[#2fe0eb]/3 blur-3xl pointer-events-none" />

                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Review Consistency</h2>
                            <p className="text-xs text-[#555] mt-1">Daily problem retention frequency</p>
                        </div>
                        <div className="flex gap-3 items-center">
                            <button
                                onClick={fetchStats}
                                disabled={loading}
                                className={`text-[#444] hover:text-[#2fe0eb] transition-colors ${loading ? 'opacity-40 cursor-not-allowed' : ''}`}
                                title="Sync Data"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                                streak > 10
                                    ? 'bg-[#2fe0eb]/10 text-[#2fe0eb] border-[#2fe0eb]/20'
                                    : streak > 3
                                    ? 'bg-orange-400/10 text-orange-400 border-orange-400/20'
                                    : 'bg-[#1a1a1a] text-[#555] border-[#2a2a2a]'
                            }`}>
                                {streak > 10 ? '🔥 Veteran' : streak > 3 ? '⚡ Active' : '🌱 Initiate'}
                            </div>
                        </div>
                    </div>

                    <div className="h-40 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#444', fontSize: 9, fontFamily: 'monospace' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(47,224,235,0.04)' }}
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#2a2a2a', fontSize: '10px', fontFamily: 'monospace', borderRadius: '8px' }}
                                    labelStyle={{ color: '#2fe0eb' }}
                                />
                                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index === chartData.length - 1 ? '#2fe0eb' : entry.value > 0 ? '#1a4a55' : '#1a1a1a'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Top Cards */}
                <div className="flex flex-col gap-4">
                    {/* Streak Card */}
                    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 flex-1 flex flex-col justify-center relative overflow-hidden group hover:border-orange-500/20 transition-colors">
                        <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-orange-500/5 blur-xl pointer-events-none group-hover:bg-orange-500/10 transition-colors" />
                        <h3 className="text-[9px] text-[#444] font-bold tracking-[0.25em] uppercase mb-3">Current Streak</h3>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-4xl font-bold tracking-tighter ${streak > 0 ? 'text-orange-400' : 'text-[#333]'}`}>{streak}</span>
                            <span className="text-xs text-orange-400/70 font-bold uppercase tracking-wider">Days</span>
                        </div>
                        {streak === 0 && <p className="text-[10px] text-[#333] mt-2 font-mono">// solve a problem to start</p>}
                    </div>

                    {/* Solved Card */}
                    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 flex-1 flex flex-col justify-center relative overflow-hidden group hover:border-[#2fe0eb]/20 transition-colors">
                        <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-[#2fe0eb]/5 blur-xl pointer-events-none group-hover:bg-[#2fe0eb]/10 transition-colors" />
                        <h3 className="text-[9px] text-[#444] font-bold tracking-[0.25em] uppercase mb-3">Problems Tracked</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-white tracking-tighter">{totalSolved}</span>
                            <span className="text-xs text-[#444] font-bold uppercase tracking-wider">Total</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Heatmap Section */}
            <Heatmap activity={activity} />

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Pending Queue */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                            <CalendarCheck className="w-4 h-4 text-orange-400" />
                            PENDING QUEUE
                        </h2>
                        <span className="text-[10px] text-[#444] font-mono">{totalDue} items due</span>
                    </div>

                    <div className="space-y-2.5">
                        {dueProblems.length > 0 ? dueProblems.slice(0, 6).map(p => {
                            const diff = getMockDifficulty(p.problem_id)
                            return (
                                <div
                                    key={p.problem_id}
                                    className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-lg p-4 flex items-center gap-4 hover:border-[#2fe0eb]/20 transition-all group cursor-pointer relative"
                                    onClick={() => window.open(`https://leetcode.com/problems/${p.problem_id}`, '_blank')}
                                >
                                    <div className="w-9 h-9 bg-[#151515] border border-[#2a2a2a] rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-[#2fe0eb] text-[9px] font-bold font-mono">LC</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xs font-bold text-white truncate group-hover:text-[#2fe0eb] transition-colors">
                                            {p.problem_title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${diff.color} uppercase tracking-wider`}>
                                                {diff.label}
                                            </span>
                                            <span className="text-[9px] text-[#333] font-mono">
                                                {Math.round(p.retrievability)}% retention
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="relative group/skip">
                                            <button 
                                                onClick={(e) => handleSkip(e, p.problem_id)}
                                                disabled={skippingId === p.problem_id}
                                                className="p-1.5 rounded-md hover:bg-red-500/10 group-hover:opacity-100 opacity-0 transition-all text-[#555] hover:text-red-400 disabled:opacity-50"
                                            >
                                                {skippingId === p.problem_id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <FastForward className="w-4 h-4" />
                                                )}
                                            </button>
                                            <div className="absolute right-1/2 translate-x-1/2 bottom-full mb-1 px-3 py-2 w-48 bg-[#1a0f0f] text-red-400 text-[10px] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.5)] opacity-0 pointer-events-none group-hover/skip:opacity-100 transition-opacity border border-red-900/40 z-50 text-center flex flex-col gap-1">
                                                <span className="font-bold uppercase tracking-wider text-red-400">Skip Review</span>
                                                <span className="text-[#999] font-normal leading-relaxed text-[9px]">Postpones this question to tomorrow, but <span className="text-red-400">reduces the overall strength</span> of this topic.</span>
                                            </div>
                                        </div>
                                        <Play className="w-4 h-4 text-[#2fe0eb]/50 opacity-0 group-hover:opacity-100 group-hover:text-[#2fe0eb] transition-all ml-1 flex-shrink-0" />
                                    </div>
                                </div>
                            )
                        }) : (
                            <div className="text-center py-14 border border-[#1a1a1a] border-dashed rounded-xl bg-[#0a0a0a]">
                                <CalendarCheck className="w-8 h-8 text-[#1e1e1e] mx-auto mb-3" />
                                <p className="text-[#333] text-sm font-medium">Queue is empty</p>
                                <p className="text-[10px] text-[#222] mt-1 font-mono">// great job! come back tomorrow</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Extension Status + Quick Stats */}
                <div className="space-y-4">
                    <div className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl p-5">
                        <h3 className="text-[9px] text-[#444] font-bold tracking-[0.25em] uppercase mb-3">Extension Status</h3>
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-[#2ecc71] shadow-[0_0_8px_rgba(46,204,113,0.8)] animate-pulse flex-shrink-0" />
                            <p className="text-[11px] text-[#666] font-mono">V8 Engine link established. All hooks nominal.</p>
                        </div>
                    </div>

                    {/* Mini stats */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Due Today', value: totalDue, accent: '#ff9900' },
                            { label: 'Graduated', value: allProblems.filter(p => p.stability > 14).length, accent: '#2ecc71' },
                            { label: 'Avg Retention', value: allProblems.length > 0 ? `${Math.round(allProblems.reduce((a, p) => a + p.retrievability, 0) / allProblems.length)}%` : '—', accent: '#2fe0eb' },
                            { label: 'Avg Stability', value: allProblems.length > 0 ? `${Math.round(allProblems.reduce((a, p) => a + p.stability, 0) / allProblems.length)}d` : '—', accent: '#818cf8' },
                        ].map(({ label, value, accent }) => (
                            <div key={label} className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-lg p-4">
                                <div className="text-[9px] text-[#444] font-mono uppercase tracking-wider mb-2">{label}</div>
                                <div className="text-xl font-bold font-mono tracking-tight" style={{ color: accent }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    )
}
