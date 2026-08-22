# CareFlow AI — Healthcare Appointment & Follow-up Manager

CareFlow AI is a full-stack healthcare appointment platform with patient, doctor and admin portals. It is designed around a single **Care Passport**: symptoms before the visit, a clinician briefing, the consultation, the care plan and medication reminders.

## Core features
- Patient registration/login with JWT role-based access
- Admin doctor management: specialization, hours, slot duration and leave
- Doctor search by name **or specialization**
- Availability generated from working hours and slot duration
- Five-minute slot hold + MongoDB unique compound index for concurrency-safe booking
- AI pre-visit briefing with graceful fallback when OpenAI is unavailable
- Doctor portal for consultation notes and prescription
- Patient-friendly post-visit summary
- Medication reminder scheduler with frequency-aware intervals
- Email notification queue with retry/failure handling
- Doctor leave conflict handling with affected-patient notifications
- Google Calendar OAuth hooks; calendar actions remain optional until credentials are configured
- Responsive CareFlow Aurora UI

## Demo seed data
From `server/`:
```bash
npm run seed
```
This creates demo data in your configured MongoDB:
- Admin: `admin@careflow.demo` / `CareFlowAdmin@2026`
- Doctors: `ananya.rao@careflow.demo`, `arjun.mehta@careflow.demo`, `mira.nair@careflow.demo`
- Doctor password: `Doctor@2026`

Change demo credentials before using this outside an assignment/demo environment.

## Local setup
### Backend
```bash
cd server
npm install
copy .env.example .env
npm run seed
npm run dev
```
Backend: http://localhost:5000

### Frontend
Open another terminal:
```bash
cd client
npm install
npm run dev
```
Frontend: http://localhost:5173

If your frontend environment needs a custom API URL, create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

## API overview
### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`

### Doctors
- GET `/api/doctors?search=cardiology`
- GET `/api/doctors/:id`
- GET `/api/doctors/:id/slots?date=YYYY-MM-DD`
- POST `/api/doctors` (admin; backward-compatible)

### Appointments
- POST `/api/appointments/hold`
- POST `/api/appointments`
- GET `/api/appointments`
- GET `/api/appointments/:id`
- POST `/api/appointments/:id/cancel`
- POST `/api/appointments/:id/previsit-summary`
- POST `/api/appointments/:id/consultation`
- POST `/api/appointments/:id/postvisit-summary`

### Admin
- GET `/api/admin/doctors`
- POST `/api/admin/doctors`
- POST `/api/admin/doctors/:id/leave`

## Double-booking prevention
The booking flow has two layers. First, a five-minute `HELD` record reserves the selected slot while the patient enters symptoms. Second, MongoDB enforces a unique compound index on `(doctorId, appointmentDate, startTime)` for active states. If two requests race, the database duplicate-key error becomes a user-safe HTTP 409 conflict. This makes the database the final concurrency guard rather than relying only on frontend availability.

## Leave conflicts
Admin leave management stores the date in the doctor's profile. Slot generation returns no slots on a leave date. If existing `HELD` or `CONFIRMED` appointments exist for that date, they are moved to `CANCELLED_BY_LEAVE` and a notification is queued for each affected patient.

## Notification reliability
Email is deliberately asynchronous. Booking, cancellation, leave and post-visit actions create MongoDB notification records instead of blocking the main workflow on an SMTP server. A worker retries pending messages and marks them `FAILED` after three attempts. If SMTP credentials are absent, the project logs an email-demo message instead of crashing.

## LLM prompts and failure handling
### Pre-visit
> Analyse these symptoms and return JSON with urgencyLevel (Low / Medium / High), chiefComplaint, and exactly three suggestedQuestions. Do not diagnose.

### Post-visit
> Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps. Do not diagnose, invent treatment, or change clinician instructions.

OpenAI failures are caught and replaced with deterministic fallback summaries so appointment creation is not rolled back.

## Google Calendar
Create a Google Cloud OAuth 2.0 Web application, enable Google Calendar API, add the backend callback URL from `GOOGLE_REDIRECT_URI`, and configure the client ID/secret in the deployment environment. The calendar integration is optional and should fail gracefully when credentials are absent.

## Deployment architecture
Recommended for this assignment:
- **Vercel** for `client/`
- **Render** for `server/`
- **MongoDB Atlas** for the production database

Production environment variables belong in the hosting dashboards, not in GitHub.

## Submission hygiene
Commit `.gitignore`, `.env.example`, README and source code. Never commit `.env`, `node_modules`, `dist`, build artifacts or credentials.

## Educational safety note
AI features summarize information and are not a diagnosis. Doctors remain responsible for clinical decisions. This project is an educational prototype and is not a certified medical-record system.
