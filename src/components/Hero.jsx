import Spline from '@splinetool/react-spline'

export default function Hero() {
  return (
    <section className="relative h-[70vh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/2fSS9b44gtYBt4RI/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-6 h-full flex items-center">
        <div className="backdrop-blur-sm/30">
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow">HEMO LINK</h1>
          <p className="mt-4 text-blue-200 max-w-2xl text-lg">A unified platform for hospitals, blood banks, and donors to manage donations, inventory, emergency alerts, and intelligent assistance.</p>
          <div className="mt-8 flex gap-3">
            <a href="#auth" className="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition">Get Started</a>
            <a href="#features" className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition">Explore Features</a>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent pointer-events-none" />
    </section>
  )
}
