'use client'
import { useState, useEffect } from 'react'
import { History, Search, ExternalLink, Calendar, Brain, Award, Filter } from 'lucide-react'

interface Submission {
    id: string
    problem_id: string
    problem_title: string
    hint_used: boolean
    difficulty_feel: string
    timestamp: string
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
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                        <History className="w-6 h-6 text-primary" />
                        Solving History
                    </h2>
                    <p className="text-muted text-sm mt-1">
                        A chronological record of every challenge you've conquered.
                    </p>
                </div>

                <div className="relative group overflow-hidden rounded-2xl">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted group-focus-within:text-primary transition" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search your vault..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full md:w-80 pl-11 pr-4 py-3 bg-surface border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none text-sm text-foreground shadow-sm"
                    />
                </div>
            </div>

            {/* Stats Summary Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Solved', value: submissions.length, icon: Award, color: 'text-yellow-400' },
                    { label: 'Clean Solves', value: submissions.filter(s => !s.hint_used).length, icon: Brain, color: 'text-green-400' },
                    { label: 'Hard Challenges', value: submissions.filter(s => s.difficulty_feel === 'Hard').length, icon: Filter, color: 'text-red-400' },
                    { label: 'This Month', value: submissions.filter(s => new Date(s.timestamp).getMonth() === new Date().getMonth()).length, icon: Calendar, color: 'text-blue-400' }
                ].map((stat, i) => (
                    <div key={i} className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <stat.icon className={`w-3 h-3 ${stat.color}`} />
                            <span className="text-[10px] uppercase font-bold text-muted tracking-wider">{stat.label}</span>
                        </div>
                        <div className="text-xl font-bold text-foreground">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* History List */}
            <div className="space-y-3">
                {filtered.length > 0 ? (
                    filtered.map((sub) => (
                        <div key={sub.id} className="group bg-surface backdrop-blur-sm border border-border rounded-2xl p-5 flex items-center justify-between hover:border-primary/50 hover:shadow-card transition-all shadow-sm">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[10px] font-mono text-muted bg-border px-2 py-0.5 rounded uppercase tracking-tighter">
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
                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition">
                                    {sub.problem_title && sub.problem_title !== '0' 
                                        ? sub.problem_title 
                                        : sub.problem_id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </h3>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1.5 text-xs text-muted">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(sub.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted">
                                        <History className="w-3 h-3" />
                                        {new Date(sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                            <a 
                                href={`https://leetcode.com/problems/${sub.problem_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 bg-border rounded-xl text-muted hover:text-white hover:bg-primary transition-all shadow-sm"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </a>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-surface border border-dashed border-border rounded-3xl">
                        <History className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-foreground">No matching submissions found</h3>
                        <p className="text-muted text-sm mt-1">Try a different search term or keep solving!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
