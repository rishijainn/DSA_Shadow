'use client'
import { useState } from 'react'
import { Search, Filter, Plus } from 'lucide-react'

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

export default function ProblemExplorer({ userId, allProblems }: { userId: string, allProblems: ProblemScore[] }) {
    const [query, setQuery] = useState('')

    // Derived statistics from the spaced-repetition queue
    const totalTracked = allProblems.length
    const dueToday = allProblems.filter(p => p.is_due).length
    const graduated = allProblems.filter(p => p.stability > 14).length
    const lapses = allProblems.filter(p => p.hint_rate > 30).length // Heuristic for lapses

    // Filtered list
    const filtered = allProblems.filter(p => p.problem_title.toLowerCase().includes(query.toLowerCase()) || p.problem_id.toLowerCase().includes(query.toLowerCase()))

    // Handlers for mocked data to match UI requirements
    const getMockDifficulty = (id: string) => {
        const char = id.charCodeAt(0) % 3
        if (char === 0) return { label: 'HARD', color: 'text-red border-red/40 bg-red/10' }
        if (char === 1) return { label: 'MEDIUM', color: 'text-orange border-orange/40 bg-orange/10' }
        return { label: 'EASY', color: 'text-green border-green/40 bg-green/10' }
    }

    const getStatus = (p: ProblemScore) => {
        if (p.stability > 14) return { label: 'GRADUATED', color: 'text-green border-green/30' }
        if (p.is_due && p.retrievability < 50) return { label: 'RE-LEARNING', color: 'text-red border-red/30' }
        return { label: 'LEARNING', color: 'text-orange border-orange/30' }
    }

    return (
        <div className="space-y-10 pb-12 font-sans relative">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Problem Library</h2>
                    <p className="text-muted text-sm mt-2 max-w-lg leading-relaxed">
                        Manage your active spaced-repetition queue and track cognitive retention across LeetCode patterns.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search ID or Name..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="bg-[#1a1a1a] border border-[#333] text-sm text-foreground rounded py-2.5 pl-11 pr-4 w-64 focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none placeholder:text-muted"
                        />
                    </div>
                    <button className="bg-[#1a1a1a] border border-[#333] p-2.5 rounded hover:border-[#444] transition-colors text-muted hover:text-white">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Metric Strips */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#151515] border border-[#222] border-l-[3px] border-l-primary p-5 rounded-r">
                    <div className="text-[9px] uppercase tracking-widest text-[#777] font-mono font-bold mb-3">Total Tracked</div>
                    <div className="text-3xl font-bold text-primary font-mono tracking-tight">{totalTracked}</div>
                </div>
                <div className="bg-[#151515] border border-[#222] border-l-[3px] border-l-orange p-5 rounded-r">
                    <div className="text-[9px] uppercase tracking-widest text-[#777] font-mono font-bold mb-3">Due Today</div>
                    <div className="text-3xl font-bold text-orange font-mono tracking-tight">{dueToday}</div>
                </div>
                <div className="bg-[#151515] border border-[#222] border-l-[3px] border-l-green p-5 rounded-r">
                    <div className="text-[9px] uppercase tracking-widest text-[#777] font-mono font-bold mb-3">Graduated</div>
                    <div className="text-3xl font-bold text-green font-mono tracking-tight">{graduated}</div>
                </div>
                <div className="bg-[#151515] border border-[#222] border-l-[3px] border-l-red p-5 rounded-r">
                    <div className="text-[9px] uppercase tracking-widest text-[#777] font-mono font-bold mb-3">Lapses</div>
                    <div className="text-3xl font-bold text-red font-mono tracking-tight">{lapses}</div>
                </div>
            </div>

            {/* Kinetic Data Table */}
            <div className="bg-[#111] border border-[#222] rounded-md overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[#222] bg-[#151515]">
                            <th className="px-6 py-4 text-[10px] font-bold text-[#666] tracking-[0.15em] uppercase w-16">ID</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#666] tracking-[0.15em] uppercase">Problem Name</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#666] tracking-[0.15em] uppercase">Difficulty</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#666] tracking-[0.15em] uppercase">Interval</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#666] tracking-[0.15em] uppercase">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#666] tracking-[0.15em] uppercase text-right">Next Review</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e1e1e]">
                        {filtered.length > 0 ? (
                            filtered.map((p, index) => {
                                const diff = getMockDifficulty(p.problem_id)
                                const status = getStatus(p)
                                
                                // Mock ID based on index since we use title slug as ID typically
                                const mockId = `#${(index + 1) * 7 + 4}` 

                                return (
                                    <tr key={p.problem_id} className="hover:bg-[#151515] transition-colors group">
                                        <td className="px-6 py-5 text-sm text-[#777] font-mono">{mockId}</td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm font-semibold text-[#e2e8f0] group-hover:text-primary transition-colors">{p.problem_title}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-3 h-2 bg-[#222] border-t-2 border-[#555] rounded-t-sm" />
                                                <span className="text-[10px] text-[#666]">{p.problem_id.replace(/-/g, ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`text-[9px] font-bold px-2.5 py-1 rounded border ${diff.color} uppercase tracking-widest`}>
                                                {diff.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-[#ddd] font-mono">{Math.max(1, Math.round(p.stability))} Days</span>
                                                <div className="flex gap-1 opacity-60">
                                                    {[1, 2, 3, 4].map(dot => (
                                                        <div key={dot} className={`w-1 h-1 rounded-full ${dot * 25 <= p.retrievability ? 'bg-primary' : 'bg-[#333]'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`text-[9px] font-bold px-3 py-1 rounded-sm border ${status.color} flex items-center gap-2 w-max`}>
                                                <div className={`w-1.5 h-1.5 rounded-full bg-current`} />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {p.is_due ? (
                                                <>
                                                    <div className="text-sm font-mono text-orange">{p.retrievability < 50 ? 'Overdue' : 'Today'}</div>
                                                    <div className="text-[10px] text-[#666] italic mt-1">in {p.retrievability < 50 ? '2 days ago' : '4 hours'}</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="text-sm font-mono text-[#ddd]">
                                                        {new Date(p.next_review_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    <div className="text-[10px] text-[#666] italic mt-1">
                                                        in {Math.max(1, Math.round(p.stability))} days
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-[#666] italic">No active problems tracked in the spaced repetition queue yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Line */}
            <div className="flex items-center justify-between mt-6 text-[#777] text-xs">
                <span>Showing {Math.min(1, filtered.length)} to {Math.min(5, filtered.length)} of {filtered.length} entries</span>
                <div className="flex gap-1.5 font-mono">
                    <button className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] rounded hover:bg-[#222] transition-colors border border-[#333]">&lt;</button>
                    <button className="w-8 h-8 flex items-center justify-center bg-[#151515] text-primary border border-primary rounded">1</button>
                    <button className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] rounded hover:bg-[#222] transition-colors border border-[#333]">2</button>
                    <button className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] rounded hover:bg-[#222] transition-colors border border-[#333]">3</button>
                    <button className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] rounded hover:bg-[#222] transition-colors border border-[#333]">&gt;</button>
                </div>
            </div>

            {/* Floating Action Button */}
            <button className="fixed bottom-16 right-10 w-14 h-14 bg-orange text-[#1a1a1a] rounded flex items-center justify-center shadow-[0_0_20px_rgba(255,153,0,0.5)] hover:scale-105 hover:bg-white transition-all z-50 group">
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            </button>
        </div>
    )
}
