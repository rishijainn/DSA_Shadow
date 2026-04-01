import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-5 border-b border-gray-800">
        <h1 className="text-xl font-bold text-blue-400">DSA Shadow</h1>
        <div className="flex gap-3">
          <Link href="/login"
            className="text-gray-400 hover:text-white transition px-4 py-2 text-sm">
            Sign In
          </Link>
          <Link href="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-block bg-blue-950 border border-blue-800 text-blue-400 text-sm px-4 py-1.5 rounded-full mb-6 font-medium">
          Spaced Repetition for LeetCode
        </div>
        <h1 className="text-5xl font-bold mb-6 leading-tight">
          Stop grinding.<br />
          <span className="text-blue-400">Start retaining.</span>
        </h1>
        <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
          DSA Shadow tracks every problem you solve and tells you exactly when to revisit it — so you never forget what you learned.
        </p>
        <Link href="/login"
          className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition inline-block">
          Start Tracking Free
        </Link>
      </div>

      {/* How it works */}
      <div className="max-w-4xl mx-auto px-6 py-16 border-t border-gray-800">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Solve on LeetCode',
              desc: 'Solve problems normally on LeetCode. Our Chrome extension watches in the background.'
            },
            {
              step: '02',
              title: 'Self Report',
              desc: 'After each solve a small popup asks: did you use hints? How did it feel? Two taps, done.'
            },
            {
              step: '03',
              title: 'We handle the rest',
              desc: 'Our FSRS algorithm calculates exactly when you need to revisit each problem. Open the dashboard to see what is due.'
            },
          ].map(item => (
            <div key={item.step} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="text-blue-400 font-bold text-sm mb-3">{item.step}</div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-6 py-16 border-t border-gray-800">
        <h2 className="text-3xl font-bold text-center mb-12">Why DSA Shadow</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'FSRS Algorithm', desc: 'More accurate than simple streaks. Tracks Stability and Retrievability per problem.' },
            { title: 'Zero Friction', desc: 'Two questions after each solve. No manual logging, no complicated setup.' },
            { title: 'Honest Tracking', desc: 'Self reported hint usage gives more accurate data than automated scraping.' },
            { title: 'Smart Reviews', desc: 'Only shows you problems when your memory is actually fading. Not before, not after.' },
          ].map(f => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex gap-4">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 py-16 border-t border-gray-800 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to actually retain what you learn?</h2>
        <p className="text-gray-400 mb-8">Free to use. No credit card required.</p>
        <Link href="/login"
          className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition inline-block">
          Get Started
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-8 py-6 text-center text-gray-600 text-sm">
        Built by Rishi Jain
      </footer>

    </div>
  )
}