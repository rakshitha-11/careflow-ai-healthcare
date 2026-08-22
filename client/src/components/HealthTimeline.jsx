import { Check, Circle } from "lucide-react";

const steps = [
  ["Symptoms", "Your symptoms are securely captured"],
  ["AI Briefing", "A concise doctor-facing pre-visit view"],
  ["Consultation", "Your clinician records the visit"],
  ["Care Plan", "A simpler post-visit explanation"],
  ["Follow-up", "Medication and next-step reminders"]
];

export default function HealthTimeline({ active = 2 }) {
  return (
    <div className="space-y-5">
      {steps.map(([title, desc], i) => (
        <div className="flex gap-4" key={title}>
          <div className="mt-1">
            {i < active ? <div className="grid h-8 w-8 place-items-center rounded-full bg-violet-400 text-slate-950"><Check size={16}/></div> :
             i === active ? <div className="grid h-8 w-8 place-items-center rounded-full border border-teal-300"><div className="pulse-dot"/></div> :
             <Circle className="text-slate-600" />}
          </div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-slate-400">{desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
