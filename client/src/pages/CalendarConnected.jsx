export default function CalendarConnected() {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-green-600 mb-4">
            Google Calendar Connected
          </h1>

          <p className="text-gray-600 mb-6">
            Your Google Calendar has been successfully connected
            to CareFlow.
          </p>

          <a
            href="/calendar"
            className="inline-block px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Manage Google Calendar
          </a>
        </div>
      </div>
    </div>
  );
}