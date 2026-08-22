const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const Appointment = require("../models/Appointment");
const { auth, roles } = require("../middleware/auth");
const { queueNotification } = require("../services/notificationService");

router.use(auth, roles("admin"));

router.get("/doctors", async (req, res) => {
  const doctors = await User.find({ role: "doctor" }).select("-password").sort({ name: 1 });
  const profiles = await DoctorProfile.find({ userId: { $in: doctors.map(d => d._id) } });
  res.json(doctors.map(user => ({ user, profile: profiles.find(p => String(p.userId) === String(user._id)) || null })));
});

router.post("/doctors", async (req, res) => {
  try {
    const { name, email, password, specialization, qualification, experience, consultationFee, slotDuration, workingHours, bio } = req.body;
    if (!name || !email || !specialization) return res.status(400).json({ message: "Name, email and specialization are required" });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: "Email already registered" });
    const hash = await bcrypt.hash(password || "ChangeMe123!", 12);
    const user = await User.create({ name, email: email.toLowerCase(), password: hash, role: "doctor" });
    const d = { start: "09:00", end: "17:00", enabled: true };
    const off = { start: "09:00", end: "13:00", enabled: false };
    const defaultHours = { monday:d, tuesday:d, wednesday:d, thursday:d, friday:d, saturday:off, sunday:off };
    const profile = await DoctorProfile.create({ userId:user._id, specialization, qualification, experience:Number(experience)||0, consultationFee:Number(consultationFee)||0, slotDuration:Number(slotDuration)||30, workingHours:workingHours || defaultHours, bio });
    res.status(201).json({ user:{ id:user._id, name:user.name, email:user.email, role:user.role }, profile });
  } catch(e) { res.status(400).json({ message:e.message }); }
});

router.post("/doctors/:doctorId/leave", async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ message: "Date is required" });
  const profile = await DoctorProfile.findOne({ userId: req.params.doctorId });
  if (!profile) return res.status(404).json({ message: "Doctor profile not found" });
  const exists = (profile.leaveDays || []).some(d => new Date(d).toISOString().slice(0,10) === date);
  if (!exists) { profile.leaveDays.push(new Date(`${date}T00:00:00`)); await profile.save(); }
  const affected = await Appointment.find({ doctorId:req.params.doctorId, appointmentDate:date, status:{ $in:["HELD","CONFIRMED"] } });
  for (const appointment of affected) {
    appointment.status = "CANCELLED_BY_LEAVE"; appointment.holdToken = undefined; appointment.holdExpiresAt = undefined; await appointment.save();
    await queueNotification(appointment.patientId, "DOCTOR_LEAVE", "Appointment changed because your doctor is unavailable", `Your appointment on ${date} at ${appointment.startTime} has been cancelled because the doctor is on leave. Please choose another slot.`);
  }
  res.json({ affectedAppointments:affected.length, leaveDate:date });
});

module.exports = router;
