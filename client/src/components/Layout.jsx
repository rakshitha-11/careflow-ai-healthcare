import { Link, useLocation } from "react-router-dom";
import { CalendarDays, HeartPulse, LogOut, Stethoscope, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = user?.role === "patient"
    ? [["/patient", "Overview", HeartPulse], ["/patient/doctors", "Find a doctor", Stethoscope], ["/patient/appointments", "Appointments", CalendarDays]]
    : user?.role === "doctor"
      ? [["/doctor", "Overview", HeartPulse], ["/doctor/appointments", "Appointments", CalendarDays]]
      : [["/admin", "Clinic overview", Users]];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b16]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-teal-300 text-slate-950"><HeartPulse size={21}/></div>
            <div><div className="font-black tracking-tight">CareFlow <span className="text-teal-300">AI</span></div><div className="text-[10px] uppercase tracking-[.25em] text-slate-500">health timeline</div></div>
          </Link>
          {user && <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><div className="text-sm font-semibold">{user.name}</div><div className="text-xs text-slate-500">{user.role}</div></div>
            <button onClick={logout} className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/5"><LogOut size={17}/></button>
          </div>}
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-6 px-5 py-6">
        {user && <aside className="hidden w-52 shrink-0 space-y-2 lg:block">
          {links.map(([to, label, Icon]) => <Link key={to} to={to} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${location.pathname === to ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5"}`}><Icon size={17}/>{label}</Link>)}
        </aside>}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
