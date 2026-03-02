import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

interface AppSettings {
  apiBaseUrl: string;
}

interface ChargingEntryDto {
  id: string;
  vehicleId: string;
  vehicleVin?: string | null;
  date: string;
  odometerReadingKm: number;
  kwhUsed: number;
  cost: number;
  chargingLocation: string;
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

const ChargingEntriesPage: React.FC = () => {
  const history = useHistory();

  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [entries, setEntries] = useState<ChargingEntryDto[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/appsettings.json');
        const data: AppSettings = await response.json();
        setApiBaseUrl(data.apiBaseUrl);
      } catch (err) {
        console.error('Failed to load appsettings.json', err);
        setError('Failed to load application settings.');
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

    const loadEntries = async () => {
      if (!apiBaseUrl) {
        return;
      }

      setLoadingEntries(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<PagedResult<ChargingEntryDto>>(`${apiBaseUrl}/api/chargingentries`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          params: {
            page: 1,
            pageSize: 200,
          },
        });

        setEntries(response.data?.items ?? []);
      } catch (err: any) {
        console.error('Failed to load charging entries', err);
        const backendDetail = err?.response?.data?.detail as string | undefined;
        setError(backendDetail || 'Unable to load charging entries.');
      } finally {
        setLoadingEntries(false);
      }
    };

  const handleDelete = async (entryId: string) => {
    if (!apiBaseUrl) {
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this charging entry?');
    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${apiBaseUrl}/api/chargingentries/${entryId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setSuccess('Charging entry deleted.');
      await loadEntries();
    } catch (err: any) {
      console.error('Failed to delete charging entry', err);
      const backendDetail = err?.response?.data?.detail as string | undefined;
      setError(backendDetail || 'Failed to delete charging entry.');
    }
  };

  useEffect(() => {
    if (!loadingSettings && apiBaseUrl) {
      loadEntries();
    }
  }, [apiBaseUrl, loadingSettings]);

  const handleUpdate = (entryId: string) => {
    history.push(`/charging-entries/${entryId}/edit`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl bg-white shadow rounded-lg p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <button
              type="button"
              onClick={() => history.push('/dashboard')}
              className="inline-flex items-center mb-2 text-sm text-indigo-600 hover:text-indigo-800"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Charging Entries</h1>
            <p className="text-sm text-gray-500">Review every recorded charging session with VIN context and quick actions.</p>
          </div>
          <button
            type="button"
            onClick={() => history.push('/charging-entries/new')}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            + Add Charging Entry
          </button>
        </div>

        {loadingSettings && (
          <div className="mb-4 text-indigo-600 text-sm">Loading configuration...</div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm">
            {success}
          </div>
        )}

        <div className="mb-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Viewing charging sessions across your entire fleet. Add filters later if you need to zoom in on a specific vehicle.
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Odometer (km)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">kWh Used</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingEntries ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading charging entries...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                    No charging entries recorded yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {entry.vehicleVin?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {entry.date}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {entry.odometerReadingKm.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {entry.kwhUsed.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      ${entry.cost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {entry.chargingLocation || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdate(entry.id)}
                          className="rounded-md border border-transparent bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="rounded-md border border-transparent bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChargingEntriesPage;
