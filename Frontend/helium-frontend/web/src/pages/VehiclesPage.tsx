import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

interface AppSettings {
  apiBaseUrl: string;
}

interface VehicleDto {
  id: string;
  userId: string;
  name: string;
  make: string;
  model: string;
  year?: number;
  powertrainType: number;
  bodyType: number;
  vin?: string | null;
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

const bodyTypeLabels: Record<number, string> = {
  0: 'Car',
  1: 'Van',
  2: 'Bike',
  3: 'Truck',
  4: 'SUV',
};

const powertrainLabels: Record<number, string> = {
  0: 'Petrol',
  1: 'Diesel',
  2: 'Hybrid',
  3: 'Electric',
};

const VehiclesPage: React.FC = () => {
  const history = useHistory();
  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [loading, setLoading] = useState(false);
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

  const fetchVehicles = useCallback(async () => {
    if (!apiBaseUrl) {
      return;
    }

    setLoading(true);
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
          pageSize: 50,
        },
      });

      setVehicles(response.data?.items ?? []);
    } catch (err: any) {
      console.error('Failed to fetch vehicles', err);
      const backendDetail = err?.response?.data?.detail as string | undefined;
      setError(backendDetail || 'Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!loadingSettings && apiBaseUrl) {
      fetchVehicles();
    }
  }, [apiBaseUrl, loadingSettings, fetchVehicles]);

  const handleDelete = async (vehicleId: string) => {
    if (!apiBaseUrl) {
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this vehicle?');
    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${apiBaseUrl}/api/vehicles/${vehicleId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setSuccess('Vehicle deleted successfully.');
      await fetchVehicles();
    } catch (err: any) {
      console.error('Failed to delete vehicle', err);
      const backendDetail = err?.response?.data?.detail as string | undefined;
      setError(backendDetail || 'Failed to delete vehicle.');
    }
  };

  const handleUpdate = (vehicleId: string) => {
    history.push(`/vehicles/${vehicleId}/edit`);
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
            <h1 className="text-2xl font-semibold text-gray-900">My Vehicles</h1>
            <p className="text-sm text-gray-500">Review, update, or remove vehicles tied to your account.</p>
          </div>
          <button
            type="button"
            onClick={() => history.push('/vehicles/new')}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            + Add Vehicle
          </button>
        </div>

        {loadingSettings && (
          <div className="mb-4 text-indigo-600 text-sm">Loading settings...</div>
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

        <div className="overflow-hidden">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Body</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Powertrain</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make / Model</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VIN</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">
                    Loading vehicles...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">
                    No vehicles found. Start by adding your first vehicle.
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td className="px-3 py-3 text-sm text-gray-900">{vehicle.name}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {bodyTypeLabels[vehicle.bodyType] ?? 'Unknown'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {powertrainLabels[vehicle.powertrainType] ?? 'Unknown'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {vehicle.make} {vehicle.model}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {vehicle.year ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 truncate max-w-[120px]">
                      {vehicle.vin ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-right text-sm">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdate(vehicle.id)}
                          className="rounded-md border border-transparent bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(vehicle.id)}
                          className="rounded-md border border-transparent bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
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

export default VehiclesPage;
