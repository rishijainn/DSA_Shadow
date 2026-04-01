'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

export default function Dashboard() {
    const [user, setUser] = useState<any>(null)
    const [dueProblems, setDueProblems] = useState<ProblemScore[]>([])
    const [allProblems, setAllProblems] = useState<ProblemScore[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            setUser(user)

            const res = await fetch(`/api/review-schedule?user_id=${user.id}`)
            const data = await res.json()

            setDueProblems(data.problems_due || [])
            setAllProblems(data.all_problems || [])
            setLoading(false)
        }
        init()
    }, [])

    if (loading) return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-white text-xl animate-pulse">Loading your plan...</div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="max-w-4xl mx-auto p-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-400">DSA Shadow</h1>
                        <p className="text-gray-400 mt-1 text-sm">{user?.email}</p>
                    </div>
                    <button
                        onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
                        className="bg-gray-800 px-4 py-2 rounded-xl text-gray-400 hover:text-white transition text-sm">
                        Sign Out
                    </button>
                </div>

                {/* Due for Review Banner */}
                <div className={`rounded-2xl p-6 mb-6 border ${dueProblems.length > 0 ? 'bg-blue-950 border-blue-700' : 'bg-gray-900 border-gray-800'}`}>
                    {dueProblems.length > 0 ? (
                        <>
                            <h2 className="text-xl font-bold mb-1">
                                {dueProblems.length} problem{dueProblems.length > 1 ? 's' : ''} due for review
                            </h2>
                            <p className="text-blue-300 text-sm">Revisit these to strengthen your memory</p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold mb-1">Nothing due for review!</h2>
                            <p className="text-gray-400 text-sm">Keep solving problems on LeetCode. We will remind you when to revisit them.</p>
                        </>
                    )}
                </div>

                {/* Due Problems */}
                {dueProblems.length > 0 && (
                    <div className="space-y-3 mb-8">
                        {dueProblems.map(p => (
                            <div key={p.problem_id}
                                className="bg-gray-900 border border-blue-800 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs bg-blue-900 text-blue-400 px-2 py-1 rounded-full font-semibold">Review</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.retrievability >= 80 ? 'bg-green-900 text-green-400' :
                                            p.retrievability >= 50 ? 'bg-yellow-900 text-yellow-400' :
                                                'bg-red-900 text-red-400'
                                            }`}>
                                            {p.retrievability}% recall
                                        </span>
                                    </div>
                                    <p className="font-semibold text-white">{p.problem_title}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Solved {p.total_solved} time{p.total_solved > 1 ? 's' : ''} · {p.hint_rate}% hint rate
                                    </p>
                                </div>

                                <a href={`https://leetcode.com/problems/${p.problem_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition font-semibold">
                                    Solve
                                </a>
                            </div>
                        ))}
                    </div>
                )}

                {/* All Problems */}
                {allProblems.length > 0 && (
                    <>
                        <h2 className="text-xl font-bold mb-4">All Tracked Problems</h2>
                        <div className="space-y-3">
                            {allProblems.map(p => (
                                <div key={p.problem_id}
                                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <p className="font-semibold text-white">{p.problem_title}</p>
                                            {p.is_due && (
                                                <span className="text-xs bg-red-900 text-red-400 px-2 py-1 rounded-full">Due</span>
                                            )}
                                        </div>

                                        {/* Retrievability bar */}
                                        <div className="w-full bg-gray-800 rounded-full h-1.5 mb-2">
                                            <div
                                                className={`h-1.5 rounded-full transition-all ${p.retrievability >= 80 ? 'bg-green-500' :
                                                    p.retrievability >= 50 ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                    }`}
                                                style={{ width: `${p.retrievability}%` }}
                                            />
                                        </div>

                                        <div className="flex gap-4 text-xs text-gray-400">
                                            <span>{p.retrievability}% recall</span>
                                            <span>{p.stability}d stability</span>
                                            <span>{p.total_solved} solved</span>
                                            <span>{p.hint_rate}% hints</span>
                                            <span>Review: {p.next_review_date}</span>
                                        </div>
                                    </div>

                                    <a href={`https://leetcode.com/problems/${p.problem_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-4 bg-gray-700 text-white text-sm px-3 py-2 rounded-xl hover:bg-gray-600 transition">
                                        Open
                                    </a>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Empty state */}
                {allProblems.length === 0 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center mt-6">
                        <h3 className="text-xl font-bold text-white mb-2">No problems tracked yet</h3>
                        <p className="text-gray-400 text-sm">
                            Solve problems on LeetCode with the DSA Shadow extension active. We will track your progress automatically.
                        </p>
                    </div>
                )}

            </div>
        </div>
    )
}