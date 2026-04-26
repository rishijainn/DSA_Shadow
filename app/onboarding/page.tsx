'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const LEVELS = [
  { value: 'beginner', emoji: '🌱', label: 'Beginner', desc: 'learning the basics' },
  { value: 'intermediate', emoji: '⚡', label: 'Intermediate', desc: 'solving Mediums' },
  { value: 'advanced', emoji: '🔥', label: 'Advanced', desc: 'crushing Hards' },
]

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [commitment, setCommitment] = useState(3)
  const [level, setLevel] = useState('')
  const [username, setUsername] = useState('')
  const [notifTime, setNotifTime] = useState('20:00')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  // Particle network background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random(),
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(59,130,246,${p.a * 0.6})`
        ctx.fill()
      })
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(59,130,246,${(1 - d / 100) * 0.12})`
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

  const handleFinish = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        daily_commitment: commitment,
        self_assessed_level: level,
        leetcode_username: username || null,
        notification_time: notifTime,
      }),
    })
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1800)
  }

  const [h, m] = notifTime.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour

  return (
    <div className="relative min-h-screen bg-[#060810] flex items-center justify-center p-4 overflow-hidden font-['Syne',sans-serif]">

      {/* Animated canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Glow orbs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-52 h-52 rounded-full bg-violet-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-40 h-40 rounded-full bg-emerald-500/8 blur-[60px] pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0a0e1c]/85 border border-blue-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-[0_40px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center font-['Space_Mono'] text-[11px] font-bold text-white">
            DSA
          </div>
          <span className="text-sm font-bold text-white/90 tracking-widest uppercase">Shadow</span>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-[3px] flex-1 rounded-full transition-all duration-500 ${
              s < step ? 'bg-blue-500' :
              s === step ? 'bg-gradient-to-r from-blue-500 to-violet-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' :
              'bg-white/10'
            }`} />
          ))}
        </div>

        {/* ── DONE STATE ── */}
        {done && (
          <div className="text-center py-5 animate-[fadeUp_0.35s_ease_forwards]">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">You're all set.</h2>
            <p className="text-[13px] text-white/40 font-['Space_Mono'] leading-relaxed mb-5">
              // initializing your shadow...<br />memory model loading...
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {[`${commitment} problems/day`, level, username && `@${username}`, `${notifTime} reminder`].filter(Boolean).map(t => (
                <span key={t as string} className="px-2.5 py-1 rounded-full text-[11px] font-['Space_Mono'] bg-blue-500/10 border border-blue-500/20 text-blue-400/80">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 1 — Commitment ── */}
        {!done && step === 1 && (
          <div className="animate-[fadeUp_0.35s_ease_forwards]">
            <p className="text-[11px] font-['Space_Mono'] text-blue-500/60 tracking-widest uppercase mb-1.5">Step 01 / 04</p>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl mb-4">🎯</div>
            <h2 className="text-[22px] font-extrabold text-white tracking-tight leading-snug mb-1.5">Daily commitment</h2>
            <p className="text-[13px] text-white/40 font-['Space_Mono'] leading-relaxed mb-5">
              // problems_per_day = ?<br />consistency &gt; intensity
            </p>

            {/* Bar visualizer */}
            <div className="flex gap-1 items-end h-12 mb-5">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className={`flex-1 rounded-sm border transition-all duration-300 ${
                  n <= commitment
                    ? 'bg-gradient-to-t from-blue-600 to-violet-500 border-transparent shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                    : 'bg-blue-500/10 border-blue-500/10'
                }`} style={{ height: `${30 + n * 10}px` }} />
              ))}
            </div>

            <div className="grid grid-cols-5 gap-2 mb-5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setCommitment(n)}
                  className={`aspect-square rounded-xl border text-xl font-bold transition-all duration-200 ${
                    commitment === n
                      ? 'bg-gradient-to-br from-blue-500/30 to-violet-500/30 border-blue-500/60 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                      : 'bg-white/[0.03] border-white/8 text-white/50 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-white'
                  }`}>
                  {n}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-5">
              {[
                commitment <= 1 ? 'easy start' : commitment <= 3 ? 'solid pace' : 'ambitious',
                `${commitment * 7} problems/week`,
                `~${commitment * 20} min/day`,
              ].map(t => (
                <span key={t} className="px-2.5 py-1 rounded-full text-[11px] font-['Space_Mono'] bg-blue-500/8 border border-blue-500/15 text-blue-400/70">{t}</span>
              ))}
            </div>

            <button onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold text-sm tracking-wide shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(59,130,246,0.4)] transition-all duration-200">
              Continue →
            </button>
          </div>
        )}

        {/* ── STEP 2 — Level ── */}
        {!done && step === 2 && (
          <div className="animate-[fadeUp_0.35s_ease_forwards]">
            <p className="text-[11px] font-['Space_Mono'] text-blue-500/60 tracking-widest uppercase mb-1.5">Step 02 / 04</p>
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-2xl mb-4">🧠</div>
            <h2 className="text-[22px] font-extrabold text-white tracking-tight leading-snug mb-1.5">Skill assessment</h2>
            <p className="text-[13px] text-white/40 font-['Space_Mono'] leading-relaxed mb-5">
              // self_assessed_level = ?<br />honest input → better suggestions
            </p>

            <div className="flex flex-col gap-2 mb-6">
              {LEVELS.map(l => (
                <button key={l.value} onClick={() => setLevel(l.value)}
                  className={`p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all duration-200 ${
                    level === l.value
                      ? 'bg-gradient-to-r from-blue-500/12 to-violet-500/10 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                      : 'bg-white/[0.02] border-white/6 hover:bg-blue-500/6 hover:border-blue-500/20'
                  }`}>
                  <span className="text-[22px] w-9 text-center flex-shrink-0">{l.emoji}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{l.label}</div>
                    <div className="text-[12px] text-white/35 font-['Space_Mono'] mt-0.5">{l.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2.5">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3.5 rounded-xl border border-white/8 text-white/40 text-sm font-semibold hover:bg-white/4 hover:text-white/70 transition-all">
                ← Back
              </button>
              <button onClick={() => level && setStep(3)} disabled={!level}
                className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold text-sm tracking-wide shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(59,130,246,0.4)] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:translate-y-0">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 — LeetCode Username ── */}
        {!done && step === 3 && (
          <div className="animate-[fadeUp_0.35s_ease_forwards]">
            <p className="text-[11px] font-['Space_Mono'] text-blue-500/60 tracking-widest uppercase mb-1.5">Step 03 / 04</p>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl mb-4">🔗</div>
            <h2 className="text-[22px] font-extrabold text-white tracking-tight leading-snug mb-1.5">LeetCode account</h2>
            <p className="text-[13px] text-white/40 font-['Space_Mono'] leading-relaxed mb-5">
              // optional — skip with empty field<br />prevents duplicate suggestions
            </p>
 
            <input type="text" placeholder="your_leetcode_username"
              value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3.5 text-white font-['Space_Mono'] text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-white/20 transition-all mb-2"
            />
            <p className="text-[11px] text-white/25 font-['Space_Mono'] mb-6">→ leave empty to skip this step</p>

            <div className="flex gap-2.5">
              <button onClick={() => setStep(2)}
                className="flex-1 py-3.5 rounded-xl border border-white/8 text-white/40 text-sm font-semibold hover:bg-white/4 hover:text-white/70 transition-all">
                ← Back
              </button>
              <button onClick={() => setStep(4)}
                className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold text-sm tracking-wide shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4 — Notification Time ── */}
        {!done && step === 4 && (
          <div className="animate-[fadeUp_0.35s_ease_forwards]">
            <p className="text-[11px] font-['Space_Mono'] text-blue-500/60 tracking-widest uppercase mb-1.5">Step 04 / 04</p>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl mb-4">⏰</div>
            <h2 className="text-[22px] font-extrabold text-white tracking-tight leading-snug mb-1.5">Daily reminder</h2>
            <p className="text-[13px] text-white/40 font-['Space_Mono'] leading-relaxed mb-5">
              // notification_time = ?<br />nudge fires if daily goal not met
            </p>

            <div className="text-center p-5 bg-blue-500/5 border border-blue-500/15 rounded-2xl mb-3">
              <div className="text-[44px] font-extrabold tracking-tight font-['Space_Mono'] bg-gradient-to-r from-white to-blue-400/80 bg-clip-text text-transparent">
                {String(h12).padStart(2, '0')}:{m}
                <span className="text-xl opacity-50 ml-2">{ampm}</span>
              </div>
              <div className="text-[11px] text-white/30 font-['Space_Mono'] mt-1 tracking-widest uppercase">reminder fires here</div>
            </div>

            <input type="time" value={notifTime} onChange={e => setNotifTime(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3.5 text-white font-['Space_Mono'] text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all mb-2"
            />
            <p className="text-[11px] text-white/25 font-['Space_Mono'] mb-6">→ only nudges if today's goal isn't met yet</p>

            <div className="flex gap-2.5">
              <button onClick={() => setStep(3)}
                className="flex-1 py-3.5 rounded-xl border border-white/8 text-white/40 text-sm font-semibold hover:bg-white/4 hover:text-white/70 transition-all">
                ← Back
              </button>
              <button onClick={handleFinish} disabled={loading}
                className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold text-sm tracking-wide shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0">
                {loading ? 'Setting up...' : 'Launch 🚀'}
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}