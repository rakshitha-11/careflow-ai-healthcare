const mongoose = require("mongoose");

const medicationReminderSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  medicationName: String,
  dosage: String,
  frequency: String,
  nextReminderAt: Date,
  active: { type: Boolean, default: true },
  lastSentAt: Date
}, { timestamps: true });

module.exports = mongoose.model("MedicationReminder", medicationReminderSchema);
