const { google } = require("googleapis");
const User = require("../models/User");

const CALENDAR_TIME_ZONE = "Asia/Kolkata";

function configured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URI
  );
}

function clientFor(user) {
  if (!configured() || !user?.googleRefreshToken) return null;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  client.setCredentials({
    refresh_token: user.googleRefreshToken
  });

  return client;
}

function eventBody(a, user, otherLabel) {
  // IMPORTANT:
  // appointmentDate/startTime/endTime are already CareFlow local
  // appointment values in India time.
  //
  // Do NOT use new Date(...).toISOString() here because Render
  // runs in UTC and that would shift the appointment by +5:30 hours.

  const startDateTime = `${a.appointmentDate}T${a.startTime}:00`;
  const endDateTime = `${a.appointmentDate}T${a.endTime}:00`;

  return {
    summary: `CareFlow appointment — ${otherLabel}`,

    description:
      "CareFlow healthcare appointment. Symptoms and clinical notes are kept in CareFlow; this calendar event contains only scheduling information.",

    start: {
      dateTime: startDateTime,
      timeZone: CALENDAR_TIME_ZONE
    },

    end: {
      dateTime: endDateTime,
      timeZone: CALENDAR_TIME_ZONE
    }
  };
}

async function createForUser(userId, appointment, otherLabel) {
  const user = await User.findById(userId);
  const auth = clientFor(user);

  if (!auth) return null;

  const calendar = google.calendar({
    version: "v3",
    auth
  });

  const result = await calendar.events.insert({
    calendarId: "primary",
    requestBody: eventBody(appointment, user, otherLabel)
  });

  return result.data.id;
}

async function createForBoth(appointment) {
  try {
    const [patient, doctor] = await Promise.all([
      User.findById(appointment.patientId),
      User.findById(appointment.doctorId)
    ]);

    if (patient?.googleRefreshToken) {
      appointment.calendarPatientEventId = await createForUser(
        patient._id,
        appointment,
        doctor?.name || "Doctor"
      );
    }

    if (doctor?.googleRefreshToken) {
      appointment.calendarDoctorEventId = await createForUser(
        doctor._id,
        appointment,
        patient?.name || "Patient"
      );
    }

    await appointment.save();
  } catch (e) {
    console.error("Calendar create skipped:", e.message);
  }
}

async function deleteForUser(userId, eventId) {
  if (!eventId) return;

  const user = await User.findById(userId);
  const auth = clientFor(user);

  if (!auth) return;

  try {
    await google.calendar({
      version: "v3",
      auth
    }).events.delete({
      calendarId: "primary",
      eventId
    });
  } catch (e) {
    if (e.code !== 404) throw e;
  }
}

async function deleteForBoth(appointment) {
  try {
    await deleteForUser(
      appointment.patientId,
      appointment.calendarPatientEventId
    );

    await deleteForUser(
      appointment.doctorId,
      appointment.calendarDoctorEventId
    );
  } catch (e) {
    console.error("Calendar delete skipped:", e.message);
  }
}

async function updateForUser(
  userId,
  eventId,
  appointment,
  otherLabel
) {
  if (!eventId) return;

  const user = await User.findById(userId);
  const auth = clientFor(user);

  if (!auth) return;

  await google.calendar({
    version: "v3",
    auth
  }).events.update({
    calendarId: "primary",
    eventId,
    requestBody: eventBody(
      appointment,
      user,
      otherLabel
    )
  });
}

async function updateForBoth(appointment) {
  try {
    const [patient, doctor] = await Promise.all([
      User.findById(appointment.patientId),
      User.findById(appointment.doctorId)
    ]);

    await updateForUser(
      appointment.patientId,
      appointment.calendarPatientEventId,
      appointment,
      doctor?.name || "Doctor"
    );

    await updateForUser(
      appointment.doctorId,
      appointment.calendarDoctorEventId,
      appointment,
      patient?.name || "Patient"
    );
  } catch (e) {
    console.error("Calendar update skipped:", e.message);
  }
}

module.exports = {
  createForBoth,
  deleteForBoth,
  updateForBoth
};