import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartPulse } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Auth({ mode = "login" }) {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault(); setError("");
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register({ ...form, role: "patient" });
      nav("/");
    } catch (e) { setError(e.response?.data?.message || "Something went wrong"); }
  }

  return <div className="grid min-h-screen place-items-center px-5">
    <div className="glass w-full max-w-md rounded-3xl p-8">
      <div className="mb-8 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-400 text-slate-950"><HeartPulse/></div><div><b>CareFlow AI</b><div className="text-xs text-slate-500">secure care coordination</div></div></div>
      <h1 className="text-3xl font-black">{mode === "login" ? "Welcome back" : "Create your care space"}</h1>
      <p className="mt-2 text-slate-400">{mode === "login" ? "Continue your healthcare journey." : "Start managing appointments with clarity."}</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        {mode !== "login" && <input required placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-violet-300"/>}
        <input required type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-violet-300"/>
        <input required minLength="6" type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-violet-300"/>
        {error && <div className="rounded-xl bg-red-400/10 p-3 text-sm text-red-300">{error}</div>}
        <button className="w-full rounded-xl bg-white py-3 font-bold text-slate-950 hover:bg-violet-100">{mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
      <div className="mt-6 text-sm text-slate-400">{mode === "login" ? "New here? " : "Already registered? "}<Link className="text-teal-300" to={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Create an account" : "Sign in"}</Link></div>
    </div>
  </div>
}
