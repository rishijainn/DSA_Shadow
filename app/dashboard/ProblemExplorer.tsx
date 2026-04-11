'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, Filter, ExternalLink, CheckCircle2 } from 'lucide-react'

interface Problem {
    title: string
    title_slug: string
    difficulty: string
    topics: string[]
    solved: boolean
    mastery: number
}

export default function ProblemExplorer({ userId }: { userId: string }) {
    const [problems, setProblems] = useState<Problem[]>([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')
    const [difficulty, setDifficulty] = useState('')
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [total, setTotal] = useState(0)

    const fetchProblems = async (reset = false) => {
        const currentOffset = reset ? 0 : offset
        setLoading(true)
        const res = await fetch(`/api/problems?user_id=${userId}&query=${query}&difficulty=${difficulty}&offset=${currentOffset}&limit=50`)
        const data = await res.json()

        if (reset) {
            setProblems(data.problems)
        } else {
            setProblems(prev => [...prev, ...data.problems])
        }
        
        setOffset(currentOffset + data.problems.length)
        setHasMore(data.has_more)
        setTotal(data.total)
        setLoading(false)
    }

    useEffect(() => {
        const timer = setTimeout(() => fetchProblems(true), 300)
        return () => clearTimeout(timer)
    }, [query, difficulty])

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search problems..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                </div>
                <div className="flex gap-2">
                    {['Easy', 'Medium', 'Hard'].map(d => (
                        <button
                            key={d}
                            onClick={() => setDifficulty(difficulty === d ? '' : d)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                                difficulty === d ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-700'
                            }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-xs text-gray-500 mb-2">Showing {problems.length} of {total} problems</div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {problems.map(p => (
                    <div key={p.title_slug} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center justify-between hover:border-gray-700 transition group">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    p.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400' :
                                    p.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' :
                                    'bg-red-900/30 text-red-400'
                                }`}>
                                    {p.difficulty}
                                </span>
                                {p.solved && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                            </div>
                            <h3 className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition">{p.title}</h3>
                            <div className="flex gap-2 mt-2 overflow-x-hidden">
                                {p.topics?.slice(0, 3).map(t => (
                                    <span key={t} className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <a 
                            href={`https://leetcode.com/problems/${p.title_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                ))}
            </div>

            {hasMore && (
                <button
                    onClick={() => fetchProblems()}
                    disabled={loading}
                    className="w-full py-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 text-sm hover:bg-gray-800 transition disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Load More Problems'}
                </button>
            )}
        </div>
    )
}
