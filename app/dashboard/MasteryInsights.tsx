'use client'
import { useState, useEffect } from 'react'
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts'
import { Flame, Brain, Target, TrendingUp, AlertTriangle } from 'lucide-react'

interface TopicStat {
    topic: string
    avg_retrievability: number
    avg_stability: number
    problem_count: number
    difficulties: Record<string, number>
}

export default function MasteryInsights({ userId }: { userId: string }) {
    const [stats, setStats] = useState<TopicStat[]>([])
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const fetchStats = async () => {
            const res = await fetch(`/api/topic-mastery?user_id=${userId}`)
            const data = await res.json()
            setStats(data.topics || [])
            setLoading(false)
        }
        fetchStats()
    }, [userId])

    if (loading) return (
        <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
    )

    if (stats.length === 0) return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <h3 className="text-lg font-bold text-white mb-2">No topic data yet</h3>
            <p className="text-gray-400 text-sm">Solve a few problems on LeetCode to see your mastery profile.</p>
        </div>
    )

    // Data for Radar Chart (Top 6 topics)
    const radarData = [...stats]
        .sort((a, b) => b.problem_count - a.problem_count)
        .slice(0, 6)
        .map(s => ({
            subject: s.topic,
            A: s.avg_retrievability,
            fullMark: 100,
        }))

    const weakestTopics = [...stats]
        .sort((a, b) => a.avg_retrievability - b.avg_retrievability)
        .slice(0, 4)

    return (
        <div className="space-y-8 pb-12">
            
            {/* Top Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Radar Profile */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Brain className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-bold">Concept Profile</h2>
                    </div>
                    <div className="h-64 w-full">
                        {mounted && (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#333" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#999', fontSize: 10 }} />
                                    <Radar
                                        name="Mastery"
                                        dataKey="A"
                                        stroke="#3b82f6"
                                        fill="#3b82f6"
                                        fillOpacity={0.4}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Weakness Analysis */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <h2 className="text-lg font-bold">Critical Weaknesses</h2>
                    </div>
                    <div className="space-y-4">
                        {weakestTopics.map(topic => (
                            <div key={topic.topic} className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <div className="text-sm font-semibold text-white group-hover:text-orange-400 transition">{topic.topic}</div>
                                        <div className="text-[10px] text-gray-500">{topic.problem_count} problems tracked</div>
                                    </div>
                                    <div className={`text-sm font-bold ${topic.avg_retrievability < 50 ? 'text-red-500' : 'text-orange-500'}`}>
                                        {topic.avg_retrievability}% Recall
                                    </div>
                                </div>
                                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${
                                            topic.avg_retrievability < 50 ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-orange-500'
                                        }`}
                                        style={{ width: `${topic.avg_retrievability}%` }}
                                    />
                                </div>
                                {topic.avg_retrievability < 40 && (
                                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-400 animate-pulse">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>High priority: solve a problem in this topic today.</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Mastery Table */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-green-400" />
                        <h2 className="text-lg font-bold">Topic Breakdown</h2>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs text-gray-500 border-b border-gray-800">
                                <th className="px-6 py-4 font-medium uppercase tracking-wider">Topic</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider">Mastery</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider">Stability</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider">Distribution</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {[...stats].sort((a, b) => b.problem_count - a.problem_count).map(topic => (
                                <tr key={topic.topic} className="hover:bg-gray-800/20 transition group">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-white group-hover:text-blue-400 transition">{topic.topic}</div>
                                        <div className="text-[10px] text-gray-500">{topic.problem_count} solved</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-gray-800 h-1.5 rounded-full">
                                                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${topic.avg_retrievability}%` }} />
                                            </div>
                                            <span className="text-sm font-mono">{topic.avg_retrievability}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">
                                        {topic.avg_stability}d
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            {Array.from({ length: topic.difficulties.Easy || 0 }).map((_, i) => <div key={i} className="w-1 h-3 bg-green-500/30 rounded-sm" />)}
                                            {Array.from({ length: topic.difficulties.Medium || 0 }).map((_, i) => <div key={i} className="w-1 h-3 bg-yellow-500/30 rounded-sm" />)}
                                            {Array.from({ length: topic.difficulties.Hard || 0 }).map((_, i) => <div key={i} className="w-1 h-3 bg-red-500/30 rounded-sm" />)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
