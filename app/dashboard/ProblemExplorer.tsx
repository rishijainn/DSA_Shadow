'use client'
import { useState } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

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

const ITEMS_PER_PAGE = 10

export default function ProblemExplorer({ userId, allProblems }: { userId: string | undefined, allProblems: ProblemScore[] }) {
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)

    // Derived statistics from the spaced-repetition queue
    const totalTracked = allProblems.length
    const dueToday = allProblems.filter(p => p.is_due).length
    const graduated = allProblems.filter(p => p.stability > 14).length
    const lapses = allProblems.filter(p => p.hint_rate > 30).length

    // Filtered list
    const filtered = allProblems.filter(p =>
        p.problem_title.toLowerCase().includes(query.toLowerCase()) ||
        p.problem_id.toLowerCase().includes(query.toLowerCase())
    )

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
    const safePage = Math.min(page, totalPages)
    const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

    const handleQueryChange = (val: string) => {
        setQuery(val)
        setPage(1) // reset to page 1 on new search
    }

    const getMockDifficulty = (id: string) => {
        const char = id.charCodeAt(0) % 3
        if (char === 0) return { label: 'HARD', color: 'text-red-400 border-red-500/40 bg-red-500/10' }
        if (char === 1) return { label: 'MEDIUM', color: 'text-orange-400 border-orange-400/40 bg-orange-400/10' }
        return { label: 'EASY', color: 'text-green-400 border-green-500/40 bg-green-500/10' }
    }

    const getStatus = (p: ProblemScore) => {
        if (p.stability > 14) return { label: 'GRADUATED', color: 'text-green-400 border-green-500/30' }
        if (p.is_due && p.retrievability < 50) return { label: 'RE-LEARNING', color: 'text-red-400 border-red-500/30' }
        return { label: 'LEARNING', color: 'text-orange-400 border-orange-400/30' }
    }

    // Generate visible page numbers (max 5 slots)
    const getPageNumbers = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
        const start = Math.max(1, safePage - 2)
        const end = Math.min(totalPages, start + 4)
        return Array.from({ length: end - start + 1 }, (_, i) => start + i)
    }

    const startEntry = filtered.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1
    const endEntry = Math.min(safePage * ITEMS_PER_PAGE, filtered.length)

    return (
        <div className="space-y-8 pb-12 font-sans relative">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Problem Library</h2>
                    <p className="text-[#666] text-sm mt-2 max-w-lg leading-relaxed">
                        Manage your active spaced-repetition queue and track cognitive retention across LeetCode patterns.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555] group-focus-within:text-[#2fe0eb] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search ID or Name..."
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            className="bg-[#151515] border border-[#2a2a2a] text-sm text-[#e2e8f0] rounded-lg py-2.5 pl-11 pr-4 w-64 focus:border-[#2fe0eb]/50 focus:ring-1 focus:ring-[#2fe0eb]/20 transition-all outline-none placeholder:text-[#444]"
                        />
                    </div>
                    <button
                        onClick={() => handleQueryChange('')}
                        title="Clear filter"
                        className="bg-[#151515] border border-[#2a2a2a] p-2.5 rounded-lg hover:border-[#3a3a3a] transition-colors text-[#555] hover:text-white"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Metric Strips */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Tracked', value: totalTracked, accent: '#2fe0eb', border: 'border-l-[#2fe0eb]' },
                    { label: 'Due Today', value: dueToday, accent: '#ff9900', border: 'border-l-[#ff9900]' },
                    { label: 'Graduated', value: graduated, accent: '#2ecc71', border: 'border-l-[#2ecc71]' },
                    { label: 'Lapses', value: lapses, accent: '#e74c3c', border: 'border-l-[#e74c3c]' },
                ].map(({ label, value, accent, border }) => (
                    <div key={label} className={`bg-[#111] border border-[#1e1e1e] border-l-[3px] ${border} p-5 rounded-r-lg`}>
                        <div className="text-[9px] uppercase tracking-widest text-[#555] font-mono font-bold mb-3">{label}</div>
                        <div className="text-3xl font-bold font-mono tracking-tight" style={{ color: accent }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[#1e1e1e] bg-[#111]">
                            <th className="px-6 py-4 text-[10px] font-bold text-[#555] tracking-[0.15em] uppercase w-16">ID</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#555] tracking-[0.15em] uppercase">Problem Name</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#555] tracking-[0.15em] uppercase">Difficulty</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#555] tracking-[0.15em] uppercase">Interval</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#555] tracking-[0.15em] uppercase">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#555] tracking-[0.15em] uppercase text-right">Next Review</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]">
                        {paginated.length > 0 ? (
                            paginated.map((p, index) => {
                                const diff = getMockDifficulty(p.problem_id)
                                const status = getStatus(p)
                                const mockId = `#${(((safePage - 1) * ITEMS_PER_PAGE + index + 1) * 7 + 4)}`

                                return (
                                    <tr
                                        key={p.problem_id}
                                        className="hover:bg-[#131313] transition-colors group cursor-pointer"
                                        onClick={() => window.open(`https://leetcode.com/problems/${p.problem_id}`, '_blank')}
                                    >
                                        <td className="px-6 py-4 text-xs text-[#555] font-mono">{mockId}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-semibold text-[#e2e8f0] group-hover:text-[#2fe0eb] transition-colors">
                                                    {p.problem_title}
                                                </div>
                                                <ExternalLink className="w-3 h-3 text-[#333] group-hover:text-[#2fe0eb]/50 transition-colors opacity-0 group-hover:opacity-100" />
                                            </div>
                                            <div className="text-[10px] text-[#444] mt-0.5">{p.problem_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[9px] font-bold px-2.5 py-1 rounded border ${diff.color} uppercase tracking-widest`}>
                                                {diff.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-[#ccc] font-mono">{Math.max(1, Math.round(p.stability))}d</span>
                                                <div className="flex gap-1 opacity-60">
                                                    {[1, 2, 3, 4].map(dot => (
                                                        <div key={dot} className={`w-1 h-1 rounded-full ${dot * 25 <= p.retrievability ? 'bg-[#2fe0eb]' : 'bg-[#2a2a2a]'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[9px] font-bold px-3 py-1 rounded-sm border ${status.color} flex items-center gap-2 w-max`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {p.is_due ? (
                                                <>
                                                    <div className="text-sm font-mono text-orange-400">{p.retrievability < 50 ? 'Overdue' : 'Today'}</div>
                                                    <div className="text-[10px] text-[#444] italic mt-1">review now</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="text-sm font-mono text-[#ccc]">
                                                        {new Date(p.next_review_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    <div className="text-[10px] text-[#444] italic mt-1">
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
                                <td colSpan={6} className="px-6 py-16 text-center text-[#444] italic text-sm">
                                    {query ? `No problems matching "${query}"` : 'No active problems tracked yet. Solve some problems!'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {filtered.length > 0 && (
                <div className="flex items-center justify-between mt-2 text-[#555] text-xs">
                    <span className="font-mono">
                        Showing <span className="text-[#888]">{startEntry}</span>–<span className="text-[#888]">{endEntry}</span> of <span className="text-[#888]">{filtered.length}</span> entries
                    </span>
                    <div className="flex gap-1.5 font-mono">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="w-8 h-8 flex items-center justify-center bg-[#111] rounded-lg hover:bg-[#1a1a1a] transition-colors border border-[#1e1e1e] disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        {getPageNumbers().map(n => (
                            <button
                                key={n}
                                onClick={() => setPage(n)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all border text-xs ${
                                    n === safePage
                                        ? 'bg-[#2fe0eb]/10 text-[#2fe0eb] border-[#2fe0eb]/30 shadow-[0_0_10px_rgba(47,224,235,0.1)]'
                                        : 'bg-[#111] hover:bg-[#1a1a1a] border-[#1e1e1e]'
                                }`}
                            >
                                {n}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="w-8 h-8 flex items-center justify-center bg-[#111] rounded-lg hover:bg-[#1a1a1a] transition-colors border border-[#1e1e1e] disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
