import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

interface AppSettings {
  apiBaseUrl: string;
}

interface VehicleDto {
  id: string;
  name: string;
}

interface FuelEntryDto {
  id: string;
  vehicleId: string;
  date: string;
  odometerReadingKm: number;
  liters: number;
  cost: number;
  fuelStationName: string;
  receiptImagePath?: string | null;
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

const FuelEntriesPage: React.FC = () => {
  const history = useHistory();

  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [entries, setEntries] = useState<FuelEntryDto[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const loadVehicles = async () => {
      if (!apiBaseUrl) {
        return;
      }

      setLoadingVehicles(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<PagedResult<VehicleDto>>(`${apiBaseUrl}/api/vehicles`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          params: {
            page: 1,
            pageSize: 100,
          },
        });

        setVehicles(response.data?.items ?? []);
      } catch (err: any) {
        console.error('Failed to load vehicles', err);
        const backendDetail = err?.response?.data?.detail as string | undefined;
        setError(backendDetail || 'Unable to load vehicles.');
      } finally {
        setLoadingVehicles(false);
      }
    };

    if (!loadingSettings && apiBaseUrl) {
      loadVehicles();
    }
  }, [apiBaseUrl, loadingSettings]);

  const loadEntries = async (vehicleId: string) => {
    if (!apiBaseUrl || !vehicleId) {
      return;
    }

    setLoadingEntries(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<PagedResult<FuelEntryDto>>(`${apiBaseUrl}/api/fuelentries`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        params: {
          vehicleId,
          page: 1,
          pageSize: 100,
        },
      });

      setEntries(response.data?.items ?? []);
    } catch (err: any) {
      console.error('Failed to load fuel entries', err);
      const backendDetail = err?.response?.data?.detail as string | undefined;
      setError(backendDetail || 'Unable to load fuel entries.');
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedVehicleId(value);
    setEntries([]);
    if (value) {
      loadEntries(value);
    }
  };

  const selectedVehicleName = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId)?.name ?? '';
  }, [vehicles, selectedVehicleId]);

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
            <h1 className="text-2xl font-semibold text-gray-900">Fuel Entries</h1>
            <p className="text-sm text-gray-500">Select a vehicle to review detailed refueling history.</p>
          </div>
          <button
            type="button"
            onClick={() => history.push('/fuel-entries/new')}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            + Add Fuel Entry
          </button>
        </div>

        {(loadingSettings || loadingVehicles) && (
          <div className="mb-4 text-indigo-600 text-sm">Loading configuration...</div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle
          </label>
          <select
            id="vehicle"
            value={selectedVehicleId}
            onChange={handleVehicleChange}
            className="block w-full sm:w-80 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={vehicles.length === 0}
          >
            <option value="">Select vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name}
              </option>
            ))}
          </select>
          {vehicles.length === 0 && !loadingVehicles && (
            <p className="mt-1 text-xs text-gray-500">
              No vehicles available. Add a vehicle first so you can log fuel entries.
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Odometer (km)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liters</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingEntries ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading fuel entries...
                  </td>
                </tr>
              ) : !selectedVehicleId ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Choose a vehicle to view its fuel entries.
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    No fuel entries found for {selectedVehicleName || 'this vehicle'} yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {entry.date}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {entry.odometerReadingKm.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {entry.liters.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      ${entry.cost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {entry.fuelStationName || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-indigo-600">
                      {entry.receiptImagePath ? (
                        <a
                          href={entry.receiptImagePath}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          View receipt
                        </a>
                      ) : (
                        '—'
                      )}
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

export default FuelEntriesPage;
