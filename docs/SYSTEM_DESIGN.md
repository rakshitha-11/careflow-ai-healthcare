# CareFlow AI — System Design

## 1. Architecture
CareFlow uses a React/Vite client, an Express API and MongoDB. Authentication is JWT-based and every protected API checks the user's role (`patient`, `doctor`, or `admin`). Long-running notification and medication work is handled by a lightweight background worker so a booking is not blocked by email delivery or an LLM call.

## 2. Double-booking prevention
Availability shown in the UI is only advisory. When a patient selects a slot, the API validates the doctor's working hours, leave days, date and slot duration, then creates a five-minute `HELD` appointment. The appointment collection has a unique compound index over `doctorId + appointmentDate + startTime` for active states. Therefore, even if two requests arrive at the same time, MongoDB accepts only one. Duplicate-key errors are converted to HTTP 409, allowing the UI to tell the patient to select another slot. Expired holds are cleaned by the worker.

## 3. Slot hold mechanism
The hold record contains a random `holdToken` and `holdExpiresAt`. Only the patient who owns the token can convert the hold into a confirmed appointment. If the patient abandons the flow, the worker removes the expired hold. This gives the symptom form enough time to be completed without permanently blocking the slot.

## 4. Doctor leave conflicts
Admin leave management stores the date in the doctor's profile. Slot generation returns no availability for that date. When leave is applied, existing `HELD` and `CONFIRMED` appointments are changed to `CANCELLED_BY_LEAVE`; the affected patients receive queued notifications. This keeps the schedule and patient communication consistent instead of silently leaving an invalid booking.

## 5. LLM safety and failure handling
The pre-visit prompt asks for only an urgency flag, chief complaint and three suggested questions; it explicitly prohibits diagnosis. The post-visit prompt asks for a plain-language explanation while preserving clinician medication instructions. LLM failures are caught and replaced with deterministic summaries. The appointment transaction therefore remains usable even if the AI provider is unavailable.

## 6. Notification reliability
Booking, cancellation, leave, post-visit and medication events create MongoDB notification records. The worker sends pending emails and retries failures up to three attempts before marking them `FAILED`. When SMTP is not configured, CareFlow logs a demo email instead of throwing an application error. Notification failure never rolls back a valid appointment.

## 7. Calendar synchronization
Google Calendar uses OAuth 2.0 refresh tokens stored against the user. When both users have connected calendars, booking creates events for both. Rescheduling updates the existing events; cancellation deletes them. Calendar errors are isolated from the core appointment operation so calendar availability cannot break booking.

## 8. Deployment
The recommended production layout is Vercel for the React client, Render for the Express API and MongoDB Atlas for the database. Secrets are configured only in hosting environment-variable settings. The repository contains `.env.example` but never contains `.env` or dependency/build folders.
