# CareFlow AI — Database Schema

## User
`name`, `email` (unique), `password` (bcrypt hash), `role`, `phone`, `googleRefreshToken`.

## DoctorProfile
`userId` (unique reference to User), `specialization`, `qualification`, `experience`, `consultationFee`, `bio`, `slotDuration`, `workingHours` for each weekday, and `leaveDays`.

## Appointment
`patientId`, `doctorId`, `appointmentDate`, `startTime`, `endTime`, `status`, `holdToken`, `holdExpiresAt`, `symptoms`, `preVisitSummary`, `doctorNotes`, `prescription`, `postVisitSummary`, and calendar event IDs.

**Concurrency index:** unique `(doctorId, appointmentDate, startTime)` for `HELD`, `CONFIRMED` and `COMPLETED` records.

## Notification
`recipient`, `type`, `subject`, `message`, `status`, `attempts`, `lastError`, `nextAttemptAt`.

## MedicationReminder
`appointmentId`, `patientId`, `medicationName`, `dosage`, `frequency`, `nextReminderAt`, `active`, `lastSentAt`.
