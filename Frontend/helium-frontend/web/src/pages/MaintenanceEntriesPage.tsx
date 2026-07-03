import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  cost: number;
  garageName?: string | null;
  mechanicName?: string | null;
  workStatus: number;
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
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const loadEntries = useCallback(async () => {
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
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!loadingSettings && apiBaseUrl) {
      loadEntries();
    }
  }, [apiBaseUrl, loadingSettings, loadEntries]);

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
    let result = entries;

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((entry) => getStatusBucket(entry) === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((entry) => {
        const searchableText = [
          entry.maintenanceType,
          entry.notes,
          entry.garageName,
          entry.mechanicName,
          entry.vehicleVin,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    return result;
  }, [entries, statusFilter, searchQuery]);

  const odometerGroupCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const entry of entries) {
      counts[entry.odometerReadingKm] = (counts[entry.odometerReadingKm] || 0) + 1;
    }
    return counts;
  }, [entries]);

  const getWorkStatusLabel = (status: number): { label: string; color: string } => {
    switch (status) {
      case 0:
        return { label: 'Scheduled', color: 'bg-blue-50 text-blue-700' };
      case 1:
        return { label: 'In Progress', color: 'bg-yellow-50 text-yellow-800' };
      case 2:
        return { label: 'Completed', color: 'bg-green-50 text-green-700' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-600' };
    }
  };

  const statusBadge = (record: MaintenanceRecordDto) => {
    const status = getStatusBucket(record);
    if (status === 'due') {
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
          Due now
        </span>
      );
    }
    if (status === 'upcoming') {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
          Upcoming
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        Completed
      </span>
    );
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

        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Viewing maintenance history, due work, and reminders across your entire fleet.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Focus</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'All', value: 'all' as StatusBucket },
                { label: 'Upcoming', value: 'upcoming' as StatusBucket },
                { label: 'Due now', value: 'due' as StatusBucket },
                { label: 'Completed', value: 'history' as StatusBucket },
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Records
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by type, notes, garage, mechanic..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {searchQuery.trim() && (
            <p className="mt-1 text-xs text-gray-500">
              Showing {filteredEntries.length} of {entries.length} records
            </p>
          )}
        </div>

        <div className="overflow-hidden">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 w-8"></th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Odometer</th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reminder</th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingEntries ? (
                <tr>
                  <td colSpan={10} className="px-2 py-6 text-center text-sm text-gray-500">
                    Loading maintenance records...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-2 py-6 text-center text-sm text-gray-500">
                    No maintenance records recorded yet.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((record) => {
                  const groupCount = odometerGroupCounts[record.odometerReadingKm] || 1;
                  const wstatus = getWorkStatusLabel(record.workStatus);
                  const isExpanded = expandedRowId === record.id;
                  return (
                    <React.Fragment key={record.id}>
                      <tr>
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedRowId(isExpanded ? null : record.id)}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            <svg
                              className={`h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-2 py-3 text-sm">
                          <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                            {record.vehicleVin?.toUpperCase() || 'N/A'}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-sm text-gray-900">{record.serviceDate}</td>
                        <td className="px-2 py-3 text-sm text-gray-700 truncate max-w-[120px]">{record.maintenanceType}</td>
                        <td className="px-2 py-3 text-sm text-gray-600">
                          <div className="inline-flex items-center gap-1">
                            {record.odometerReadingKm.toLocaleString()} km
                            {groupCount > 1 && (
                              <span
                                className="inline-flex items-center rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 cursor-default"
                                title={`${groupCount} services at ${record.odometerReadingKm.toLocaleString()} km`}
                              >
                                &times;{groupCount}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-sm text-right text-gray-900">
                          {record.cost > 0 ? `$${record.cost.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-2 py-3 text-sm">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${wstatus.color}`}>
                            {wstatus.label}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-sm text-gray-600">{renderNextDue(record)}</td>
                        <td className="px-2 py-3 text-sm">{statusBadge(record)}</td>
                        <td className="px-2 py-3 text-right text-sm">
                          <div className="inline-flex items-center gap-1">
                            {record.receiptImagePath && (
                              <a
                                href={record.receiptImagePath}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-md border border-transparent bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                              >
                                Receipt
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleUpdate(record.id)}
                              className="rounded-md border border-transparent bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                            >
                              Update
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(record.id)}
                              className="rounded-md border border-transparent bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className="px-2 py-4 bg-gray-50">
                            <div className="space-y-3">
                              {record.notes && (
                                <div>
                                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</h4>
                                  <div className="bg-white rounded border border-gray-200 p-3">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{record.notes}</p>
                                  </div>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                {record.garageName && (
                                  <div>
                                    <span className="text-gray-500">Garage:</span> {record.garageName}
                                  </div>
                                )}
                                {record.mechanicName && (
                                  <div>
                                    <span className="text-gray-500">Mechanic:</span> {record.mechanicName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceEntriesPage;
