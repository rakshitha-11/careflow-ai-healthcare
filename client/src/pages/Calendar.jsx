import { useState } from "react";
import axios from "axios";

export default function Calendar() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const connectGoogleCalendar = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login first.");
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/calendar/google`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      window.location.href = response.data.url;
    } catch (err) {
      console.error("Google Calendar connection error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to connect Google Calendar. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-2xl font-bold mb-3">
            Google Calendar
          </h1>

          <p className="text-gray-600 mb-6">
            Connect your Google Calendar to automatically add your
            CareFlow appointments to your calendar.
          </p>

          <button
            onClick={connectGoogleCalendar}
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? "Connecting..."
              : "Connect Google Calendar"}
          </button>

          {error && (
            <p className="mt-4 text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}