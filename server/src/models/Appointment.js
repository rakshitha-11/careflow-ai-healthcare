const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  appointmentDate: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: {
    type: String,
    enum: ["HELD", "CONFIRMED", "COMPLETED", "CANCELLED", "CANCELLED_BY_LEAVE"],
    default: "CONFIRMED"
  },
  holdToken: String,
  holdExpiresAt: Date,
  symptoms: String,
  preVisitSummary: mongoose.Schema.Types.Mixed,
  doctorNotes: String,
  prescription: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  postVisitSummary: String,
  calendarPatientEventId: String,
  calendarDoctorEventId: String
}, { timestamps: true });

appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["HELD", "CONFIRMED", "COMPLETED"] }
    }
  }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
