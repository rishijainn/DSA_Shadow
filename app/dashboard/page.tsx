'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import ProblemExplorer from './ProblemExplorer'
import MasteryInsights from './MasteryInsights'
import SolvedVault from './SolvedVault'
import Overview from './Overview'
import { LayoutDashboard, Library, Settings, RefreshCw, User, FileText, LogOut, CheckCircle2 } from 'lucide-react'

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
        <div className="h-screen bg-background flex flex-col items-center justify-center font-mono">
            <div className="text-primary text-sm animate-pulse mb-4 tracking-widest uppercase">INITIALIZING KINETIC SYSTEMS...</div>
            <div className="w-48 h-1 bg-border rounded overflow-hidden">
                <div className="h-full bg-primary w-1/2 animate-[ping_1.5s_infinite]"></div>
            </div>
        </div>
    )

    return (
        <div className="h-screen bg-background text-foreground overflow-hidden flex font-sans selection:bg-primary/30">
            
            {/* Sidebar Navigation */}
            <aside className="w-64 flex-shrink-0 bg-[#0e0e0e] border-r border-[#1a1a1a] flex flex-col justify-between z-20">
                <div>
                    {/* Brand */}
                    <div className="p-8 pb-10">
                        <h1 className="text-xl font-bold tracking-tighter text-white font-mono uppercase">DSA_Shadow</h1>
                        <p className="text-[10px] text-muted font-mono tracking-[0.2em] mt-2">V1.0.4-STABLE</p>
                    </div>

                    {/* Nav Links */}
                    <nav className="space-y-2">
                        {[
                            { id: 'overview', icon: LayoutDashboard, label: 'DASHBOARD' },
                            { id: 'explore', icon: Library, label: 'LIBRARY' },
                            { id: 'vault', icon: CheckCircle2, label: 'VAULT' },
                            { id: 'insights', icon: Settings, label: 'CONFIG' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center gap-4 px-8 py-3 text-xs font-bold tracking-[0.15em] transition-all uppercase ${
                                    activeTab === item.id 
                                    ? 'bg-[#1a1a1a] text-primary border-l-[3px] border-primary' 
                                    : 'text-muted hover:text-white border-l-[3px] border-transparent'
                                }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Bottom Sidebar Elements */}
                <div className="p-8 flex flex-col gap-8">
                    <button className="w-full py-2.5 bg-primary rounded font-bold text-[11px] tracking-[0.2em] text-[#0a0a0a] hover:bg-white transition-all shadow-[0_0_15px_rgba(47,224,235,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                        SYNC NOW
                    </button>
                    
                    <div className="flex flex-col gap-5">
                        <button className="flex items-center gap-3 text-[11px] text-muted hover:text-white font-bold tracking-[0.15em] uppercase transition-colors">
                            <FileText className="w-4 h-4" />
                            Docs
                        </button>
                        <button
                            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
                            className="flex items-center gap-3 text-[11px] text-muted hover:text-white transition-colors font-bold tracking-[0.15em] uppercase"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-background">
                
                {/* Top Nav Strip */}
                <header className="h-16 flex items-center justify-between px-10 border-b border-[#1a1a1a] bg-background/80 backdrop-blur-sm z-10 flex-shrink-0">
                    <div className="flex items-center gap-3 text-[11px] font-mono font-bold tracking-widest uppercase">
                        <span className="text-primary textShadow-primary">KINETIC LOG</span>
                        <span className="text-[#333]">|</span>
                        <span className="text-primary">STATUS: ONLINE</span>
                    </div>
                    <div className="flex items-center gap-6 text-muted">
                        <button className="hover:text-white transition-colors"><RefreshCw className="w-4 h-4" /></button>
                        <button className="hover:text-white transition-colors"><User className="w-4 h-4 bg-[#222] rounded-full p-0.5" /></button>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto w-full p-10 pb-32">
                    <div className="max-w-6xl mx-auto">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            
                            {/* Problem Library is the Default Tab now */}
                            {activeTab === 'explore' && <ProblemExplorer userId={user?.id} allProblems={allProblems} />}
                            
                            {/* Overview Dashboard */}
                            {activeTab === 'overview' && <Overview dueProblems={dueProblems} allProblems={allProblems} userId={user?.id} />}
                            {activeTab === 'insights' && <MasteryInsights userId={user?.id} />}
                            {activeTab === 'vault' && <SolvedVault userId={user?.id} />}
                            
                        </div>
                    </div>
                </div>

                {/* Bottom Footer Status Strip */}
                <footer className="absolute bottom-0 w-full h-12 border-t border-[#1a1a1a] bg-[#0e0e0e]/95 backdrop-blur-sm z-10 flex items-center justify-between px-10">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green shadow-[0_0_8px_rgba(46,204,113,0.8)]"></div>
                            <span className="text-[9px] font-mono font-bold tracking-widest text-[#888]">ENGINE: SRS_V2</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(47,224,235,0.8)]"></div>
                            <span className="text-[9px] font-mono font-bold tracking-widest text-[#888]">DATABASE: ENCRYPTED</span>
                        </div>
                    </div>
                    <div className="text-[9px] font-mono text-[#444] tracking-widest hidden lg:block">
                        CONSOLE_LOG :: SESSION_ID_{user?.id?.split('-')[0].toUpperCase()}
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