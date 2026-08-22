const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  subject: String,
  message: String,
  status: { type: String, enum: ["PENDING", "SENT", "FAILED"], default: "PENDING" },
  attempts: { type: Number, default: 0 },
  lastError: String,
  nextAttemptAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
