import React from 'react';

const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white shadow-md flex flex-col">
        <div className="px-6 py-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">Helium Dashboard</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 text-sm">
          <a href="/dashboard" className="block px-3 py-2 rounded-md bg-blue-50 text-blue-700 font-medium">Overview</a>
          <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-100">Vehicles</a>
          <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-100">Fuel Entries</a>
          <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-100">Charging Entries</a>
          <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-100">Maintenance</a>
          <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-100">Reports</a>
        </nav>
        <div className="px-4 py-4 border-t text-xs text-gray-500">
          Logged in sample user
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Overview</h2>
            <p className="text-sm text-gray-500">Sample dashboard after successful login.</p>
          </div>
          <a
            href="/login"
            className="text-sm text-red-600 hover:underline"
          >
            Log out
          </a>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Vehicles</h3>
            <p className="text-2xl font-semibold text-gray-800">3</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Fuel Entries (this month)</h3>
            <p className="text-2xl font-semibold text-gray-800">12</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Upcoming Maintenance</h3>
            <p className="text-2xl font-semibold text-gray-800">2</p>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Getting Started</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Add your vehicles and basic details.</li>
            <li>Record fuel or charging entries after each refuel/charge.</li>
            <li>Track maintenance and upcoming reminders.</li>
            <li>View reports for fuel consumption and costs over time.</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
