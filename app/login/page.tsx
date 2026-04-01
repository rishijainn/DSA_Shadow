'use client'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
    const handleGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${location.origin}/dashboard` }
        })
    }

    const handleEmail = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const email = (form.elements.namedItem('email') as HTMLInputElement).value
        const password = (form.elements.namedItem('password') as HTMLInputElement).value
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) alert(error.message)
        else window.location.href = '/dashboard'
    }

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const email = (form.elements.namedItem('email') as HTMLInputElement).value
        const password = (form.elements.namedItem('password') as HTMLInputElement).value
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) alert(error.message)
        else alert('Check your email to confirm signup!')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md space-y-6">
                <h1 className="text-3xl font-bold text-white text-center">DSA Shadow</h1>
                <p className="text-gray-400 text-center">Track your real LeetCode progress</p>

                <button
                    onClick={handleGoogle}
                    className="w-full bg-white text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-100 transition"
                >
                    Continue with Google
                </button>

                <div className="text-center text-gray-500 text-sm">or</div>

                <form onSubmit={handleEmail} className="space-y-4">
                    <input name="email" type="email" placeholder="Email" required
                        className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    <input name="password" type="password" placeholder="Password" required
                        className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="submit"
                        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition">
                        Sign In
                    </button>
                    <button type="button" onClick={(e) => handleSignUp(e as any)}
                        className="w-full bg-gray-700 text-white font-semibold py-3 rounded-xl hover:bg-gray-600 transition">
                        Create Account
                    </button>
                </form>
            </div>
        </div>
    )
}