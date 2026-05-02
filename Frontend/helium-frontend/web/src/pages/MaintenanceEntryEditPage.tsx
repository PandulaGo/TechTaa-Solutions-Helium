import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useHistory, useParams } from 'react-router-dom';

interface AppSettings {
  apiBaseUrl: string;
}

interface VehicleDto {
  id: string;
  name: string;
}

interface MaintenanceRecordDto {
  id: string;
  vehicleId: string;
  vehicleVin?: string | null;
  maintenanceType: string;
  serviceDate: string;
  odometerReadingKm: number;
  notes?: string | null;
  receiptImagePath?: string | null;
  cost: number;
  garageName?: string | null;
  mechanicName?: string | null;
  workStatus: number;
  reminder?: MaintenanceReminderDto | null;
}

interface MaintenanceReminderDto {
  id?: string;
  intervalType: number;
  intervalValue: number;
  nextDueDate?: string | null;
  nextDueMileageKm?: number | null;
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

type ReminderIntervalType = 'mileage' | 'time';

const intervalTypeFromNumber = (value?: number): ReminderIntervalType => {
  if (value === 1) {
    return 'time';
  }
  return 'mileage';
};

const intervalTypeToNumber = (value: ReminderIntervalType): number => (value === 'time' ? 1 : 0);

const MaintenanceEntryEditPage: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();

  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    vehicleId: '',
    maintenanceType: '',
    serviceDate: '',
    odometerReadingKm: '',
    notes: '',
    receiptImagePath: '',
    cost: '',
    garageName: '',
    mechanicName: '',
    workStatus: '0',
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

  useEffect(() => {
    const loadRecord = async () => {
      if (!apiBaseUrl || !id) {
        return;
      }

      setLoadingRecord(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<MaintenanceRecordDto>(`${apiBaseUrl}/api/maintenancerecords/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const record = response.data;
        setForm({
          vehicleId: record.vehicleId,
          maintenanceType: record.maintenanceType,
          serviceDate: record.serviceDate,
          odometerReadingKm: record.odometerReadingKm.toString(),
          notes: record.notes ?? '',
          receiptImagePath: record.receiptImagePath ?? '',
          cost: record.cost ? record.cost.toString() : '',
          garageName: record.garageName ?? '',
          mechanicName: record.mechanicName ?? '',
          workStatus: record.workStatus !== undefined ? record.workStatus.toString() : '2',
          reminderEnabled: Boolean(record.reminder),
          reminderIntervalType: intervalTypeFromNumber(record.reminder?.intervalType),
          reminderIntervalValue: record.reminder?.intervalValue ? record.reminder.intervalValue.toString() : '',
        });
      } catch (err: any) {
        console.error('Failed to load maintenance record', err);
        const backendDetail = err?.response?.data?.detail as string | undefined;
        setError(backendDetail || 'Unable to load maintenance record.');
      } finally {
        setLoadingRecord(false);
      }
    };

    if (!loadingSettings && apiBaseUrl) {
      loadRecord();
    }
  }, [apiBaseUrl, loadingSettings, id]);

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
      intervalType: intervalTypeToNumber(form.reminderIntervalType),
      intervalValue: Number(form.reminderIntervalValue),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!apiBaseUrl || !id) {
      setError('Backend URL is not loaded yet. Please try again in a moment.');
      return;
    }

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        maintenanceType: form.maintenanceType.trim(),
        serviceDate: form.serviceDate,
        odometerReadingKm: Number(form.odometerReadingKm),
        notes: form.notes.trim() ? form.notes.trim() : null,
        receiptImagePath: form.receiptImagePath.trim() ? form.receiptImagePath.trim() : null,
        cost: Number(form.cost) || 0,
        garageName: form.garageName.trim() || null,
        mechanicName: form.mechanicName.trim() || null,
        workStatus: Number(form.workStatus),
        reminder: buildReminderPayload(),
      };

      await axios.put(`${apiBaseUrl}/api/maintenancerecords/${id}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setSuccess('Maintenance record updated successfully.');
    } catch (err: any) {
      console.error('Maintenance record update error', err);

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
        validationMessage || backendDetail || backendError || backendTitle || 'Failed to update maintenance record.'
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
            onClick={() => history.push('/maintenance-records')}
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Maintenance
          </button>
          <button
            type="button"
            onClick={() => history.push('/dashboard')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            Dashboard
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">Edit Maintenance Record</h1>
        <p className="text-gray-600 mb-6 text-center text-sm sm:text-base">
          Update maintenance details or adjust the reminder schedule if plans have changed.
        </p>

        {(loadingSettings || loadingVehicles || loadingRecord) && (
          <div className="mb-4 text-indigo-600 text-sm">Loading maintenance record...</div>
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
              disabled
              className="block w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-gray-50"
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Maintenance records remain tied to the original vehicle.</p>
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
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                Cost
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="cost"
                  name="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="garageName" className="block text-sm font-medium text-gray-700 mb-1">
                Garage Name
              </label>
              <input
                id="garageName"
                name="garageName"
                type="text"
                value={form.garageName}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Speedy Auto"
              />
            </div>

            <div>
              <label htmlFor="mechanicName" className="block text-sm font-medium text-gray-700 mb-1">
                Mechanic Name
              </label>
              <input
                id="mechanicName"
                name="mechanicName"
                type="text"
                value={form.mechanicName}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. John Smith"
              />
            </div>
          </div>

          <div>
            <label htmlFor="workStatus" className="block text-sm font-medium text-gray-700 mb-1">
              Work Status
            </label>
            <select
              id="workStatus"
              name="workStatus"
              value={form.workStatus}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="0">Scheduled</option>
              <option value="1">In Progress</option>
              <option value="2">Completed</option>
            </select>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Reminder</p>
                <p className="text-xs text-gray-500">Adjust or disable the reminder for the next service.</p>
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
              onClick={() => history.push('/maintenance-records')}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Update Maintenance Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceEntryEditPage;
