'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
    const [mode, setMode] = useState<Mode>('signin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                window.location.href = '/dashboard'
            }
        }
        checkUser()
    }, [])

    // Particle canvas background
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        let animId: number

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        const particles = Array.from({ length: 50 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            r: Math.random() * 1.2 + 0.4,
            a: Math.random() * 0.3 + 0.05,
        }))

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(47,224,235,${p.a})`
                ctx.fill()
            })
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const d = Math.sqrt(dx * dx + dy * dy)
                    if (d < 110) {
                        ctx.beginPath()
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.strokeStyle = `rgba(47,224,235,${(1 - d / 110) * 0.06})`
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                }
            }
            animId = requestAnimationFrame(draw)
        }
        draw()
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
    }, [])

    const handleGoogle = async () => {
        setGoogleLoading(true)
        setError('')
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${location.origin}/dashboard` }
        })
        setGoogleLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        if (mode === 'signin') {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) {
                setError(error.message)
            } else {
                window.location.href = '/dashboard'
            }
        } else {
            const { error } = await supabase.auth.signUp({ email, password })
            if (error) {
                setError(error.message)
            } else {
                setSuccess('Account created! Check your email to confirm signup.')
            }
        }
        setLoading(false)
    }

    return (
        <div className="relative min-h-screen bg-[#060810] flex items-center justify-center p-4 overflow-hidden">
            {/* Animated canvas background */}
            <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />

            {/* Glow orbs */}
            <div className="fixed top-0 left-0 w-96 h-96 rounded-full pointer-events-none z-0"
                style={{ background: 'radial-gradient(circle, rgba(47,224,235,0.06) 0%, transparent 70%)', transform: 'translate(-40%, -40%)' }} />
            <div className="fixed bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none z-0"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', transform: 'translate(30%, 30%)' }} />
            {/* Grid overlay */}
            <div className="fixed inset-0 pointer-events-none z-0"
                style={{ backgroundImage: 'linear-gradient(rgba(47,224,235,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(47,224,235,0.015) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

            {/* Card */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo / Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#2fe0eb]/10 border border-[#2fe0eb]/30 flex items-center justify-center">
                            <span className="text-[#2fe0eb] text-xs font-bold font-mono">DSA</span>
                        </div>
                        <span className="text-white font-bold text-lg tracking-tight">DSA Shadow</span>
                    </div>
                    <p className="text-[#444] text-sm font-mono">// Stop forgetting. Start retaining.</p>
                </div>

                <div className="bg-[#0a0e1c]/80 border border-[#1a2035] rounded-2xl p-8 backdrop-blur-xl shadow-[0_40px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]">
                    {/* Mode Toggle */}
                    <div className="flex bg-[#060810] rounded-xl p-1 mb-8 border border-[#151a2e]">
                        {(['signin', 'signup'] as Mode[]).map(m => (
                            <button
                                key={m}
                                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                    mode === m
                                        ? 'bg-[#2fe0eb]/10 text-[#2fe0eb] border border-[#2fe0eb]/20 shadow-[0_0_12px_rgba(47,224,235,0.1)]'
                                        : 'text-[#444] hover:text-[#888]'
                                }`}
                            >
                                {m === 'signin' ? 'Sign In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>

                    {/* Google Button */}
                    <button
                        onClick={handleGoogle}
                        disabled={googleLoading}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-[0_4px_20px_rgba(255,255,255,0.1)] disabled:opacity-60 disabled:cursor-not-allowed mb-6 text-sm"
                    >
                        {googleLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                        )}
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-[#151a2e]" />
                        <span className="text-[#333] text-xs font-mono">or</span>
                        <div className="flex-1 h-px bg-[#151a2e]" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333] group-focus-within:text-[#2fe0eb] transition-colors pointer-events-none" />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="w-full bg-[#060810] border border-[#151a2e] text-white pl-11 pr-4 py-3.5 rounded-xl outline-none focus:border-[#2fe0eb]/40 focus:ring-1 focus:ring-[#2fe0eb]/20 transition-all text-sm placeholder:text-[#2a2a3a]"
                            />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333] group-focus-within:text-[#2fe0eb] transition-colors pointer-events-none" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="w-full bg-[#060810] border border-[#151a2e] text-white pl-11 pr-11 py-3.5 rounded-xl outline-none focus:border-[#2fe0eb]/40 focus:ring-1 focus:ring-[#2fe0eb]/20 transition-all text-sm placeholder:text-[#2a2a3a]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#333] hover:text-[#888] transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Error / Success messages */}
                        {error && (
                            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <p className="text-red-400 text-xs">{error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                                <p className="text-green-400 text-xs">{success}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-[#2fe0eb] text-[#060810] font-bold text-sm tracking-wide hover:bg-white transition-all duration-200 shadow-[0_0_20px_rgba(47,224,235,0.25)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                                </>
                            ) : (
                                mode === 'signin' ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-[#2a2a3a] text-[11px] font-mono mt-6">
                        // Free forever · No credit card
                    </p>
                </div>
            </div>
        </div>
    )
}