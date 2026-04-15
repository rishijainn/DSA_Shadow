'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export default function Home() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const curveChartRef = useRef<HTMLCanvasElement>(null)
  const fsrsChartRef = useRef<HTMLCanvasElement>(null)

  // Particle canvas
  useEffect(() => {
    const canvas = bgCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number

    const particles: { x: number; y: number; r: number; vx: number; vy: number; o: number }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        o: Math.random() * 0.4 + 0.1,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(96,165,250,${p.o})`
        ctx.fill()
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      })
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(59,130,246,${0.08 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // Retention curve chart
  useEffect(() => {
    const c = curveChartRef.current
    if (!c) return
    const cc = c.getContext('2d')!
    const setup = () => {
      c.width = c.offsetWidth * window.devicePixelRatio
      c.height = c.offsetHeight * window.devicePixelRatio
      cc.scale(window.devicePixelRatio, window.devicePixelRatio)
      const cw = c.offsetWidth, ch = c.offsetHeight
      const pad = { l: 50, r: 20, t: 20, b: 40 }
      const pw = cw - pad.l - pad.r, ph = ch - pad.t - pad.b

      cc.strokeStyle = 'rgba(59,130,246,0.08)'
      cc.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + ph * i / 4
        cc.beginPath(); cc.moveTo(pad.l, y); cc.lineTo(pad.l + pw, y); cc.stroke()
      }

      const curves = [
        { color: '#3b82f6', decay: 0.018 },
        { color: '#818cf8', decay: 0.035 },
        { color: '#4ade80', decay: 0.012 },
      ]
      curves.forEach((curve) => {
        cc.beginPath()
        for (let x = 0; x <= pw; x++) {
          const t = (x / pw) * 60
          const y = Math.exp(-curve.decay * t)
          const px = pad.l + x, py = pad.t + ph * (1 - y)
          x === 0 ? cc.moveTo(px, py) : cc.lineTo(px, py)
        }
        cc.strokeStyle = curve.color; cc.lineWidth = 2; cc.stroke()
        ;[0, 12, 25, 42].forEach((day) => {
          const y = Math.exp(-curve.decay * day)
          const px = pad.l + (day / 60) * pw, py = pad.t + ph * (1 - y)
          cc.beginPath(); cc.arc(px, py, 4, 0, Math.PI * 2)
          cc.fillStyle = curve.color; cc.fill()
        })
      })

      cc.strokeStyle = 'rgba(100,116,139,0.3)'; cc.lineWidth = 1
      cc.beginPath(); cc.moveTo(pad.l, pad.t); cc.lineTo(pad.l, pad.t + ph); cc.lineTo(pad.l + pw, pad.t + ph); cc.stroke()

      cc.fillStyle = 'rgba(100,116,139,0.7)'; cc.font = '11px JetBrains Mono,monospace'
      ;['100%', '75%', '50%', '25%', '0%'].forEach((l, i) => cc.fillText(l, 2, pad.t + ph * i / 4 + 4))
      ;['0d', '15d', '30d', '45d', '60d'].forEach((l, i) => cc.fillText(l, pad.l + pw * i / 4 - 8, ch - 8))

      cc.strokeStyle = 'rgba(74,222,128,0.3)'; cc.lineWidth = 1; cc.setLineDash([4, 4])
      const threshY = pad.t + ph * 0.1
      cc.beginPath(); cc.moveTo(pad.l, threshY); cc.lineTo(pad.l + pw, threshY); cc.stroke()
      cc.setLineDash([])
      cc.fillStyle = 'rgba(74,222,128,0.7)'; cc.font = '10px JetBrains Mono,monospace'
      cc.fillText('90% threshold', pad.l + 8, threshY - 5)
    }
    setTimeout(setup, 100)
  }, [])

  // FSRS chart
  useEffect(() => {
    const f = fsrsChartRef.current
    if (!f) return
    const fc = f.getContext('2d')!
    const setup = () => {
      f.width = f.offsetWidth * window.devicePixelRatio
      f.height = f.offsetHeight * window.devicePixelRatio
      fc.scale(window.devicePixelRatio, window.devicePixelRatio)
      const fw = f.offsetWidth, fh = f.offsetHeight
      const pad = { l: 10, r: 10, t: 10, b: 10 }
      const pw = fw - pad.l - pad.r, ph = fh - pad.t - pad.b

      const stab = [30, 45, 62, 78, 88, 95]
      const barW = (pw / stab.length) * 0.6
      const gap = pw / stab.length
      stab.forEach((v, i) => {
        const bh = ph * v / 100
        const grd = fc.createLinearGradient(0, pad.t + ph - bh, 0, pad.t + ph)
        grd.addColorStop(0, 'rgba(59,130,246,0.9)')
        grd.addColorStop(1, 'rgba(59,130,246,0.2)')
        fc.fillStyle = grd
        fc.beginPath()
        fc.roundRect(pad.l + i * gap + (gap - barW) / 2, pad.t + ph - bh, barW, bh, 4)
        fc.fill()
      })

      fc.beginPath()
      for (let x = 0; x <= pw; x++) {
        const t = x / pw
        const seg = Math.floor(t * 5)
        const segT = (t * 5) % 1
        const baseRetention = 0.9 * Math.pow(1.1, seg)
        const y = Math.min(1, baseRetention) * Math.exp(-0.8 * segT)
        const px = pad.l + x, py = pad.t + ph * (1 - y)
        x === 0 ? fc.moveTo(px, py) : fc.lineTo(px, py)
      }
      fc.strokeStyle = 'rgba(74,222,128,0.8)'; fc.lineWidth = 2; fc.stroke()

      ;[0, 1, 2, 3, 4, 5].forEach((i) => {
        const x = pad.l + i * (pw / 5)
        fc.beginPath(); fc.arc(x, pad.t + ph * 0.1, 5, 0, Math.PI * 2)
        fc.fillStyle = 'rgba(251,191,36,0.9)'; fc.fill()
        fc.strokeStyle = 'rgba(251,191,36,0.4)'; fc.lineWidth = 2; fc.stroke()
      })
    }
    setTimeout(setup, 100)
  }, [])

  // Scroll fade-up observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Counter animation
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll<HTMLElement>('.stat-num[data-target]').forEach((el) => {
        const target = parseInt(el.dataset.target || '0')
        const suffix = el.dataset.suffix || ''
        let current = 0
        const step = target / 60
        const interval = setInterval(() => {
          current = Math.min(current + step, target)
          el.textContent = Math.round(current) + (target === 89 ? '%' : suffix)
          if (current >= target) clearInterval(interval)
        }, 20)
      })
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const problems = [
    { name: 'Two Sum', diff: 'Easy', tag: 'Arrays · Hash Map', pct: 78, status: 'Due today', statusClass: 'text-green-400' },
    { name: 'LRU Cache', diff: 'Hard', tag: 'Linked List · Design', pct: 43, status: 'Due today', statusClass: 'text-green-400' },
    { name: 'Merge Intervals', diff: 'Medium', tag: 'Sorting · Intervals', pct: 91, status: 'In 4 days', statusClass: 'text-slate-500' },
    { name: 'Word Break', diff: 'Medium', tag: 'DP · String', pct: 61, status: 'Due today', statusClass: 'text-green-400' },
    { name: 'Coin Change', diff: 'Medium', tag: 'DP · BFS', pct: 85, status: 'In 2 days', statusClass: 'text-slate-500' },
    { name: 'Trapping Rain Water', diff: 'Hard', tag: 'Two Pointers', pct: 35, status: 'Overdue!', statusClass: 'text-green-400' },
  ]

  const diffClass: Record<string, string> = {
    Easy: 'bg-green-500/10 text-green-400 border border-green-500/20',
    Medium: 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20',
    Hard: 'bg-red-500/10 text-red-400 border border-red-500/20',
  }

  const features = [
    { icon: '🔬', title: 'FSRS Algorithm', desc: 'More accurate than streaks or intervals. Tracks Stability and Retrievability independently per problem using state-of-the-art spaced repetition science.' },
    { icon: '⚡', title: 'Zero Friction', desc: 'Two questions after each solve. No manual logging, no complicated setup, no spreadsheets. Works silently in the background.' },
    { icon: '🎯', title: 'Honest Tracking', desc: 'Self-reported hint usage gives more accurate data than automated scraping. Know exactly how well you really solved each problem.' },
    { icon: '🧠', title: 'Smart Reviews', desc: 'Only shows you problems when your memory is actually fading. Not before, not after. The perfect moment — every time.' },
  ]

  return (
    <>
      {/* Global styles for animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        body { font-family: 'Space Grotesk', sans-serif; }
        .font-mono-jet { font-family: 'JetBrains Mono', monospace; }
        .orb { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
        .orb1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%); top: -100px; left: -100px; animation: floatOrb 12s ease-in-out infinite; }
        .orb2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%); top: 40%; right: -80px; animation: floatOrb 16s ease-in-out infinite reverse; }
        .orb3 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%); bottom: 10%; left: 30%; animation: floatOrb 10s ease-in-out infinite 4s; }
        @keyframes floatOrb { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,40px); } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.8); } }
        @keyframes sheen { 0%,100% { left:-60%; } 50% { left:120%; } }
        .badge-dot { animation: pulse 2s ease-in-out infinite; }
        .btn-sheen { position: relative; overflow: hidden; }
        .btn-sheen::after { content:''; position:absolute; top:-50%; left:-60%; width:40%; height:200%; background:rgba(255,255,255,0.12); transform:skewX(-20deg); animation:sheen 4s ease-in-out infinite 2s; }
        .fade-up { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .card-top-line::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,#3b82f6,transparent); }
        .feat-left-bar::before { content:''; position:absolute; top:0; left:0; width:3px; height:100%; background:#3b82f6; border-radius:2px 0 0 2px; }
      `}</style>

      {/* Background canvas */}
      <canvas ref={bgCanvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />

      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Glow orbs */}
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />

      <div className="relative z-10 min-h-screen bg-[#04070f] text-slate-200 overflow-x-hidden">

        {/* NAV */}
        <nav className="flex justify-between items-center px-8 md:px-12 py-5 border-b border-blue-500/15 backdrop-blur-md sticky top-0 z-50 bg-[#04070f]/70">
          <div className="flex items-center gap-3 text-xl font-bold tracking-tight">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold text-white font-mono-jet">
              {'</>'}
            </div>
            DSA Shadow
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-slate-500 hover:text-slate-200 border border-transparent hover:border-blue-500/30 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200">
              Sign In
            </Link>
            <Link href="/login" className="bg-blue-500 hover:bg-blue-600 border border-blue-400/40 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_25px_rgba(59,130,246,0.35)] relative overflow-hidden">
              <span className="relative z-10">Get Started</span>
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <div className="fade-up max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-8 font-mono-jet">
            <span className="badge-dot w-1.5 h-1.5 rounded-full bg-blue-500" />
            Spaced Repetition · FSRS Algorithm
          </div>
          <h1 className="text-[clamp(48px,7vw,80px)] font-bold leading-[1.05] tracking-[-2px] mb-6">
            Stop grinding.<br />
            <em className="not-italic text-blue-400 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-blue-500 after:to-transparent">
              Start retaining.
            </em>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto mb-12">
            DSA Shadow tracks every problem you solve and uses the FSRS algorithm to tell you exactly when your memory is fading — so you review at the perfect moment.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/login" className="btn-sheen bg-blue-500 text-white border border-blue-400/40 px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(59,130,246,0.35)]">
              Start Tracking Free →
            </Link>
            <Link href="#how" className="bg-transparent text-slate-200 border border-blue-500/30 hover:bg-blue-500/8 px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-200">
              See How It Works
            </Link>
          </div>
          <p className="font-mono-jet text-sm text-slate-500 mt-4">// No credit card required · Free forever plan</p>
        </div>

        {/* CURVE CHART */}
        <div className="fade-up max-w-4xl mx-auto px-6 pb-20">
          <div className="card-top-line relative bg-[#080d1a] border border-blue-500/15 rounded-2xl p-6 overflow-hidden">
            <div className="flex justify-between text-xs font-mono-jet text-slate-500 mb-4">
              <span>memory_retention_curve.fsrs</span>
              <span className="text-blue-400">● LIVE</span>
            </div>
            <canvas ref={curveChartRef} className="w-full" style={{ height: '180px' }} />
          </div>
        </div>

        {/* STATS */}
        <div className="fade-up max-w-4xl mx-auto px-6 mb-20">
          <div className="flex border border-blue-500/15 rounded-2xl overflow-hidden bg-[#080d1a] max-w-2xl mx-auto">
            {[
              { num: '0', target: '89', suffix: '', label: 'Avg retention rate' },
              { num: '0x', target: '3', suffix: 'x', label: 'Less review time' },
              { num: '0+', target: '2400', suffix: '+', label: 'Problems tracked' },
            ].map((s, i) => (
              <div key={i} className={`flex-1 py-7 px-5 text-center ${i < 2 ? 'border-r border-blue-500/15' : ''}`}>
                <span
                  className="stat-num block text-4xl font-bold text-blue-400 tracking-tight font-mono-jet"
                  data-target={s.target}
                  data-suffix={s.suffix}
                >{s.num}</span>
                <div className="text-slate-500 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div id="how" className="fade-up max-w-4xl mx-auto px-6 py-20 border-t border-blue-500/10">
          <div className="font-mono-jet text-xs text-blue-500 tracking-[2px] uppercase mb-3">// process</div>
          <div className="text-[clamp(28px,4vw,42px)] font-bold tracking-tight mb-12">
            How it works <span className="text-slate-500 font-normal">— in 3 steps</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-blue-500/15 border border-blue-500/15 rounded-2xl overflow-hidden">
            {[
              { step: '01 — SOLVE', icon: '⚡', title: 'Solve on LeetCode', desc: 'Solve problems normally on LeetCode. Our Chrome extension watches in the background — zero disruption to your flow.' },
              { step: '02 — REPORT', icon: '📊', title: 'Self Report', desc: 'A small popup asks: did you use hints? How did it feel? Two taps, done. Honest data beats automated scraping every time.' },
              { step: '03 — REVIEW', icon: '🧠', title: 'We Handle the Rest', desc: 'FSRS calculates exactly when each problem needs revisiting. Open the dashboard to see what\'s due today.' },
            ].map((s) => (
              <div key={s.step} className="bg-[#080d1a] hover:bg-[#0d1526] transition-colors duration-300 p-8">
                <div className="font-mono-jet text-[11px] text-blue-500 font-bold tracking-[1px] mb-5">{s.step}</div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-2xl mb-5">{s.icon}</div>
                <h3 className="text-[17px] font-semibold tracking-tight mb-2.5">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ALGORITHM */}
        <div className="fade-up max-w-4xl mx-auto px-6 pb-20">
          <div className="font-mono-jet text-xs text-blue-500 tracking-[2px] uppercase mb-3">// algorithm</div>
          <div className="text-[clamp(28px,4vw,42px)] font-bold tracking-tight mb-8">
            Powered by FSRS <span className="text-slate-500 font-normal">— not guesswork</span>
          </div>
          <div className="card-top-line relative bg-[#080d1a] border border-blue-500/15 rounded-2xl p-8 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <h3 className="text-2xl font-bold tracking-tight mb-3">Stability &amp; Retrievability</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">
                  Unlike simple streak-based systems, FSRS models two independent variables per problem — how stable the memory is, and how retrievable it is right now. Reviews trigger only when retrievability drops below your threshold.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="font-mono-jet text-xs px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">Stability</span>
                  <span className="font-mono-jet text-xs px-3.5 py-1.5 rounded-full bg-green-500/8 border border-green-500/25 text-green-400">Retrievability</span>
                  <span className="font-mono-jet text-xs px-3.5 py-1.5 rounded-full bg-yellow-400/8 border border-yellow-400/25 text-yellow-400">Optimal Review</span>
                </div>
              </div>
              <canvas ref={fsrsChartRef} className="w-full" style={{ height: '160px' }} />
            </div>
          </div>
        </div>

        {/* PROBLEM CARDS */}
        <div className="fade-up max-w-4xl mx-auto px-6 pb-20">
          <div className="font-mono-jet text-xs text-blue-500 tracking-[2px] uppercase mb-3">// dashboard preview</div>
          <div className="text-[clamp(28px,4vw,42px)] font-bold tracking-tight mb-8">
            Your review queue <span className="text-slate-500 font-normal">— always up to date</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {problems.map((p) => (
              <div key={p.name} className="bg-[#080d1a] border border-blue-500/15 hover:border-blue-500/30 rounded-2xl p-4 transition-all duration-300">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-sm font-semibold">{p.name}</span>
                  <span className={`font-mono-jet text-[11px] px-2.5 py-0.5 rounded-full ${diffClass[p.diff]}`}>{p.diff}</span>
                </div>
                <div className="font-mono-jet text-[11px] text-slate-500 mb-2.5">// {p.tag}</div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-400" style={{ width: `${p.pct}%` }} />
                </div>
                <div className="flex justify-between mt-2 font-mono-jet text-[11px] text-slate-500">
                  <span>{p.pct}% retention</span>
                  <span className={p.statusClass}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <div className="fade-up max-w-4xl mx-auto px-6 pb-20">
          <div className="font-mono-jet text-xs text-blue-500 tracking-[2px] uppercase mb-3">// why shadow</div>
          <div className="text-[clamp(28px,4vw,42px)] font-bold tracking-tight mb-8">
            Built different <span className="text-slate-500 font-normal">— here&apos;s why</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((f) => (
              <div key={f.title} className="feat-left-bar relative bg-[#080d1a] border border-blue-500/15 hover:border-blue-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-[9px] bg-blue-500/12 border border-blue-500/30 flex items-center justify-center text-base">{f.icon}</div>
                  <h3 className="text-[15px] font-semibold">{f.title}</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="fade-up max-w-4xl mx-auto px-6 mb-20">
          <div className="card-top-line relative bg-[#080d1a] border border-blue-500/15 rounded-3xl px-12 py-16 text-center overflow-hidden"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 70%), #080d1a' }}>
            <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-1.5px] mb-4">
              Ready to actually retain<br />what you learn?
            </h2>
            <p className="text-slate-500 text-base mb-9">Free to use. No credit card. Built for engineers who want to stop re-learning the same things.</p>
            <Link href="/login" className="btn-sheen inline-block bg-blue-500 text-white border border-blue-400/40 px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(59,130,246,0.35)]">
              Get Started — It&apos;s Free →
            </Link>
            <p className="font-mono-jet text-sm text-slate-500 mt-4">// Built by Rishi Jain</p>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="border-t border-blue-500/15 px-8 md:px-12 py-7 flex justify-between items-center text-sm text-slate-600">
          <span className="font-semibold text-slate-200">DSA Shadow</span>
          <span><code className="font-mono-jet text-xs">v1.0.0</code> · Built by Rishi Jain</span>
        </footer>

      </div>
    </>
  )
}