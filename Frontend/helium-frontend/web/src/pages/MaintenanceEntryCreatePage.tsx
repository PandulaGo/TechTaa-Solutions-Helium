import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

interface AppSettings {
  apiBaseUrl: string;
}

interface VehicleDto {
  id: string;
  name: string;
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

type ReminderIntervalType = 'mileage' | 'time';

const intervalTypeToValue: Record<ReminderIntervalType, number> = {
  mileage: 0,
  time: 1,
};

const MaintenanceEntryCreatePage: React.FC = () => {
  const history = useHistory();

  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    vehicleId: '',
    maintenanceType: '',
    serviceDate: '',
    odometerReadingKm: '',
    notes: '',
    receiptImagePath: '',
    reminderEnabled: false,
    reminderIntervalType: 'mileage' as ReminderIntervalType,
    reminderIntervalValue: '',
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const { name, value } = target;
    const isCheckbox = target instanceof HTMLInputElement && target.type === 'checkbox';

    setForm((prev) => ({
      ...prev,
      [name]: isCheckbox ? (target as HTMLInputElement).checked : value,
    }));
    setError(null);
    setSuccess(null);
  };

  const validate = (): boolean => {
    if (!form.vehicleId) {
      setError('Vehicle selection is required.');
      return false;
    }
    if (!form.maintenanceType.trim()) {
      setError('Maintenance type is required.');
      return false;
    }
    if (!form.serviceDate) {
      setError('Service date is required.');
      return false;
    }
    if (!form.odometerReadingKm || Number(form.odometerReadingKm) < 0) {
      setError('Odometer reading must be zero or greater.');
      return false;
    }
    if (form.reminderEnabled) {
      if (!form.reminderIntervalValue || Number(form.reminderIntervalValue) <= 0) {
        setError('Reminder interval must be greater than zero when reminders are enabled.');
        return false;
      }
    }
    return true;
  };

  const buildReminderPayload = () => {
    if (!form.reminderEnabled) {
      return null;
    }

    return {
      intervalType: intervalTypeToValue[form.reminderIntervalType],
      intervalValue: Number(form.reminderIntervalValue),
    };
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
        maintenanceType: form.maintenanceType.trim(),
        serviceDate: form.serviceDate,
        odometerReadingKm: Number(form.odometerReadingKm),
        notes: form.notes.trim() ? form.notes.trim() : null,
        receiptImagePath: form.receiptImagePath.trim() ? form.receiptImagePath.trim() : null,
        reminder: buildReminderPayload(),
      };

      const response = await axios.post(`${apiBaseUrl}/api/maintenancerecords`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 201) {
        setSuccess('Maintenance record saved successfully.');
        setForm({
          vehicleId: '',
          maintenanceType: '',
          serviceDate: '',
          odometerReadingKm: '',
          notes: '',
          receiptImagePath: '',
          reminderEnabled: false,
          reminderIntervalType: 'mileage',
          reminderIntervalValue: '',
        });
      } else {
        setError('Failed to create maintenance record. Please try again.');
      }
    } catch (err: any) {
      console.error('Maintenance record creation error', err);

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
        validationMessage || backendDetail || backendError || backendTitle || 'Failed to create maintenance record.'
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
            onClick={() => history.push('/maintenance-records')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            View Maintenance Records
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">Add Maintenance Record</h1>
        <p className="text-gray-600 mb-6 text-center text-sm sm:text-base">
          Log maintenance work and optional reminders so you never miss the next service. Fields marked with * are required.
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
              <p className="mt-1 text-xs text-gray-500">No vehicles available. Add a vehicle first so you can log maintenance.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="maintenanceType" className="block text-sm font-medium text-gray-700 mb-1">
                Maintenance Type *
              </label>
              <input
                id="maintenanceType"
                name="maintenanceType"
                type="text"
                value={form.maintenanceType}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Oil change"
              />
            </div>

            <div>
              <label htmlFor="serviceDate" className="block text-sm font-medium text-gray-700 mb-1">
                Service Date *
              </label>
              <input
                id="serviceDate"
                name="serviceDate"
                type="date"
                value={form.serviceDate}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Add any technician notes or upcoming needs"
            />
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Reminder</p>
                <p className="text-xs text-gray-500">Set a schedule so we'll nudge you when the next service is due.</p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="reminderEnabled"
                  checked={form.reminderEnabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Enable</span>
              </label>
            </div>

            {form.reminderEnabled && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reminderIntervalType" className="block text-sm font-medium text-gray-700 mb-1">
                      Interval Type
                    </label>
                    <select
                      id="reminderIntervalType"
                      name="reminderIntervalType"
                      value={form.reminderIntervalType}
                      onChange={handleChange}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="mileage">Mileage (km)</option>
                      <option value="time">Time (days)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="reminderIntervalValue" className="block text-sm font-medium text-gray-700 mb-1">
                      Interval Value
                    </label>
                    <input
                      id="reminderIntervalValue"
                      name="reminderIntervalValue"
                      type="number"
                      min="1"
                      value={form.reminderIntervalValue}
                      onChange={handleChange}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder={form.reminderIntervalType === 'mileage' ? 'e.g. 10000 km' : 'e.g. 180 days'}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Mileage reminders will trigger once the odometer increases by the interval value. Time reminders use the service date plus the number of days specified.
                </p>
              </div>
            )}
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
              {loading ? 'Saving...' : 'Save Maintenance Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceEntryCreatePage;
