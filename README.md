# CareFlow AI

### Healthcare Appointment & Follow-up Manager

CareFlow AI is a full-stack healthcare appointment management platform that connects patients, doctors, and administrators through a single system.

The platform goes beyond basic appointment booking by providing AI-powered pre-visit symptom summaries, post-visit care summaries, medication reminders, email notifications, and Google Calendar integration.

---

## ✨ Key Features

### Patient Portal
- Patient registration and secure login
- Search doctors by specialization
- View available appointment slots
- Temporary slot holding before confirmation
- Appointment booking and cancellation
- Appointment history
- Pre-visit symptom submission
- AI-generated symptom briefing
- Post-visit care summary
- Medication reminders
- Email appointment notifications

### Doctor Portal
- Secure doctor login
- View upcoming appointments
- Review patient symptoms before consultation
- AI-generated pre-visit briefing
- Add consultation notes and prescriptions
- Generate patient-friendly post-visit summaries
- Manage appointment status

### Admin Portal
- Create and manage doctor profiles
- Configure doctor specialization
- Set working hours
- Configure appointment slot duration
- Manage doctor leave days
- Handle doctor availability and booking conflicts

---

## 🤖 AI Features

CareFlow AI integrates Google Gemini to assist doctors and patients during the consultation workflow.

### Pre-Visit AI Briefing

Before an appointment, the patient's symptoms are processed to generate:

- Urgency level: Low / Medium / High
- Chief complaint
- Three suggested questions for the doctor

### Post-Visit AI Summary

After the consultation, the doctor's notes and prescription are converted into a patient-friendly summary containing:

- Simple explanation of the consultation
- Medication schedule
- Follow-up instructions

If the AI service is unavailable, the application uses graceful fallback handling so that the appointment workflow continues without breaking.

---

## 🔐 Appointment & Booking Reliability

The application is designed to handle common appointment scheduling problems.

### Double-Booking Prevention

Appointments are validated on the backend rather than relying only on frontend checks.

A temporary slot-hold mechanism is used before final confirmation. The server performs a final availability check before creating the appointment, helping prevent two users from booking the same slot simultaneously.

### Doctor Leave Handling

When a doctor is marked unavailable for a particular date, existing appointments for that date can be identified and affected patients can be notified.

### Slot Management

Doctor working hours and slot duration are used to generate available appointment slots dynamically.

---

## 📧 Notifications & Calendar

CareFlow AI supports automated communication between patients and doctors.

### Email Notifications

Emails can be sent for:

- Appointment confirmation
- Doctor appointment notification
- Appointment reminders
- Cancellation
- Post-visit summary

### Google Calendar

Google Calendar integration allows appointment events to be created and updated for connected users.

Appointments can also be updated or removed when the appointment is rescheduled or cancelled.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT |
| AI | Google Gemini API |
| Email | Nodemailer, Gmail SMTP |
| Calendar | Google Calendar API, OAuth 2.0 |
| API | REST |
| Deployment | Vercel / Render |

---

## 📁 Project Structure

```text
careflow-ai-healthcare/
│
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js backend
│   ├── src/
│   │   ├── config/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
├── docs/
│   ├── API.md
│   ├── DB_SCHEMA.md
│   └── SYSTEM_DESIGN.md
│
├── .gitignore
├── .nvmrc
├── LICENSE
└── README.md

