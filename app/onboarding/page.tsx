'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
    const [step, setStep] = useState(1)
    const [commitment, setCommitment] = useState(3)
    const [level, setLevel] = useState('')
    const [username, setUsername] = useState('')
    const [notifTime, setNotifTime] = useState('20:00')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

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
                notification_time: notifTime
            })
        })

        router.push('/dashboard')
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-800">

                {/* Progress dots */}
                <div className="flex gap-2 justify-center mb-8">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`h-2 rounded-full transition-all ${s === step ? 'w-8 bg-blue-500' : s < step ? 'w-2 bg-blue-500' : 'w-2 bg-gray-700'}`} />
                    ))}
                </div>

                {/* Step 1 — Commitment */}
                {step === 1 && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">How many problems can you solve daily?</h2>
                        <p className="text-gray-400 mb-8 text-sm">Be honest — consistency beats quantity every time.</p>
                        <div className="grid grid-cols-5 gap-3 mb-8">
                            {[1, 2, 3, 4, 5].map(n => (
                                <button key={n} onClick={() => setCommitment(n)}
                                    className={`py-4 rounded-xl font-bold text-lg transition ${commitment === n ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                                    {n}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setStep(2)}
                            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition">
                            Continue
                        </button>
                    </div>
                )}

                {/* Step 2 — Level */}
                {step === 2 && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">How comfortable are you with DSA?</h2>
                        <p className="text-gray-400 mb-8 text-sm">We'll suggest problems based on this. You can always change it later.</p>
                        <div className="space-y-3 mb-8">
                            {[
                                { value: 'beginner', label: '🌱 Beginner', desc: 'Just starting out, learning the basics' },
                                { value: 'intermediate', label: '⚡ Intermediate', desc: 'Comfortable with Easy, solving Mediums' },
                                { value: 'advanced', label: '🔥 Advanced', desc: 'Solving Mediums and Hards consistently' },
                            ].map(l => (
                                <button key={l.value} onClick={() => setLevel(l.value)}
                                    className={`w-full p-4 rounded-xl text-left transition border ${level === l.value ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}>
                                    <div className="font-semibold">{l.label}</div>
                                    <div className="text-sm opacity-70 mt-1">{l.desc}</div>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setStep(1)}
                                className="flex-1 bg-gray-800 text-gray-400 font-semibold py-3 rounded-xl hover:bg-gray-700 transition">
                                Back
                            </button>
                            <button onClick={() => level && setStep(3)} disabled={!level}
                                className="flex-2 flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-40">
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3 — LeetCode Username */}
                {step === 3 && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Connect your LeetCode account</h2>
                        <p className="text-gray-400 mb-8 text-sm">Optional — we use this to never suggest problems you've already solved.</p>
                        <input
                            type="text"
                            placeholder="Your LeetCode username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                        />
                        <p className="text-gray-500 text-xs mb-8">Leave empty to skip</p>
                        <div className="flex gap-3">
                            <button onClick={() => setStep(2)}
                                className="flex-1 bg-gray-800 text-gray-400 font-semibold py-3 rounded-xl hover:bg-gray-700 transition">
                                Back
                            </button>
                            <button onClick={() => setStep(4)}
                                className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition">
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4 — Notification Time */}
                {step === 4 && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">When should we remind you?</h2>
                        <p className="text-gray-400 mb-8 text-sm">We'll send a gentle nudge if you haven't solved today's problems yet.</p>
                        <input
                            type="time"
                            value={notifTime}
                            onChange={e => setNotifTime(e.target.value)}
                            className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 mb-8"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setStep(3)}
                                className="flex-1 bg-gray-800 text-gray-400 font-semibold py-3 rounded-xl hover:bg-gray-700 transition">
                                Back
                            </button>
                            <button onClick={handleFinish} disabled={loading}
                                className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-40">
                                {loading ? 'Setting up...' : "Let's go 🚀"}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}