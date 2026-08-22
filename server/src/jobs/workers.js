const Appointment = require("../models/Appointment");
const MedicationReminder = require("../models/MedicationReminder");
const User = require("../models/User");
const { processNotifications, queueNotification } = require("../services/notificationService");

function intervalHours(frequency) {
  const f = String(frequency || "").toLowerCase();
  if (/weekly|once.*week/.test(f)) return 168;
  if (/daily|once.*day|1.*day/.test(f)) return 24;
  if (/twice|2.*day|12.*hour/.test(f)) return 12;
  if (/three|3.*day|8.*hour/.test(f)) return 8;
  if (/four|4.*day|6.*hour/.test(f)) return 6;
  return 12;
}

async function processAppointmentReminders() {
  const now = new Date();
  const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const items = await Appointment.find({ status:"CONFIRMED", appointmentDate:{ $gte:now.toISOString().slice(0,10), $lte:end.toISOString().slice(0,10) } });
  for (const a of items) {
    const appointmentAt = new Date(`${a.appointmentDate}T${a.startTime}:00`);
    const minutes = (appointmentAt - now) / 60000;
    if (minutes >= 55 && minutes <= 65) {
      const already = await require("../models/Notification").findOne({ recipient:a.patientId, type:"APPOINTMENT_REMINDER", message:{ $regex:`${a.appointmentDate}.*${a.startTime}` } });
      if (!already) await queueNotification(a.patientId, "APPOINTMENT_REMINDER", "CareFlow appointment reminder", `Reminder: your appointment is scheduled for ${a.appointmentDate} at ${a.startTime}.`);
    }
  }
}

function startWorkers() {
  setInterval(async () => {
    try {
      await Appointment.deleteMany({ status:"HELD", holdExpiresAt:{ $lte:new Date() } });
      await processNotifications();
      await processAppointmentReminders();
      const reminders = await MedicationReminder.find({ active:true, nextReminderAt:{ $lte:new Date() } }).limit(50);
      for (const r of reminders) {
        const patient = await User.findById(r.patientId);
        if (patient) await queueNotification(r.patientId, "MEDICATION_REMINDER", `Medication reminder: ${r.medicationName}`, `Reminder to take ${r.medicationName} (${r.dosage}) according to your prescription frequency: ${r.frequency}.`);
        r.lastSentAt = new Date();
        r.nextReminderAt = new Date(Date.now() + intervalHours(r.frequency) * 60 * 60 * 1000);
        await r.save();
      }
    } catch(e) { console.error("Worker error:", e.message); }
  }, 60 * 1000);
}
module.exports = startWorkers;
