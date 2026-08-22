const router = require("express").Router();
const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const Appointment = require("../models/Appointment");
const { auth, roles } = require("../middleware/auth");
const { buildSlots } = require("../utils/slots");

function dateOnly(value) {
  return new Date(`${value}T00:00:00`);
}

function isOnLeave(profile, dateString) {
  return (profile.leaveDays || []).some(d => new Date(d).toISOString().slice(0, 10) === dateString);
}

router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.search || req.query.specialization || "").trim();
    const filter = { role: "doctor" };
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const matchingProfiles = await DoctorProfile.find({ specialization: rx }).select("userId");
      filter.$or = [
        { name: rx },
        { _id: { $in: matchingProfiles.map(p => p.userId) } }
      ];
    }
    const users = await User.find(filter).select("-password").sort({ name: 1 });
    const profiles = await DoctorProfile.find({ userId: { $in: users.map(u => u._id) } });
    res.json(users.map(u => ({ user: u, profile: profiles.find(p => String(p.userId) === String(u._id)) || null })));
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: "doctor" }).select("-password");
    if (!user) return res.status(404).json({ message: "Doctor not found" });
    const profile = await DoctorProfile.findOne({ userId: user._id });
    if (!profile) return res.status(404).json({ message: "Doctor profile not found" });
    res.json({ user, profile });
  } catch (e) { next(e); }
});

router.get("/:id/slots", async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "Date is required" });
    const profile = await DoctorProfile.findOne({ userId: req.params.id });
    if (!profile) return res.status(404).json({ message: "Doctor profile not found" });
    if (isOnLeave(profile, date)) return res.json([]);

    const dateObj = dateOnly(date);
    const day = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][dateObj.getDay()];
    const hours = profile.workingHours?.[day];
    if (!hours?.enabled || !hours.start || !hours.end) return res.json([]);

    const all = buildSlots(hours.start, hours.end, Number(profile.slotDuration) || 30);
    const booked = await Appointment.find({
      doctorId: req.params.id,
      appointmentDate: date,
      status: { $in: ["HELD", "CONFIRMED", "COMPLETED"] },
      $or: [{ status: { $ne: "HELD" } }, { holdExpiresAt: { $gt: new Date() } }]
    }).select("startTime status holdExpiresAt");
    const busy = new Set(booked.map(x => x.startTime));
    res.json(all.map(s => ({ ...s, available: !busy.has(s.startTime) })));
  } catch (e) { next(e); }
});

// Backward-compatible admin endpoint for creating doctors.
router.post("/", auth, roles("admin"), async (req, res) => {
  try {
    const { name, email, password, specialization, qualification, experience, consultationFee, slotDuration, workingHours, bio } = req.body;
    if (!name || !email || !specialization) return res.status(400).json({ message: "Name, email and specialization are required" });
    const bcrypt = require("bcryptjs");
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already registered" });
    const hash = await bcrypt.hash(password || "ChangeMe123!", 12);
    const user = await User.create({ name, email: email.toLowerCase(), password: hash, role: "doctor" });
    const defaultDay = { start: "09:00", end: "17:00", enabled: true };
    const profile = await DoctorProfile.create({
      userId: user._id, specialization, qualification, experience: Number(experience) || 0,
      consultationFee: Number(consultationFee) || 0, slotDuration: Number(slotDuration) || 30,
      workingHours: workingHours || { monday: defaultDay, tuesday: defaultDay, wednesday: defaultDay, thursday: defaultDay, friday: defaultDay,
        saturday: { start: "09:00", end: "13:00", enabled: false }, sunday: { start: "09:00", end: "13:00", enabled: false } }, bio
    });
    res.status(201).json({ user: { id: user._id, name, email: user.email, role: "doctor" }, profile });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = router;
