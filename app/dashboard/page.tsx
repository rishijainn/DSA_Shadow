'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import ProblemExplorer from './ProblemExplorer'
import MasteryInsights from './MasteryInsights'
import SolvedVault from './SolvedVault'
import { LayoutDashboard, BarChart, Library, Settings, Search, LogOut, CheckCircle2 } from 'lucide-react'

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
    const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'explore' | 'vault'>('overview')
    const [dueProblems, setDueProblems] = useState<ProblemScore[]>([])
    const [solvedToday, setSolvedToday] = useState<any[]>([])
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
            setSolvedToday(data.solved_today || [])
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
        <div className="min-h-screen bg-[#020617] text-white">
            <div className="max-w-6xl mx-auto flex gap-6 p-6">

                {/* Sidebar Navigation */}
                <aside className="w-64 hidden md:block">
                    <div className="sticky top-6 space-y-8">
                        <div>
                            <div className="flex items-center gap-2 px-4 mb-1">
                                <div className="p-1.5 bg-blue-600 rounded-lg">
                                    <div className="w-4 h-4 bg-white/30 rounded-full animate-pulse" />
                                </div>
                                <h1 className="text-xl font-bold tracking-tight">DSA Shadow</h1>
                            </div>
                            <p className="px-4 text-[10px] text-gray-500 font-mono">v1.0.4-beta</p>
                        </div>

                        <nav className="space-y-1">
                            {[
                                { id: 'overview', icon: LayoutDashboard, label: 'Daily Focus' },
                                { id: 'insights', icon: BarChart, label: 'Mastery Profile' },
                                { id: 'vault', icon: CheckCircle2, label: 'Solved History' },
                                { id: 'explore', icon: Library, label: 'Problem Library' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as any)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                        activeTab === item.id 
                                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900'
                                    }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        <div className="pt-8 border-t border-gray-900 flex flex-col gap-4">
                            <div className="px-4">
                                <div className="text-[10px] uppercase text-gray-600 font-bold tracking-wider mb-2">Account</div>
                                <p className="text-xs text-gray-400 truncate mb-4">{user?.email}</p>
                                <button
                                    onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
                                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition"
                                >
                                    <LogOut className="w-3 h-3" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    
                    {/* Active Tab Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold">Good morning, {user?.email?.split('@')[0]}</h2>
                                        <p className="text-gray-500 text-sm mt-1">Here is what we recommend you review today.</p>
                                    </div>
                                </div>

                                {/* Due for Review Banner */}
                                <div className={`overflow-hidden relative rounded-3xl p-8 border transition-all duration-500 ${
                                    dueProblems.length > 0 
                                    ? 'bg-blue-600/5 border-blue-500/30' 
                                    : 'bg-gray-900/50 border-gray-800'
                                }`}>
                                    <div className="relative z-10">
                                        {dueProblems.length > 0 ? (
                                            <>
                                                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                                    {dueProblems.length} Challenge{dueProblems.length > 1 ? 's' : ''} Ready
                                                </h2>
                                                <p className="text-blue-300/80 text-sm">Your memory stability suggests these topics are at a critical recall point.</p>
                                            </>
                                        ) : (
                                            <>
                                                <h2 className="text-2xl font-bold mb-2">You're up to date!</h2>
                                                <p className="text-gray-400 text-sm">Keep solving new problems on LeetCode. We'll alert you when a review is due.</p>
                                            </>
                                        )}
                                    </div>
                                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-600/10 to-transparent blur-3xl pointer-events-none" />
                                </div>

                                {/* Due Problems List */}
                                <div className="space-y-4">
                                    {dueProblems.map(p => (
                                        <div key={p.problem_id}
                                            className="group bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-5 flex items-center justify-between hover:border-blue-500/50 hover:bg-gray-900/60 transition-all duration-300">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Review</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        p.retrievability >= 80 ? 'bg-green-900/30 text-green-400' :
                                                        p.retrievability >= 50 ? 'bg-yellow-900/30 text-yellow-400' :
                                                            'bg-red-900/30 text-red-400'
                                                    }`}>
                                                        {p.retrievability}% Recall
                                                    </span>
                                                </div>
                                                <p className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{p.problem_title}</p>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Stability: {p.stability}d · Attempted {p.total_solved}x · {p.hint_rate}% AI Assist
                                                </p>
                                            </div>

                                            <a href={`https://leetcode.com/problems/${p.problem_id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-blue-600 text-white text-sm px-6 py-2.5 rounded-xl hover:bg-blue-500 hover:scale-105 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] font-bold">
                                                Solve
                                            </a>
                                        </div>
                                    ))}
                                </div>

                                {/* Solved Today Section */}
                                {solvedToday.length > 0 && (
                                    <div className="pt-8">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Solved Today</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {solvedToday.map(s => (
                                                <div key={s.id} className="bg-gray-900/20 border border-gray-800/50 rounded-xl p-4 flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold text-sm">{s.problem_title}</p>
                                                        <p className="text-[10px] text-gray-500 mt-1 uppercase">
                                                            Feeling: <span className="text-blue-400">{s.difficulty_feel}</span> · 
                                                            AI: <span className={s.hint_used ? 'text-yellow-500' : 'text-green-500'}>{s.hint_used ? 'Yes' : 'No'}</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-[10px] text-gray-600 font-mono">
                                                        {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'insights' && <MasteryInsights userId={user?.id} />}
                        {activeTab === 'vault' && <SolvedVault userId={user?.id} />}
                        {activeTab === 'explore' && <ProblemExplorer userId={user?.id} />}
                    </div>
                </main>
            </div>

            {/* Session Sync Element for Extension */}
            {user?.id && (
                <div id="dsa-shadow-session" data-user-id={user.id} style={{ display: 'none' }} aria-hidden="true" />
            )}
        </div>
    )
}