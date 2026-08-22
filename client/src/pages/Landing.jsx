import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, BrainCircuit, BellRing, ShieldCheck } from "lucide-react";

export default function Landing() {
  return <div className="min-h-screen">
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6">
      <div className="font-black text-xl">CareFlow <span className="text-teal-300">AI</span></div>
      <div className="flex gap-3"><Link to="/login" className="rounded-xl px-4 py-2 text-sm text-slate-300">Sign in</Link><Link to="/register" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">Get started</Link></div>
    </nav>
    <section className="mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-14 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
      <div>
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/5 px-3 py-2 text-xs text-teal-200"><div className="pulse-dot"/> one connected care journey</div>
        <h1 className="text-5xl font-black leading-[1.02] sm:text-7xl">Healthcare that <span className="gradient-text">flows with you.</span></h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">Book care, share symptoms before your visit, give doctors a focused briefing, understand your care plan afterwards, and keep every next step in one timeline.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link to="/register" className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-950">Start your care flow <ArrowRight size={18}/></Link><a href="#features" className="rounded-2xl border border-white/10 px-5 py-3 text-slate-300">Explore</a></div>
      </div>
      <div className="glass rounded-[2rem] p-6">
        <div className="mb-6 flex items-center justify-between"><div><div className="text-xs uppercase tracking-widest text-slate-500">Care Passport</div><div className="mt-1 text-xl font-bold">Today's journey</div></div><ShieldCheck className="text-teal-300"/></div>
        {["Symptoms submitted","AI briefing ready","Dr. Sharma · 10:30 AM","Care plan after visit","Medication reminder"].map((x,i)=><div key={x} className="flex items-center gap-4 border-l border-violet-300/30 py-4 pl-5"><div className={`h-3 w-3 rounded-full ${i<2 ? "bg-teal-300 shadow-[0_0_16px_#5eead4]" : "bg-slate-700"}`}/><div><div className="font-semibold">{x}</div><div className="text-xs text-slate-500">{i<2 ? "completed" : "next in your flow"}</div></div></div>)}
      </div>
    </section>
    <section id="features" className="mx-auto grid max-w-7xl gap-4 px-5 pb-20 md:grid-cols-4">
      {[[CalendarCheck,"Smart booking","Concurrency-safe slots and conflict handling."],[BrainCircuit,"Doctor briefing","AI turns raw symptoms into a focused pre-visit view."],[BellRing,"Care reminders","Email and medication reminders keep the journey moving."],[ShieldCheck,"Role-aware","Patient, doctor and admin experiences are separated."]].map(([Icon,title,text])=><div className="glass rounded-3xl p-5" key={title}><Icon className="text-violet-300"/><h3 className="mt-5 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div>)}
    </section>
  </div>
}
