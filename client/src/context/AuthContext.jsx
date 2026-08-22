import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("careflow_user")); } catch { return null; }
  });

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("careflow_token", data.token);
    localStorage.setItem("careflow_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("careflow_token", data.token);
    localStorage.setItem("careflow_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("careflow_token");
    localStorage.removeItem("careflow_user");
    setUser(null);
  }

  useEffect(() => {
    if (localStorage.getItem("careflow_token")) {
      api.get("/auth/me").then(({ data }) => setUser(data.user)).catch(logout);
    }
  }, []);

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
