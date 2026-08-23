require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const startWorkers = require("./jobs/workers");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.get("/api/health", (_, res) => res.json({
  ok: true,
  service: "CareFlow AI API",
  time: new Date().toISOString()
}));

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/calendar", calendarRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error" });
});

const port = Number(process.env.PORT || 5000);

connectDB()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`CareFlow API running on port ${port}`);
    });
    startWorkers();
  })
  .catch(err => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });
