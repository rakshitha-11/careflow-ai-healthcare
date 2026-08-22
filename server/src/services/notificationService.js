const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendEmail } = require("./emailService");

async function queueNotification(recipient, type, subject, message) {
  return Notification.create({ recipient, type, subject, message });
}

async function processNotifications() {
  const pending = await Notification.find({
    status: "PENDING",
    nextAttemptAt: { $lte: new Date() }
  }).limit(20);

  for (const item of pending) {
    try {
      const user = await User.findById(item.recipient);
      if (!user) throw new Error("Recipient not found");

      await sendEmail({ to: user.email, subject: item.subject, text: item.message });
      item.status = "SENT";
      item.attempts += 1;
      await item.save();
    } catch (err) {
      item.attempts += 1;
      item.lastError = err.message;
      if (item.attempts >= 3) item.status = "FAILED";
      else item.nextAttemptAt = new Date(Date.now() + item.attempts * 60 * 1000);
      await item.save();
    }
  }
}

module.exports = { queueNotification, processNotifications };
