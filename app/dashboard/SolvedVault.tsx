'use client'
import { useState, useEffect } from 'react'
import { History, Search, ExternalLink, Calendar, Brain, Award, Filter } from 'lucide-react'

interface Submission {
    id: string
    problem_id: string
    problem_title: string
    hint_used: boolean
    difficulty_feel: string
    created_at: string
}

export default function SolvedVault({ userId }: { userId: string }) {
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchHistory = async () => {
            const res = await fetch(`/api/submissions?user_id=${userId}`)
            const data = await res.json()
            setSubmissions(data.submissions || [])
            setLoading(false)
        }
        fetchHistory()
    }, [userId])

    const filtered = submissions.filter(s => 
        s.problem_title.toLowerCase().includes(search.toLowerCase()) ||
        s.problem_id.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return (
        <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
    )

    return (
        <div className="space-y-6 pb-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <History className="w-6 h-6 text-blue-400" />
                        Solving History
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        A chronological record of every challenge you've conquered.
                    </p>
                </div>

                <div className="relative group overflow-hidden rounded-2xl">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search your vault..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full md:w-80 pl-11 pr-4 py-3 bg-gray-900/50 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none text-sm"
                    />
                </div>
            </div>

            {/* Stats Summary Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Solved', value: submissions.length, icon: Award, color: 'text-yellow-400' },
                    { label: 'Clean Solves', value: submissions.filter(s => !s.hint_used).length, icon: Brain, color: 'text-green-400' },
                    { label: 'Hard Challenges', value: submissions.filter(s => s.difficulty_feel === 'Hard').length, icon: Filter, color: 'text-red-400' },
                    { label: 'This Month', value: submissions.filter(s => new Date(s.created_at).getMonth() === new Date().getMonth()).length, icon: Calendar, color: 'text-blue-400' }
                ].map((stat, i) => (
                    <div key={i} className="bg-gray-900/30 border border-gray-800/50 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <stat.icon className={`w-3 h-3 ${stat.color}`} />
                            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{stat.label}</span>
                        </div>
                        <div className="text-xl font-bold">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* History List */}
            <div className="space-y-3">
                {filtered.length > 0 ? (
                    filtered.map((sub) => (
                        <div key={sub.id} className="group bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-5 flex items-center justify-between hover:border-blue-500/30 hover:bg-gray-900/60 transition-all">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[10px] font-mono text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded uppercase tracking-tighter">
                                        {sub.problem_id}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        sub.difficulty_feel === 'Easy' ? 'bg-green-500/10 text-green-400' :
                                        sub.difficulty_feel === 'Medium' ? 'bg-blue-500/10 text-blue-400' :
                                        sub.difficulty_feel === 'Hard' ? 'bg-red-500/10 text-red-400' :
                                        'bg-orange-500/10 text-orange-400'
                                    }`}>
                                        {sub.difficulty_feel}
                                    </span>
                                    {sub.hint_used && (
                                        <span className="text-[10px] font-bold bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full">AI Assisted</span>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">{sub.problem_title}</h3>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(sub.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <History className="w-3 h-3" />
                                        {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                            <a 
                                href={`https://leetcode.com/problems/${sub.problem_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 bg-gray-800 rounded-xl text-gray-400 hover:text-white hover:bg-blue-600 transition-all"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </a>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-gray-900/20 border border-dashed border-gray-800 rounded-3xl">
                        <History className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-400">No matching submissions found</h3>
                        <p className="text-gray-600 text-sm mt-1">Try a different search term or keep solving!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
