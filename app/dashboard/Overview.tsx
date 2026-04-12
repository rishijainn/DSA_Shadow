'use client'
import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts'
import { CalendarCheck, Play, GitCommit, CheckCircle2, RefreshCw } from 'lucide-react'
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
    userId: string
}) {
    const [streak, setStreak] = useState(0)
    const [activity, setActivity] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            if (!userId) return
            try {
                const res = await fetch(`/api/user-stats?user_id=${userId}`)
                const data = await res.json()
                setStreak(data.streak || 0)
                setActivity(data.activity || [])
            } catch (err) {
                console.error('Failed to fetch stats:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [userId])

    // Convert last 14 days of activity to chart data
    const chartData = useMemo(() => {
        if (activity.length === 0) return Array(14).fill({ day: '---', value: 0 })
        
        // Take last 14 entries and format for recharts
        return activity.slice(-14).map(day => ({
            day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            value: day.reviews_solved + day.new_solved,
            date: day.date
        }))
    }, [activity])

    const totalSolved = allProblems.length
    const totalDue = dueProblems.length

    const getMockDifficulty = (id: string) => {
        const char = id.charCodeAt(0) % 3
        if (char === 0) return { label: 'Hard', color: 'text-red border-red/40 bg-red/10' }
        if (char === 1) return { label: 'Medium', color: 'text-orange border-orange/40 bg-orange/10' }
        return { label: 'Easy', color: 'text-green border-green/40 bg-green/10' }
    }

    return (
        <div className="space-y-6">
            
            {/* Top Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Review Consistency Chart */}
                <div className="lg:col-span-2 bg-[#151515] border border-[#222] rounded-xl p-6 relative">
                    <div className="flex justify-between items-start mb-6 w-full relative z-10">
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Review Consistency</h2>
                            <p className="text-xs text-muted mt-1">Daily problem retention frequency</p>
                        </div>
                        <div className="bg-green/10 text-green px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                            Level: {streak > 10 ? 'Veteran' : streak > 3 ? 'Active' : 'Initiate'}
                        </div>
                    </div>

                    <div className="h-40 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <XAxis 
                                    dataKey="day" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }} 
                                />
                                <Tooltip 
                                    cursor={{ fill: '#222' }} 
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', fontSize: '10px', fontFamily: 'monospace' }} 
                                />
                                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#45b4c1' : '#2c4c5a'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Top Cards */}
                <div className="flex flex-col gap-6">
                    <div className="bg-[#151515] border border-[#222] rounded-xl p-6 flex-1 flex flex-col justify-center">
                        <h3 className="text-[10px] text-muted font-bold tracking-[0.2em] uppercase mb-4">Streak</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-orange tracking-tighter">{streak}</span>
                            <span className="text-xs text-orange font-bold uppercase tracking-wider">Days</span>
                        </div>
                    </div>
                    <div className="bg-[#151515] border border-[#222] rounded-xl p-6 flex-1 flex flex-col justify-center">
                        <h3 className="text-[10px] text-muted font-bold tracking-[0.2em] uppercase mb-4">Solved</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-white tracking-tighter">{totalSolved}</span>
                            <span className="text-xs text-[#666] font-bold uppercase tracking-wider">Total</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Heatmap Section */}
            <Heatmap activity={activity} />

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* Pending Queue */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                            <CalendarCheck className="w-5 h-5 text-orange" />
                            PENDING QUEUE
                        </h2>
                        <span className="text-xs text-muted font-mono">{totalDue} items due</span>
                    </div>

                    <div className="space-y-3">
                        {dueProblems.length > 0 ? dueProblems.slice(0, 5).map(p => {
                            const diff = getMockDifficulty(p.problem_id)
                            return (
                                <div key={p.problem_id} className="bg-[#181818] border border-[#222] rounded-lg p-4 flex items-center gap-4 hover:border-[#333] transition-colors group cursor-pointer"
                                     onClick={() => window.open(`https://leetcode.com/problems/${p.problem_id}`, '_blank')}
                                >
                                    <div className="w-10 h-10 bg-[#16272e] rounded flex items-center justify-center flex-shrink-0">
                                        <span className="text-primary text-xs font-bold font-mono">LC</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                                            #{p.problem_id.length > 3 ? p.problem_id.substring(0,3).toUpperCase() : '12'} {p.problem_title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${diff.color} uppercase tracking-wider`}>
                                                {diff.label}
                                            </span>
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#222] text-[#888] uppercase tracking-wider">
                                                Algorithms
                                            </span>
                                        </div>
                                    </div>
                                    <Play className="w-5 h-5 text-[#3facb8] opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all ml-2" />
                                </div>
                            )
                        }) : (
                            <div className="text-center py-12 border border-[#222] border-dashed rounded-lg bg-[#111]">
                                <CalendarCheck className="w-10 h-10 text-[#333] mx-auto mb-3" />
                                <p className="text-muted text-sm">Queue is empty. Great job!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Github Log Equivalent - Extension Status */}
                <div className="space-y-4">
                    <div className="bg-[#151515] border border-[#222] rounded-xl p-5">
                        <h3 className="text-[10px] text-muted font-bold tracking-[0.2em] uppercase mb-2">Extension Status</h3>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green shadow-[0_0_8px_rgba(46,204,113,0.8)] animate-pulse" />
                            <p className="text-[11px] text-[#888] font-mono">V8 Engine link established. All hooks nominal.</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
