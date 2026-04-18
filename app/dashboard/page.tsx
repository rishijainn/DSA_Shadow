'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import ProblemExplorer from './ProblemExplorer'
import MasteryInsights from './MasteryInsights'
import SolvedVault from './SolvedVault'
import Overview from './Overview'
import { LayoutDashboard, Library, RefreshCw, User, FileText, LogOut, Loader2, Brain, History } from 'lucide-react'

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
    const [syncing, setSyncing] = useState(false)
    const [syncKey, setSyncKey] = useState(0) // forces child re-mount on sync
    const router = useRouter()

    const fetchData = useCallback(async (userId: string) => {
        const res = await fetch(`/api/review-schedule?user_id=${userId}`, { cache: 'no-store' })
        const data = await res.json()
        setDueProblems(data.problems_due || [])
        setSolvedToday(data.solved_today || [])
        setAllProblems(data.all_problems || [])
    }, [])

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            setUser(user)
            await fetchData(user.id)
            setLoading(false)
        }
        init()
    }, [fetchData, router])

    const handleSync = async () => {
        if (!user || syncing) return
        setSyncing(true)
        await fetchData(user.id)
        setSyncKey(k => k + 1)
        setSyncing(false)
    }

    if (loading) return (
        <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center font-mono">
            <div className="relative mb-8">
                <div className="w-16 h-16 rounded-2xl bg-[#151515] border border-[#2fe0eb]/30 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[#2fe0eb] animate-spin" />
                </div>
                <div className="absolute -inset-1 rounded-2xl bg-[#2fe0eb]/10 blur-lg" />
            </div>
            <div className="text-[#2fe0eb] text-xs animate-pulse mb-3 tracking-[0.3em] uppercase">Initializing Kinetic Systems</div>
            <div className="w-40 h-px bg-gradient-to-r from-transparent via-[#2fe0eb]/40 to-transparent" />
        </div>
    )

    return (
        <div className="h-screen bg-[#0a0a0a] text-[#e2e8f0] overflow-hidden flex font-sans">

            {/* Sidebar Navigation */}
            <aside className="w-64 flex-shrink-0 bg-[#0e0e0e] border-r border-[#1a1a1a] flex flex-col justify-between z-20">
                <div>
                    {/* Brand */}
                    <div className="p-8 pb-10">
                        <h1 className="text-xl font-bold tracking-tighter text-white font-mono uppercase">DSA_Shadow</h1>
                        <p className="text-[10px] text-[#555] font-mono tracking-[0.2em] mt-2">V1.0.4-STABLE</p>
                    </div>

                    {/* Nav Links */}
                    <nav className="space-y-1 px-3">
                        {[
                            { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
                            { id: 'explore', icon: Library, label: 'Library' },
                            { id: 'vault', icon: History, label: 'History' },
                            { id: 'insights', icon: Brain, label: 'Insights' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center gap-3 px-5 py-3 text-xs font-bold tracking-[0.1em] transition-all duration-200 uppercase rounded-lg ${
                                    activeTab === item.id
                                    ? 'bg-[#2fe0eb]/10 text-[#2fe0eb] border border-[#2fe0eb]/20'
                                    : 'text-[#555] hover:text-white hover:bg-[#1a1a1a] border border-transparent'
                                }`}
                            >
                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Bottom Sidebar Elements */}
                <div className="p-6 flex flex-col gap-6">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="w-full py-2.5 bg-[#2fe0eb] rounded-lg font-bold text-[11px] tracking-[0.15em] text-[#0a0a0a] hover:bg-white transition-all shadow-[0_0_20px_rgba(47,224,235,0.25)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {syncing ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                SYNCING...
                            </>
                        ) : 'SYNC NOW'}
                    </button>

                    <div className="flex flex-col gap-4">
                        <a
                            href="https://github.com/rishijainn/DSA_Shadow"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-[11px] text-[#555] hover:text-white font-bold tracking-[0.15em] uppercase transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            GitHub
                        </a>
                        <button
                            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
                            className="flex items-center gap-3 text-[11px] text-[#555] hover:text-red-400 transition-colors font-bold tracking-[0.15em] uppercase"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#0a0a0a]">

                {/* Top Nav Strip */}
                <header className="h-14 flex items-center justify-between px-10 border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm z-10 flex-shrink-0">
                    <div className="flex items-center gap-3 text-[11px] font-mono font-bold tracking-widest uppercase">
                        <span className="text-[#2fe0eb]">KINETIC LOG</span>
                        <span className="text-[#2a2a2a]">|</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#2ecc71] animate-pulse shadow-[0_0_6px_rgba(46,204,113,0.8)]" />
                            <span className="text-[#2fe0eb]">STATUS: ONLINE</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-[#444]">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            title="Refresh data"
                            className="hover:text-[#2fe0eb] transition-colors disabled:opacity-40"
                        >
                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-[#555]" />
                            </div>
                            <span className="text-[10px] font-mono text-[#444] hidden md:block">
                                {user?.email?.split('@')[0]}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto w-full p-10 pb-16">
                    <div className="max-w-6xl mx-auto">
                        {activeTab === 'explore' && <ProblemExplorer key={`explore-${syncKey}`} userId={user?.id} allProblems={allProblems} />}
                        {activeTab === 'overview' && <Overview key={`overview-${syncKey}`} dueProblems={dueProblems} allProblems={allProblems} userId={user?.id} />}
                        {activeTab === 'insights' && <MasteryInsights key={`insights-${syncKey}`} userId={user?.id} />}
                        {activeTab === 'vault' && <SolvedVault key={`vault-${syncKey}`} userId={user?.id} />}
                    </div>
                </div>

                {/* Bottom Footer Status Strip */}
                <footer className="h-10 border-t border-[#1a1a1a] bg-[#0e0e0e]/95 backdrop-blur-sm z-10 flex items-center justify-between px-10">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#2ecc71] shadow-[0_0_6px_rgba(46,204,113,0.8)]" />
                            <span className="text-[9px] font-mono font-bold tracking-widest text-[#555]">ENGINE: SRS_V2</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#2fe0eb] shadow-[0_0_6px_rgba(47,224,235,0.8)]" />
                            <span className="text-[9px] font-mono font-bold tracking-widest text-[#555]">DATABASE: ENCRYPTED</span>
                        </div>
                    </div>
                    <div className="text-[9px] font-mono text-[#333] tracking-widest hidden lg:block">
                        SESSION_ID_{user?.id?.split('-')[0].toUpperCase()}
                    </div>
                </footer>
            </main>

            {/* Session Sync Element for Extension */}
            {user?.id && (
                <div id="dsa-shadow-session" data-user-id={user.id} style={{ display: 'none' }} aria-hidden="true" />
            )}
        </div>
    )
}