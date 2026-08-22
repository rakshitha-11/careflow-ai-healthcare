import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
function Home() {
  const { user } = useAuth();
  if (!user) return <Landing />;
  if (user.role === "patient") return <Dashboard />;
  if (user.role === "doctor") return <DoctorDashboard />;
  return <Admin />;
}
export default function App() { return <AuthProvider><BrowserRouter><Routes>
  <Route path="/" element={<Home/>}/><Route path="/login" element={<Auth mode="login"/>}/><Route path="/register" element={<Auth mode="register"/>}/>
  <Route path="/patient" element={<Protected role="patient"><Dashboard/></Protected>}/><Route path="/patient/doctors" element={<Protected role="patient"><Doctors/></Protected>}/><Route path="/patient/book/:doctorId" element={<Protected role="patient"><Book/></Protected>}/><Route path="/patient/appointments" element={<Protected role="patient"><Appointments/></Protected>}/>
  <Route path="/doctor" element={<Protected role="doctor"><DoctorDashboard/></Protected>}/><Route path="/doctor/appointments" element={<Protected role="doctor"><DoctorDashboard/></Protected>}/>
  <Route path="/admin" element={<Protected role="admin"><Admin/></Protected>}/>
  <Route path="*" element={<Navigate to="/" replace/>}/>
</Routes></BrowserRouter></AuthProvider> }
