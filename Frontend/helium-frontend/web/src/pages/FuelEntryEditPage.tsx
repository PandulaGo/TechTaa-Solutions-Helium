import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useHistory, useParams } from 'react-router-dom';

interface AppSettings {
  apiBaseUrl: string;
}

interface FuelEntryDto {
  id: string;
  vehicleId: string;
  vehicleVin?: string | null;
  date: string;
  odometerReadingKm: number;
  liters: number;
  cost: number;
  fuelStationName: string;
  receiptImagePath?: string | null;
}

const FuelEntryEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();

  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string>('');

  const [form, setForm] = useState({
    date: '',
    odometerReadingKm: '',
    liters: '',
    cost: '',
    fuelStationName: '',
    receiptImagePath: '',
  });

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
    const loadEntry = async () => {
      if (!apiBaseUrl || !id) {
        return;
      }

      setLoadingEntry(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<FuelEntryDto>(`${apiBaseUrl}/api/fuelentries/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const entry = response.data;
        setVehicleId(entry.vehicleId);
        setForm({
          date: entry.date,
          odometerReadingKm: entry.odometerReadingKm.toString(),
          liters: entry.liters.toString(),
          cost: entry.cost.toString(),
          fuelStationName: entry.fuelStationName,
          receiptImagePath: entry.receiptImagePath ?? '',
        });
      } catch (err: any) {
        console.error('Failed to load fuel entry', err);
        const backendDetail = err?.response?.data?.detail as string | undefined;
        setError(backendDetail || 'Failed to load fuel entry details.');
      } finally {
        setLoadingEntry(false);
      }
    };

    if (!loadingSettings && apiBaseUrl) {
      loadEntry();
    }
  }, [apiBaseUrl, id, loadingSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const validate = (): boolean => {
    if (!form.date) {
      setError('Date is required.');
      return false;
    }
    if (!form.odometerReadingKm || Number(form.odometerReadingKm) < 0) {
      setError('Odometer reading must be zero or greater.');
      return false;
    }
    if (!form.liters || Number(form.liters) <= 0) {
      setError('Liters must be greater than zero.');
      return false;
    }
    if (!form.cost || Number(form.cost) < 0) {
      setError('Cost must be zero or greater.');
      return false;
    }
    if (form.fuelStationName.length > 200) {
      setError('Fuel station name must be 200 characters or fewer.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!apiBaseUrl || !id) {
      setError('Backend URL is not ready yet. Please try again.');
      return;
    }

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        date: form.date,
        odometerReadingKm: Number(form.odometerReadingKm),
        liters: Number(form.liters),
        cost: Number(form.cost),
        fuelStationName: form.fuelStationName.trim(),
        receiptImagePath: form.receiptImagePath ? form.receiptImagePath.trim() : null,
      };

      await axios.put(`${apiBaseUrl}/api/fuelentries/${id}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setSuccess('Fuel entry updated successfully.');
      setTimeout(() => {
        history.push('/fuel-entries');
      }, 1000);
    } catch (err: any) {
      console.error('Fuel entry update error', err);
      const data = err?.response?.data;
      const backendDetail = data?.detail as string | undefined;
      const backendError = data?.error as string | undefined;
      const backendTitle = data?.title as string | undefined;
      const errors = data?.errors as Record<string, string[]> | undefined;
      let validationMessage: string | undefined;
      if (errors) {
        const parts: string[] = [];
        for (const [field, messages] of Object.entries(errors)) {
          if (messages?.length) {
            parts.push(`${field}: ${messages.join(', ')}`);
          }
        }
        if (parts.length > 0) {
          validationMessage = parts.join('\n');
        }
      }

      setError(
        validationMessage || backendDetail || backendError || backendTitle || 'Failed to update fuel entry.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl bg-white shadow-md rounded-lg p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => history.push('/fuel-entries')}
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Fuel Entries
          </button>
          <button
            type="button"
            onClick={() => history.push('/dashboard')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            Dashboard
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">Update Fuel Entry</h1>
        <p className="text-gray-600 mb-6 text-center text-sm sm:text-base">
          You're editing an entry for vehicle ID: {vehicleId || '—'}
        </p>

        {(loadingSettings || loadingEntry) && (
          <div className="mb-4 text-indigo-600 text-sm">Loading fuel entry details...</div>
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
              <label htmlFor="liters" className="block text-sm font-medium text-gray-700 mb-1">
                Liters *
              </label>
              <input
                id="liters"
                name="liters"
                type="number"
                min="0"
                step="0.01"
                value={form.liters}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fuelStationName" className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Station
              </label>
              <input
                id="fuelStationName"
                name="fuelStationName"
                type="text"
                value={form.fuelStationName}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="receiptImagePath" className="block text-sm font-medium text-gray-700 mb-1">
                Receipt Image URL
              </label>
              <input
                id="receiptImagePath"
                name="receiptImagePath"
                type="text"
                value={form.receiptImagePath}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => history.push('/fuel-entries')}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FuelEntryEditPage;
