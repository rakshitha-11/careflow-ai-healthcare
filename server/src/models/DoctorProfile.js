const mongoose = require("mongoose");

const doctorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  specialization: { type: String, required: true },
  qualification: String,
  experience: Number,
  consultationFee: Number,
  bio: String,
  slotDuration: { type: Number, default: 30 },
  workingHours: {
    monday: { start: String, end: String, enabled: Boolean },
    tuesday: { start: String, end: String, enabled: Boolean },
    wednesday: { start: String, end: String, enabled: Boolean },
    thursday: { start: String, end: String, enabled: Boolean },
    friday: { start: String, end: String, enabled: Boolean },
    saturday: { start: String, end: String, enabled: Boolean },
    sunday: { start: String, end: String, enabled: Boolean }
  },
  leaveDays: [{ type: Date }]
}, { timestamps: true });

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);
