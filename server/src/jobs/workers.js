const Appointment = require("../models/Appointment");
const MedicationReminder = require("../models/MedicationReminder");
const Notification = require("../models/Notification");
const User = require("../models/User");
const {
  processNotifications,
  queueNotification
} = require("../services/notificationService");

const INDIA_TIME_ZONE = "Asia/Kolkata";
const INDIA_OFFSET = "+05:30";
const WORKER_INTERVAL_MS = 60 * 1000;

function intervalHours(frequency) {
  const f = String(frequency || "").toLowerCase();

  if (/weekly|once.*week/.test(f)) return 168;
  if (/daily|once.*day|1.*day/.test(f)) return 24;
  if (/twice|2.*day|12.*hour/.test(f)) return 12;
  if (/three|3.*day|8.*hour/.test(f)) return 8;
  if (/four|4.*day|6.*hour/.test(f)) return 6;

  return 12;
}

function indiaDateKey(date = new Date()) {
  return date.toLocaleDateString("en-CA", {
    timeZone: INDIA_TIME_ZONE
  });
}

function indiaDateKeyPlusDays(days) {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  return date.toLocaleDateString("en-CA", {
    timeZone: INDIA_TIME_ZONE
  });
}

function appointmentDateTime(appointment) {
  // CareFlow stores appointmentDate/startTime as India-local
  // scheduling values. Explicitly attach +05:30 so Render/UTC
  // does not reinterpret the time.
  return new Date(
    `${appointment.appointmentDate}T${appointment.startTime}:00${INDIA_OFFSET}`
  );
}

async function processAppointmentReminders() {
  const today = indiaDateKey();
  const tomorrow = indiaDateKeyPlusDays(1);

  const items = await Appointment.find({
    status: "CONFIRMED",
    appointmentDate: {
      $gte: today,
      $lte: tomorrow
    }
  });

  for (const appointment of items) {
    const appointmentAt = appointmentDateTime(appointment);

    const minutesUntil =
      (appointmentAt.getTime() - Date.now()) / 60000;

    // Approximately 1 hour before appointment.
    // Worker runs every minute, so allow a 55-65 minute window.
    if (minutesUntil >= 55 && minutesUntil <= 65) {
      const alreadySent = await Notification.findOne({
        recipient: appointment.patientId,
        type: "APPOINTMENT_REMINDER",
        message: {
          $regex: `${appointment.appointmentDate}.*${appointment.startTime}`
        }
      });

      if (!alreadySent) {
        await queueNotification(
          appointment.patientId,
          "APPOINTMENT_REMINDER",
          "CareFlow appointment reminder",
          `Reminder: your appointment is scheduled for ${appointment.appointmentDate} at ${appointment.startTime}.`
        );

        console.log(
          `[WORKER] Appointment reminder queued for ${appointment.appointmentDate} ${appointment.startTime}`
        );
      }
    }
  }
}

async function processMedicationReminders() {
  const reminders = await MedicationReminder.find({
    active: true,
    nextReminderAt: {
      $lte: new Date()
    }
  }).limit(50);

  for (const reminder of reminders) {
    const patient = await User.findById(reminder.patientId);

    if (patient) {
      await queueNotification(
        reminder.patientId,
        "MEDICATION_REMINDER",
        `Medication reminder: ${reminder.medicationName}`,
        `Reminder to take ${reminder.medicationName} (${reminder.dosage}) according to your prescription frequency: ${reminder.frequency}.`
      );

      console.log(
        `[WORKER] Medication reminder queued for ${patient.email}: ${reminder.medicationName}`
      );
    }

    reminder.lastSentAt = new Date();

    reminder.nextReminderAt = new Date(
      Date.now() +
      intervalHours(reminder.frequency) * 60 * 60 * 1000
    );

    await reminder.save();
  }
}

async function runWorker() {
  try {
    console.log("[WORKER] Running notification/reminder worker...");

    // Remove expired appointment holds.
    await Appointment.deleteMany({
      status: "HELD",
      holdExpiresAt: {
        $lte: new Date()
      }
    });

    // First create any new reminders.
    await processAppointmentReminders();
    await processMedicationReminders();

    // Then immediately send all pending notifications.
    await processNotifications();

    console.log("[WORKER] Worker cycle completed successfully.");
  } catch (e) {
    console.error("[WORKER] Worker error:", e.message);
  }
}

function startWorkers() {
  // Run once immediately after server starts.
  runWorker();

  // Continue every minute.
  setInterval(runWorker, WORKER_INTERVAL_MS);

  console.log(
    `[WORKER] Started. Running every ${WORKER_INTERVAL_MS / 1000} seconds.`
  );
}

module.exports = startWorkers;