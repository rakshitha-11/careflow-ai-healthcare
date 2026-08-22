const router = require("express").Router();
const crypto = require("crypto");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const MedicationReminder = require("../models/MedicationReminder");
const { auth, roles } = require("../middleware/auth");
const { generatePreVisitSummary, generatePostVisitSummary } = require("../services/aiService");
const { queueNotification } = require("../services/notificationService");
const { createForBoth, deleteForBoth, updateForBoth } = require("../services/calendarService");
const { buildSlots } = require("../utils/slots");

router.use(auth);

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T00:00:00`).getTime());
}

function isOnLeave(profile, dateString) {
  return (profile.leaveDays || []).some(d => new Date(d).toISOString().slice(0, 10) === dateString);
}

async function validateSlot({ doctorId, appointmentDate, startTime, endTime }) {
  if (!isValidDate(appointmentDate)) throw Object.assign(new Error("Invalid appointment date"), { status: 400 });
  const today = new Date(); today.setHours(0,0,0,0);
  const requested = new Date(`${appointmentDate}T00:00:00`);
  if (requested < today) throw Object.assign(new Error("Appointment date cannot be in the past"), { status: 400 });

  const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
  if (!doctor) throw Object.assign(new Error("Doctor not found"), { status: 404 });
  const profile = await DoctorProfile.findOne({ userId: doctorId });
  if (!profile) throw Object.assign(new Error("Doctor profile not found"), { status: 404 });
  if (isOnLeave(profile, appointmentDate)) throw Object.assign(new Error("Doctor is on leave on this date"), { status: 409 });

  const day = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][requested.getDay()];
  const hours = profile.workingHours?.[day];
  if (!hours?.enabled) throw Object.assign(new Error("Doctor is not available on this day"), { status: 409 });
  const valid = buildSlots(hours.start, hours.end, Number(profile.slotDuration) || 30).some(s => s.startTime === startTime && s.endTime === endTime);
  if (!valid) throw Object.assign(new Error("Selected slot is outside the doctor's working hours"), { status: 409 });
  return { doctor, profile };
}

router.post("/hold", roles("patient"), async (req, res) => {
  const { doctorId, appointmentDate, startTime, endTime } = req.body;
  try {
    await validateSlot({ doctorId, appointmentDate, startTime, endTime });
    const existing = await Appointment.findOne({
      doctorId, appointmentDate, startTime,
      status: { $in: ["HELD", "CONFIRMED", "COMPLETED"] },
      $or: [{ status: { $ne: "HELD" } }, { holdExpiresAt: { $gt: new Date() } }]
    });
    if (existing) return res.status(409).json({ message: "Slot is no longer available" });

    const holdToken = crypto.randomUUID();
    const appointment = await Appointment.create({
      patientId: req.user._id, doctorId, appointmentDate, startTime, endTime,
      status: "HELD", holdToken, holdExpiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });
    res.status(201).json({ appointmentId: appointment._id, holdToken, expiresAt: appointment.holdExpiresAt });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "Slot was booked by another patient" });
    res.status(e.status || 400).json({ message: e.message });
  }
});

router.post("/", roles("patient"), async (req, res) => {
  const { doctorId, appointmentDate, startTime, endTime, symptoms, holdToken, appointmentId } = req.body;
  try {
    const { doctor } = await validateSlot({ doctorId, appointmentDate, startTime, endTime });
    let appointment = holdToken
      ? await Appointment.findOne({ _id: appointmentId, holdToken, patientId: req.user._id, status: "HELD", holdExpiresAt: { $gt: new Date() } })
      : null;

    if (appointment) {
      appointment.status = "CONFIRMED";
      appointment.symptoms = symptoms || "";
      appointment.holdToken = undefined;
      appointment.holdExpiresAt = undefined;
      await appointment.save();
    } else {
      appointment = await Appointment.create({
        patientId: req.user._id, doctorId, appointmentDate, startTime, endTime,
        status: "CONFIRMED", symptoms: symptoms || ""
      });
    }

    try { appointment.preVisitSummary = await generatePreVisitSummary(symptoms || ""); }
    catch { appointment.preVisitSummary = { urgencyLevel: "Not Available", chiefComplaint: "AI summary unavailable", suggestedQuestions: [] }; }
    await appointment.save();

    const patient = req.user;
    await queueNotification(patient._id, "BOOKING_CONFIRMATION", "CareFlow appointment confirmed",
      `Your appointment with ${doctor.name} is confirmed for ${appointmentDate} at ${startTime}.`);
    await queueNotification(doctor._id, "NEW_APPOINTMENT", "New CareFlow appointment",
      `${patient.name} booked an appointment for ${appointmentDate} at ${startTime}.`);
    await createForBoth(appointment);
    res.status(201).json({ appointment });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "This slot was just booked by another patient" });
    res.status(e.status || 400).json({ message: e.message });
  }
});

router.get("/", async (req, res, next) => {
  try {
    const filter = req.user.role === "patient" ? { patientId: req.user._id } : req.user.role === "doctor" ? { doctorId: req.user._id } : {};
    const items = await Appointment.find(filter).populate("patientId", "name email").populate("doctorId", "name email").sort({ appointmentDate: 1, startTime: 1 });
    res.json(items);
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate("patientId", "name email").populate("doctorId", "name email");
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    const owns = req.user.role === "admin" || String(appointment.patientId?._id || appointment.patientId) === String(req.user._id) || String(appointment.doctorId?._id || appointment.doctorId) === String(req.user._id);
    if (!owns) return res.status(403).json({ message: "Not allowed" });
    res.json(appointment);
  } catch (e) { next(e); }
});

router.post("/:id/cancel", async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    const allowed = req.user.role === "admin" || String(appointment.patientId) === String(req.user._id) || String(appointment.doctorId) === String(req.user._id);
    if (!allowed) return res.status(403).json({ message: "Not allowed" });
    if (["CANCELLED", "CANCELLED_BY_LEAVE", "COMPLETED"].includes(appointment.status)) return res.status(409).json({ message: "Appointment cannot be cancelled" });
    appointment.status = "CANCELLED";
    appointment.holdToken = undefined;
    appointment.holdExpiresAt = undefined;
    await appointment.save();
    await deleteForBoth(appointment);
    const [patient, doctor] = await Promise.all([User.findById(appointment.patientId), User.findById(appointment.doctorId)]);
    if (patient) await queueNotification(patient._id, "CANCELLATION", "CareFlow appointment cancelled", `Your appointment on ${appointment.appointmentDate} at ${appointment.startTime} has been cancelled.`);
    if (doctor) await queueNotification(doctor._id, "CANCELLATION", "CareFlow appointment cancelled", `The appointment on ${appointment.appointmentDate} at ${appointment.startTime} has been cancelled.`);
    res.json(appointment);
  } catch (e) { next(e); }
});

router.post("/:id/reschedule", async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  const allowed = req.user.role === "admin" || String(appointment.patientId) === String(req.user._id) || String(appointment.doctorId) === String(req.user._id);
  if (!allowed) return res.status(403).json({ message: "Not allowed" });
  if (appointment.status !== "CONFIRMED") return res.status(409).json({ message: "Only confirmed appointments can be rescheduled" });
  try {
    const { appointmentDate, startTime, endTime } = req.body;
    await validateSlot({ doctorId: appointment.doctorId, appointmentDate, startTime, endTime });
    const conflict = await Appointment.findOne({ _id:{ $ne:appointment._id }, doctorId:appointment.doctorId, appointmentDate, startTime, status:{ $in:["HELD","CONFIRMED","COMPLETED"] }, $or:[{status:{$ne:"HELD"}},{holdExpiresAt:{$gt:new Date()}}] });
    if (conflict) return res.status(409).json({ message:"New slot is not available" });
    appointment.appointmentDate=appointmentDate;appointment.startTime=startTime;appointment.endTime=endTime;
    await appointment.save(); await updateForBoth(appointment);
    res.json(appointment);
  } catch(e) { if(e.code===11000)return res.status(409).json({message:"New slot was just booked by another patient"});res.status(e.status||400).json({message:e.message}); }
});

router.post("/:id/previsit-summary", roles("patient"), async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, patientId: req.user._id });
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  appointment.symptoms = req.body.symptoms || appointment.symptoms;
  try { appointment.preVisitSummary = await generatePreVisitSummary(appointment.symptoms); }
  catch { appointment.preVisitSummary = { urgencyLevel: "Not Available", chiefComplaint: "AI summary unavailable", suggestedQuestions: [] }; }
  await appointment.save();
  res.json(appointment.preVisitSummary);
});

function reminderInterval(frequency) {
  const f = String(frequency || "").toLowerCase();
  if (/once.*day|daily|1.*day/.test(f)) return 24;
  if (/twice|2.*day|12.*hour/.test(f)) return 12;
  if (/three|3.*day|8.*hour/.test(f)) return 8;
  if (/four|4.*day|6.*hour/.test(f)) return 6;
  if (/weekly|once.*week/.test(f)) return 24 * 7;
  return 12;
}

router.post("/:id/consultation", roles("doctor"), async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, doctorId: req.user._id });
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  appointment.doctorNotes = req.body.doctorNotes || "";
  appointment.prescription = Array.isArray(req.body.prescription) ? req.body.prescription : [];
  appointment.status = "COMPLETED";
  try { appointment.postVisitSummary = await generatePostVisitSummary(appointment.doctorNotes, appointment.prescription); }
  catch { appointment.postVisitSummary = `Your doctor recorded: ${appointment.doctorNotes || "No notes provided."}`; }
  await appointment.save();

  await MedicationReminder.deleteMany({ appointmentId: appointment._id });
  for (const p of appointment.prescription) {
    if (!p.medication) continue;
    await MedicationReminder.create({
      appointmentId: appointment._id, patientId: appointment.patientId,
      medicationName: p.medication, dosage: p.dosage || "As prescribed", frequency: p.frequency || "As prescribed",
      nextReminderAt: new Date(Date.now() + reminderInterval(p.frequency) * 60 * 60 * 1000), active: true
    });
  }
  await queueNotification(appointment.patientId, "POST_VISIT", "Your CareFlow visit summary", appointment.postVisitSummary);
  res.json(appointment);
});

router.post("/:id/postvisit-summary", roles("doctor"), async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, doctorId: req.user._id });
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  try { appointment.postVisitSummary = await generatePostVisitSummary(appointment.doctorNotes, appointment.prescription); }
  catch { appointment.postVisitSummary = "Your patient-friendly summary is temporarily unavailable."; }
  await appointment.save();
  res.json({ summary: appointment.postVisitSummary });
});

module.exports = router;
