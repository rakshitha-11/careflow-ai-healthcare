import { Link } from "react-router-dom";
import { CalendarDays, Search, Sparkles, Clock3 } from "lucide-react";
import Layout from "../components/Layout";
import HealthTimeline from "../components/HealthTimeline";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  return <Layout><div className="space-y-6">
    <section className="glass overflow-hidden rounded-[2rem] p-7">
      <div className="max-w-3xl"><div className="text-sm text-teal-300">Your Care Passport</div><h1 className="mt-2 text-4xl font-black">Good day, {user?.name?.split(" ")[0] || "there"}.</h1><p className="mt-3 text-slate-400">Everything important before, during and after your visit — connected in one calm timeline.</p></div>
      <div className="mt-7 flex flex-wrap gap-3"><Link to="/patient/doctors" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950"><Search className="mr-2 inline" size={17}/>Find a doctor</Link><Link to="/patient/appointments" className="rounded-xl border border-white/10 px-4 py-3 text-sm"><CalendarDays className="mr-2 inline" size={17}/>Appointments</Link></div>
    </section>
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="glass rounded-3xl p-6"><div className="mb-6 flex items-center gap-3"><Sparkles className="text-violet-300"/><h2 className="text-xl font-bold">Care Flow</h2></div><HealthTimeline/></div>
      <div className="glass rounded-3xl p-6"><div className="flex items-center justify-between"><div><div className="text-xs uppercase tracking-widest text-slate-500">Next care action</div><h2 className="mt-1 text-2xl font-bold">No appointment yet</h2></div><Clock3 className="text-teal-300"/></div><p className="mt-4 text-slate-400">Book your next consultation and CareFlow will automatically build the timeline around it.</p><Link to="/patient/doctors" className="mt-6 inline-block rounded-xl bg-violet-400 px-4 py-3 font-bold text-slate-950">Browse doctors</Link></div>
    </div>
  </div></Layout>
}
