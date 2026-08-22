# CareFlow AI — API Quick Reference

All routes are under `/api`.

| Method | Route | Role | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Patient registration |
| POST | `/auth/login` | Public | Login |
| GET | `/auth/me` | Auth | Current user |
| GET | `/doctors?search=` | Public | Search doctors by name/specialization |
| GET | `/doctors/:id` | Public | Doctor profile |
| GET | `/doctors/:id/slots?date=` | Public | Availability |
| POST | `/appointments/hold` | Patient | Five-minute slot hold |
| POST | `/appointments` | Patient | Confirm booking + AI briefing |
| GET | `/appointments` | Auth | Role-filtered appointments |
| POST | `/appointments/:id/cancel` | Owner/Admin | Cancel appointment |
| POST | `/appointments/:id/reschedule` | Owner/Admin | Move appointment |
| POST | `/appointments/:id/consultation` | Doctor | Notes, prescription, post-visit summary |
| GET | `/admin/doctors` | Admin | List doctors |
| POST | `/admin/doctors` | Admin | Create doctor |
| POST | `/admin/doctors/:id/leave` | Admin | Mark leave + notify patients |
| GET | `/calendar/google` | Auth | Get Google OAuth URL |
| GET | `/health` | Public | API health check |
