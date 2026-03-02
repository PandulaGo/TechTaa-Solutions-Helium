import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

interface AppSettings {
  apiBaseUrl: string;
}

interface VehicleDto {
  id: string;
  name: string;
  powertrainType: number;
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

const ChargingEntryCreatePage: React.FC = () => {
  const history = useHistory();

  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [vehicleWarning, setVehicleWarning] = useState<string | null>(null);

  const [form, setForm] = useState({
    vehicleId: '',
    date: '',
    odometerReadingKm: '',
    kwhUsed: '',
    cost: '',
    chargingLocation: '',
  });

  useEffect(() => {
    if (!form.vehicleId) {
      setVehicleWarning(null);
      return;
    }

    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === form.vehicleId);
    if (!selectedVehicle) {
      setVehicleWarning(null);
      return;
    }

    if (selectedVehicle.powertrainType !== 3) {
      setVehicleWarning('Selected vehicle is not electric. Charging entries are typically for electric vehicles.');
    } else {
      setVehicleWarning(null);
    }
  }, [form.vehicleId, vehicles]);

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
        setError(backendDetail || 'Unable to load vehicles for selection.');
      } finally {
        setLoadingVehicles(false);
      }
    };

    if (!loadingSettings && apiBaseUrl) {
      loadVehicles();
    }
  }, [apiBaseUrl, loadingSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const validate = (): boolean => {
    if (!form.vehicleId) {
      setError('Vehicle selection is required.');
      return false;
    }
    if (!form.date) {
      setError('Date is required.');
      return false;
    }
    if (!form.odometerReadingKm || Number(form.odometerReadingKm) < 0) {
      setError('Odometer reading must be zero or greater.');
      return false;
    }
    if (!form.kwhUsed || Number(form.kwhUsed) <= 0) {
      setError('kWh used must be greater than zero.');
      return false;
    }
    if (!form.cost || Number(form.cost) < 0) {
      setError('Cost must be zero or greater.');
      return false;
    }
    if (form.chargingLocation.length > 200) {
      setError('Charging location must be 200 characters or fewer.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!apiBaseUrl) {
      setError('Backend URL is not loaded yet. Please try again in a moment.');
      return;
    }

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        vehicleId: form.vehicleId,
        date: form.date,
        odometerReadingKm: Number(form.odometerReadingKm),
        kwhUsed: Number(form.kwhUsed),
        cost: Number(form.cost),
        chargingLocation: form.chargingLocation.trim(),
      };

      const response = await axios.post(`${apiBaseUrl}/api/chargingentries`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 201) {
        setSuccess('Charging entry recorded successfully.');
        setForm({
          vehicleId: '',
          date: '',
          odometerReadingKm: '',
          kwhUsed: '',
          cost: '',
          chargingLocation: '',
        });
      } else {
        setError('Failed to create charging entry. Please try again.');
      }
    } catch (err: any) {
      console.error('Charging entry creation error', err);

      const data = err?.response?.data;
      const backendDetail = data?.detail as string | undefined;
      const backendError = data?.error as string | undefined;
      const backendTitle = data?.title as string | undefined;
      const errors = data?.errors as Record<string, string[]> | undefined;
      let validationMessage: string | undefined;
      if (errors) {
        const parts: string[] = [];
        for (const [field, messages] of Object.entries(errors)) {
          if (messages && messages.length > 0) {
            parts.push(`${field}: ${messages.join(', ')}`);
          }
        }
        if (parts.length > 0) {
          validationMessage = parts.join('\n');
        }
      }

      setError(
        validationMessage || backendDetail || backendError || backendTitle || 'Failed to create charging entry.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl bg-white shadow-md rounded-lg p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => history.push('/dashboard')}
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => history.push('/vehicles')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            Manage Vehicles
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">Add Charging Entry</h1>
        <p className="text-gray-600 mb-6 text-center text-sm sm:text-base">
          Record charging sessions for your electric vehicles. Fields marked with * are required.
        </p>

        {(loadingSettings || loadingVehicles) && (
          <div className="mb-4 text-indigo-600 text-sm">Loading configuration...</div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm whitespace-pre-line">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle *
            </label>
            <select
              id="vehicleId"
              name="vehicleId"
              value={form.vehicleId}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                No vehicles available. Add a vehicle first so you can log charging entries.
              </p>
            )}
            {vehicleWarning && (
              <p className="mt-2 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                {vehicleWarning}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="odometerReadingKm" className="block text-sm font-medium text-gray-700 mb-1">
                Odometer (km) *
              </label>
              <input
                id="odometerReadingKm"
                name="odometerReadingKm"
                type="number"
                min="0"
                value={form.odometerReadingKm}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="kwhUsed" className="block text-sm font-medium text-gray-700 mb-1">
                kWh Used *
              </label>
              <input
                id="kwhUsed"
                name="kwhUsed"
                type="number"
                min="0"
                step="0.01"
                value={form.kwhUsed}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. 35.2"
              />
            </div>

            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                Cost *
              </label>
              <input
                id="cost"
                name="cost"
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. 18.75"
              />
            </div>
          </div>

          <div>
            <label htmlFor="chargingLocation" className="block text-sm font-medium text-gray-700 mb-1">
              Charging Location
            </label>
            <input
              id="chargingLocation"
              name="chargingLocation"
              type="text"
              value={form.chargingLocation}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Charging station name"
            />
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => history.push('/dashboard')}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Charging Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChargingEntryCreatePage;
