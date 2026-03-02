import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

interface AppSettings {
  apiBaseUrl: string;
}

interface MaintenanceReminderDto {
  intervalType: number;
  intervalValue: number;
  nextDueDate?: string | null;
  nextDueMileageKm?: number | null;
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
  reminder?: MaintenanceReminderDto | null;
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

type StatusBucket = 'all' | 'upcoming' | 'due' | 'history';

const UPCOMING_DAY_THRESHOLD = 30;

const MaintenanceEntriesPage: React.FC = () => {
  const history = useHistory();

  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [entries, setEntries] = useState<MaintenanceRecordDto[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusBucket>('all');

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
      const response = await axios.get<PagedResult<MaintenanceRecordDto>>(
        `${apiBaseUrl}/api/maintenancerecords`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          params: {
            page: 1,
            pageSize: 200,
            sortBy: 'date',
            sortDirection: 'desc',
          },
        }
      );

      setEntries(response.data?.items ?? []);
    } catch (err: any) {
      console.error('Failed to load maintenance entries', err);
      const backendDetail = err?.response?.data?.detail as string | undefined;
      setError(backendDetail || 'Unable to load maintenance records.');
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    if (!loadingSettings && apiBaseUrl) {
      loadEntries();
    }
  }, [apiBaseUrl, loadingSettings]);

  const handleDelete = async (recordId: string) => {
    if (!apiBaseUrl) {
      return;
    }

    const confirmed = window.confirm('Delete this maintenance record? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${apiBaseUrl}/api/maintenancerecords/${recordId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setSuccess('Maintenance record deleted.');
      await loadEntries();
    } catch (err: any) {
      console.error('Failed to delete maintenance record', err);
      const backendDetail = err?.response?.data?.detail as string | undefined;
      setError(backendDetail || 'Failed to delete maintenance record.');
    }
  };

  const handleUpdate = (recordId: string) => {
    history.push(`/maintenance-records/${recordId}/edit`);
  };

  const getStatusBucket = (record: MaintenanceRecordDto): StatusBucket => {
    const reminder = record.reminder;
    if (!reminder) {
      return 'history';
    }

    const today = new Date();
    if (reminder.nextDueDate) {
      const dueDate = new Date(reminder.nextDueDate);
      if (dueDate <= today) {
        return 'due';
      }
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= UPCOMING_DAY_THRESHOLD) {
        return 'upcoming';
      }
      return 'history';
    }

    if (reminder.nextDueMileageKm) {
      return 'upcoming';
    }

    return 'history';
  };

  const filteredEntries = useMemo(() => {
    if (statusFilter === 'all') {
      return entries;
    }
    return entries.filter((entry) => getStatusBucket(entry) === statusFilter);
  }, [entries, statusFilter]);

  const statusBadge = (record: MaintenanceRecordDto) => {
    const status = getStatusBucket(record);
    if (status === 'due') {
      return <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">Due now</span>;
    }
    if (status === 'upcoming') {
      return <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Upcoming</span>;
    }
    return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">Logged</span>;
  };

  const renderNextDue = (record: MaintenanceRecordDto) => {
    if (record.reminder?.nextDueDate) {
      return new Date(record.reminder.nextDueDate).toLocaleDateString();
    }
    if (record.reminder?.nextDueMileageKm) {
      return `${record.reminder.nextDueMileageKm.toLocaleString()} km`;
    }
    return '—';
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
            <h1 className="text-2xl font-semibold text-gray-900">Maintenance Records</h1>
            <p className="text-sm text-gray-500">Review upcoming work, overdue tasks, and your service history.</p>
          </div>
          <button
            type="button"
            onClick={() => history.push('/maintenance-records/new')}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            + Add Maintenance
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

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Viewing maintenance history, due work, and reminders across your entire fleet. Bring back filters later if you need to zero in on a specific VIN.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Focus</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'All', value: 'all' as StatusBucket },
                { label: 'Upcoming', value: 'upcoming' as StatusBucket },
                { label: 'Due now', value: 'due' as StatusBucket },
                { label: 'History', value: 'history' as StatusBucket },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border ${
                    statusFilter === option.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Odometer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingEntries ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading maintenance records...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                    No maintenance records recorded yet.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                        {record.vehicleVin?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{record.serviceDate}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{record.maintenanceType}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {record.odometerReadingKm.toLocaleString()} km
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{renderNextDue(record)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{statusBadge(record)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                      {record.notes || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="inline-flex items-center gap-2">
                        {record.receiptImagePath && (
                          <a
                            href={record.receiptImagePath}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-transparent bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                          >
                            Receipt
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleUpdate(record.id)}
                          className="rounded-md border border-transparent bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(record.id)}
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

export default MaintenanceEntriesPage;
