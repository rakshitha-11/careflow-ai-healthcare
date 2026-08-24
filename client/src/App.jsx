import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import Book from "./pages/Book";
import Admin from "./pages/Admin";
import DoctorDashboard from "./pages/DoctorDashboard";

function Protected({ children, role }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function Home() {
  const { user } = useAuth();

  if (!user) return <Landing />;

  if (user.role === "patient") return <Dashboard />;

  if (user.role === "doctor") return <DoctorDashboard />;

  return <Admin />;
}

/* Page shown after Google Calendar OAuth succeeds */
function CalendarConnected() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#070b16] text-white flex items-center justify-center px-5">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-teal-400/20 text-teal-300 text-3xl">
          ✓
        </div>

        <h1 className="text-2xl font-black mb-3">
          Google Calendar Connected
        </h1>

        <p className="text-slate-400 mb-6">
          Your Google Calendar has been successfully connected to CareFlow AI.
          Your future appointments can now be added to your Google Calendar.
        </p>

        {user?.role === "patient" && (
          <Link
            to="/patient"
            className="inline-block rounded-xl bg-teal-400 px-5 py-3 font-bold text-slate-950 hover:bg-teal-300"
          >
            Go to Patient Dashboard
          </Link>
        )}

        {user?.role === "doctor" && (
          <Link
            to="/doctor"
            className="inline-block rounded-xl bg-teal-400 px-5 py-3 font-bold text-slate-950 hover:bg-teal-300"
          >
            Go to Doctor Dashboard
          </Link>
        )}

        {!user && (
          <Link
            to="/login"
            className="inline-block rounded-xl bg-teal-400 px-5 py-3 font-bold text-slate-950 hover:bg-teal-300"
          >
            Login
          </Link>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/login"
            element={<Auth mode="login" />}
          />

          <Route
            path="/register"
            element={<Auth mode="register" />}
          />

          <Route
            path="/patient"
            element={
              <Protected role="patient">
                <Dashboard />
              </Protected>
            }
          />

          <Route
            path="/patient/doctors"
            element={
              <Protected role="patient">
                <Doctors />
              </Protected>
            }
          />

          <Route
            path="/patient/book/:doctorId"
            element={
              <Protected role="patient">
                <Book />
              </Protected>
            }
          />

          <Route
            path="/patient/appointments"
            element={
              <Protected role="patient">
                <Appointments />
              </Protected>
            }
          />

          <Route
            path="/doctor"
            element={
              <Protected role="doctor">
                <DoctorDashboard />
              </Protected>
            }
          />

          <Route
            path="/doctor/appointments"
            element={
              <Protected role="doctor">
                <DoctorDashboard />
              </Protected>
            }
          />

          <Route
            path="/admin"
            element={
              <Protected role="admin">
                <Admin />
              </Protected>
            }
          />

          <Route
            path="/calendar-connected"
            element={<CalendarConnected />}
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}