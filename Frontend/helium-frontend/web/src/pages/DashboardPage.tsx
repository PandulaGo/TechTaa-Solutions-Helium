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

interface MaintenanceReminderDto {
  nextDueDate?: string | null;
  nextDueMileageKm?: number | null;
}

interface MaintenanceRecordDto {
  id: string;
  vehicleId: string;
  vehicleVin?: string | null;
  maintenanceType: string;
  serviceDate: string;
  reminder?: MaintenanceReminderDto | null;
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

interface FuelSummary {
  totalCost: number;
  totalMileageKm: number;
  vehicleVins: string[];
}

interface MaintenanceSummary {
  dueThisMonth: number;
  remainingThisMonth: number;
}

interface DashboardSummary {
  vehicleCount: number;
  iceSummary: FuelSummary;
  evSummary: FuelSummary;
  maintenanceSummary: MaintenanceSummary;
}

interface EnergyTrendPoint {
  month: number;
  monthLabel: string;
  fuelCost: number;
  chargingCost: number;
  fuelVolumeLiters: number;
  energyConsumedKwh: number;
  totalCost: number;
  totalUsage: number;
}

const DashboardPage: React.FC = () => {
  const history = useHistory();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [dueReminders, setDueReminders] = useState<MaintenanceRecordDto[]>([]);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [energyTrend, setEnergyTrend] = useState<EnergyTrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    []
  );

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(new Date());
  }, []);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const formatCurrency = (value: number) => currencyFormatter.format(value);
  const formatNumber = (value: number) => value.toLocaleString();
  const formatQuantity = (value: number, unit: string) =>
    `${value.toLocaleString(undefined, {
      maximumFractionDigits: 1,
      minimumFractionDigits: value > 0 && value < 10 ? 1 : 0,
    })} ${unit}`;

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/appsettings.json');
        const data: AppSettings = await response.json();
        setApiBaseUrl(data.apiBaseUrl);
      } catch (err) {
        console.error('Failed to load appsettings.json', err);
        setNotificationError('Unable to load dashboard settings.');
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const loadVehicles = async () => {
      if (!apiBaseUrl) {
        return;
      }

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
      } catch (err) {
        console.error('Failed to load vehicles for notifications', err);
      }
    };

    if (apiBaseUrl) {
      loadVehicles();
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    const loadSummary = async () => {
      if (!apiBaseUrl) {
        return;
      }

      setStatsLoading(true);
      setStatsError(null);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<DashboardSummary>(`${apiBaseUrl}/api/dashboard/summary`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        setSummary(response.data);
      } catch (err: any) {
        console.error('Failed to load dashboard summary', err);
        const backendDetail = err?.response?.data?.detail as string | undefined;
        setStatsError(backendDetail || 'Unable to load dashboard stats.');
      } finally {
        setStatsLoading(false);
      }
    };

    if (apiBaseUrl) {
      loadSummary();
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    const loadEnergyTrend = async () => {
      if (!apiBaseUrl) {
        return;
      }

      setTrendLoading(true);
      setTrendError(null);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<EnergyTrendPoint[]>(`${apiBaseUrl}/api/dashboard/energy-trend`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          params: {
            year: currentYear,
          },
        });

        setEnergyTrend(response.data ?? []);
      } catch (err: any) {
        console.error('Failed to load energy trend', err);
        const backendDetail = err?.response?.data?.detail as string | undefined;
        setTrendError(backendDetail || 'Unable to load yearly usage trend.');
      } finally {
        setTrendLoading(false);
      }
    };

    if (apiBaseUrl) {
      loadEnergyTrend();
    }
  }, [apiBaseUrl, currentYear]);

  useEffect(() => {
    const loadDueReminders = async () => {
      if (!apiBaseUrl) {
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<MaintenanceRecordDto[]>(`${apiBaseUrl}/api/maintenancerecords/due`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        setDueReminders(response.data ?? []);
        setNotificationError(null);
      } catch (err) {
        console.error('Failed to load upcoming maintenance reminders', err);
        setNotificationError('Unable to check maintenance reminders right now.');
      }
    };

    if (apiBaseUrl) {
      loadDueReminders();
    }
  }, [apiBaseUrl]);

  const vehicleNameById = useMemo(() => {
    const map: Record<string, string> = {};
    vehicles.forEach((vehicle) => {
      map[vehicle.id] = vehicle.name;
    });
    return map;
  }, [vehicles]);

  const formatReminder = (record: MaintenanceRecordDto) => {
    if (record.reminder?.nextDueDate) {
      return `Due ${new Date(record.reminder.nextDueDate).toLocaleDateString()}`;
    }
    if (record.reminder?.nextDueMileageKm) {
      return `Due at ${record.reminder.nextDueMileageKm.toLocaleString()} km`;
    }
    return 'Reminder triggered';
  };

  const toggleFab = () => {
    setIsFabOpen((prev) => !prev);
  };

  const defaultFuelSummary: FuelSummary = {
    totalCost: 0,
    totalMileageKm: 0,
    vehicleVins: [],
  };

  const defaultMaintenanceSummary: MaintenanceSummary = {
    dueThisMonth: 0,
    remainingThisMonth: 0,
  };

  const iceStats = summary?.iceSummary ?? defaultFuelSummary;
  const evStats = summary?.evSummary ?? defaultFuelSummary;
  const maintenanceStats = summary?.maintenanceSummary ?? defaultMaintenanceSummary;
  const energyTrendTotals = useMemo(() => {
    return energyTrend.reduce(
      (acc, point) => {
        const fuelCost = point.fuelCost || 0;
        const evCost = point.chargingCost || 0;
        const totalCost = fuelCost + evCost;

        const fuelUsage = point.fuelVolumeLiters || 0;
        const evUsage = point.energyConsumedKwh || 0;
        const totalUsage = fuelUsage + evUsage;

        acc.totalCost += totalCost;
        acc.totalFuelUsage += fuelUsage;
        acc.totalEvUsage += evUsage;
        acc.maxCost = Math.max(acc.maxCost, totalCost);
        acc.maxUsage = Math.max(acc.maxUsage, totalUsage);
        return acc;
      },
      { totalCost: 0, totalFuelUsage: 0, totalEvUsage: 0, maxCost: 0, maxUsage: 0 }
    );
  }, [energyTrend]);
  const trendCostMax = energyTrendTotals.maxCost;
  const trendUsageMax = energyTrendTotals.maxUsage;
  const hasTrendPoints = energyTrend.length > 0;
  const energyTrendHasActivity = trendCostMax > 0 || trendUsageMax > 0;

  const renderVinBadges = (vins: string[]) => {
    if (!vins || vins.length === 0) {
      return <span className="text-xs text-gray-400">VINs not available</span>;
    }

    const maxVisible = 2;
    const visible = vins.slice(0, maxVisible);
    const remainder = vins.length - visible.length;

    return (
      <div className="mt-3 flex flex-wrap gap-1">
        {visible.map((vin) => (
          <span key={vin} className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
            {vin}
          </span>
        ))}
        {remainder > 0 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
            +{remainder} more
          </span>
        )}
      </div>
    );
  };

  const getStackPercent = (value: number, domainMax: number) => {
    if (domainMax <= 0) {
      return 0;
    }
    return (value / domainMax) * 100;
  };

  const statCards = [
    {
      key: 'vehicles',
      title: 'My Vehicles',
      primary: summary ? formatNumber(summary.vehicleCount) : '—',
      subtitle: 'Owned in fleet',
      description: 'Tap to manage your garage',
      onClick: () => history.push('/vehicles'),
      vins: null as string[] | null,
    },
    {
      key: 'ice',
      title: 'ICE Fuel Spend',
      primary: formatCurrency(iceStats.totalCost),
      subtitle: `${formatNumber(iceStats.totalMileageKm)} km in ${monthLabel}`,
      description: 'Tracks petrol, diesel, and hybrid refuels',
      onClick: () => history.push('/fuel-entries'),
      vins: iceStats.vehicleVins,
    },
    {
      key: 'ev',
      title: 'EV Charging Spend',
      primary: formatCurrency(evStats.totalCost),
      subtitle: `${formatNumber(evStats.totalMileageKm)} km in ${monthLabel}`,
      description: 'Based on charging sessions this month',
      onClick: () => history.push('/charging-entries'),
      vins: evStats.vehicleVins,
    },
  ];
  const trendLegend = [
    { key: 'fuel-cost', label: 'Fuel cost', color: 'bg-rose-500' },
    { key: 'ev-cost', label: 'EV cost', color: 'bg-emerald-400' },
    { key: 'fuel-usage', label: 'Fuel usage (L)', color: 'bg-orange-400' },
    { key: 'ev-usage', label: 'EV usage (kWh)', color: 'bg-violet-500' },
  ];

  const renderEnergyTrendBar = (point: EnergyTrendPoint) => {
    const fuelCost = point.fuelCost || 0;
    const evCost = point.chargingCost || 0;
    const fuelUsage = point.fuelVolumeLiters || 0;
    const evUsage = point.energyConsumedKwh || 0;
    const costDomain = trendCostMax > 0 ? trendCostMax : fuelCost + evCost;
    const usageDomain = trendUsageMax > 0 ? trendUsageMax : fuelUsage + evUsage;

    const costSegments = [
      {
        key: 'fuel-cost',
        value: fuelCost,
        className: 'bg-gradient-to-t from-rose-600 to-rose-400',
        label: `Fuel spend · ${formatCurrency(fuelCost)}`,
      },
      {
        key: 'ev-cost',
        value: evCost,
        className: 'bg-gradient-to-t from-emerald-500 to-emerald-300',
        label: `EV spend · ${formatCurrency(evCost)}`,
      },
    ];

    const usageSegments = [
      {
        key: 'fuel-usage',
        value: fuelUsage,
        className: 'bg-gradient-to-t from-orange-400 to-orange-300',
        label: `Fuel usage · ${formatQuantity(fuelUsage, 'L')}`,
      },
      {
        key: 'ev-usage',
        value: evUsage,
        className: 'bg-gradient-to-t from-violet-500 to-violet-300',
        label: `EV usage · ${formatQuantity(evUsage, 'kWh')}`,
      },
    ];

    return (
      <div key={point.month} className="flex flex-col items-center text-center">
        <div className="flex h-56 w-full items-end justify-center gap-4">
          <div className="flex h-full flex-col items-center gap-1">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Cost</p>
            <div className="flex h-full w-4 flex-col-reverse overflow-hidden rounded-full bg-gray-100 sm:w-5">
              {costSegments.map((segment) =>
                segment.value > 0 ? (
                  <div
                    key={segment.key}
                    className={segment.className}
                    style={{ height: `${getStackPercent(segment.value, costDomain)}%` }}
                    title={segment.label}
                  />
                ) : null
              )}
            </div>
            <p className="text-[10px] text-gray-500">{formatCurrency(fuelCost + evCost)}</p>
          </div>
          <div className="flex h-full flex-col items-center gap-1">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Usage</p>
            <div className="flex h-full w-4 flex-col-reverse overflow-hidden rounded-full bg-gray-100 sm:w-5">
              {usageSegments.map((segment) =>
                segment.value > 0 ? (
                  <div
                    key={segment.key}
                    className={segment.className}
                    style={{ height: `${getStackPercent(segment.value, usageDomain)}%` }}
                    title={segment.label}
                  />
                ) : null
              )}
            </div>
            <p className="text-[10px] text-gray-500">
              {fuelUsage > 0 && `${formatQuantity(fuelUsage, 'L')}`}
              {fuelUsage > 0 && evUsage > 0 && ' · '}
              {evUsage > 0 && `${formatQuantity(evUsage, 'kWh')}`}
              {fuelUsage === 0 && evUsage === 0 && 'No usage'}
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs font-semibold text-gray-700">{point.monthLabel}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white shadow-md flex flex-col">
        <div className="px-6 py-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">Helium Dashboard</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 text-sm">
          <a href="/dashboard" className="block px-3 py-2 rounded-md bg-blue-50 text-blue-700 font-medium">Overview</a>
          <a href="/vehicles" className="block px-3 py-2 rounded-md hover:bg-gray-100">Vehicles</a>
          <a href="/fuel-entries" className="block px-3 py-2 rounded-md hover:bg-gray-100">Fuel Entries</a>
          <a href="/charging-entries" className="block px-3 py-2 rounded-md hover:bg-gray-100">Charging Entries</a>
          <a href="/maintenance-records" className="block px-3 py-2 rounded-md hover:bg-gray-100">Maintenance</a>
          <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-100">Reports</a>
        </nav>
        <div className="px-4 py-4 border-t text-xs text-gray-500">
          Logged in sample user
        </div>
      </aside>

      {/* Main content */}
      <main className="relative flex-1 p-4 md:p-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Overview</h2>
            <p className="text-sm text-gray-500">Sample dashboard after successful login.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900"
                aria-label="Maintenance notifications"
              >
                <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                  {dueReminders.length}
                </span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6V4m0 2a6 6 0 00-6 6v3l-1.5 2h15L18 15v-3a6 6 0 00-6-6zm-3 12a3 3 0 006 0"
                  />
                </svg>
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-xl">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">Upcoming maintenance</p>
                    <p className="text-xs text-gray-500">
                      {notificationError || (dueReminders.length === 0 ? 'All caught up for now.' : 'Keep an eye on these reminders.')}
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {dueReminders.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">No reminders due.</div>
                    ) : (
                      dueReminders.map((record) => (
                        <div key={record.id} className="border-b border-gray-50 px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{record.maintenanceType}</p>
                          <p className="text-xs text-gray-500">
                            {vehicleNameById[record.vehicleId] || 'Vehicle'} · {formatReminder(record)}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = `/maintenance-records/${record.id}/edit`;
                            }}
                            className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            Review record
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = '/maintenance-records';
                      }}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Open maintenance center
                    </button>
                  </div>
                </div>
              )}
            </div>
            <a
              href="/login"
              className="text-sm text-red-600 hover:underline"
            >
              Log out
            </a>
          </div>
        </header>

        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Fleet Snapshot</h3>
            {statsLoading && <span className="text-xs text-gray-500">Refreshing…</span>}
          </div>
          {statsError && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
              {statsError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statCards.map((card) => (
              <button
                key={card.key}
                type="button"
                onClick={card.onClick}
                className="h-full rounded-lg border border-transparent bg-white p-4 text-left shadow transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{card.title}</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{card.primary}</div>
                <p className="text-sm text-gray-600">{card.subtitle}</p>
                <p className="mt-1 text-xs text-gray-400">{card.description}</p>
                {card.vins && renderVinBadges(card.vins)}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-2xl bg-white p-4 shadow md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Energy Spend & Usage</p>
              <p className="text-sm text-gray-500">Stacked cost and consumption overview for {currentYear}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Year-to-date spend</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(energyTrendTotals.totalCost)}</p>
              <p className="text-[11px] text-gray-500">
                Fuel {formatQuantity(energyTrendTotals.totalFuelUsage, 'L')} · EV {formatQuantity(energyTrendTotals.totalEvUsage, 'kWh')}
              </p>
            </div>
          </div>

          {trendError && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
              {trendError}
            </div>
          )}

          <div className="mt-4">
            {trendLoading ? (
              <div className="h-56 w-full animate-pulse rounded-2xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
            ) : hasTrendPoints ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12">
                  {energyTrend.map((point) => renderEnergyTrendBar(point))}
                </div>
                {!energyTrendHasActivity && (
                  <p className="mt-4 text-center text-xs text-gray-500">No fuel or charging usage logged for {currentYear} yet.</p>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-500">
                No fuel or charging history recorded for {currentYear} yet.
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
            {trendLegend.map((legend) => (
              <span key={legend.key} className="inline-flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${legend.color}`} />
                {legend.label}
              </span>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-2xl bg-white p-4 shadow md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Maintenance Outlook</p>
              <p className="text-sm text-gray-500">What is still due this month?</p>
            </div>
            <button
              type="button"
              onClick={() => history.push('/maintenance-records')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Open register →
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Due now / overdue</p>
              <p className="mt-2 text-4xl font-semibold text-red-600">{formatNumber(maintenanceStats.dueThisMonth)}</p>
              <p className="text-sm text-gray-500">Need attention this month.</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Remaining reminders</p>
              <p className="mt-2 text-4xl font-semibold text-amber-500">{formatNumber(maintenanceStats.remainingThisMonth)}</p>
              <p className="text-sm text-gray-500">Scheduled later in {monthLabel}.</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Quick tips</p>
            <ul className="mt-2 list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Review overdue tasks and log completed work.</li>
              <li>Schedule time for remaining reminders before month end.</li>
              <li>Attach receipts so your cost reports stay accurate.</li>
            </ul>
          </div>
        </section>

        {/* Floating action button */}
        <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8">
          {/* Expanded options */}
          {isFabOpen && (
            <div className="mb-3 flex flex-col items-end space-y-2">
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/vehicles/new';
                }}
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 shadow hover:bg-gray-50 border border-gray-200"
              >
                <span className="mr-2 text-gray-400 text-lg">+</span>
                Add Vehicle
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/fuel-entries/new';
                }}
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 shadow hover:bg-gray-50 border border-gray-200"
              >
                <span className="mr-2 text-gray-400 text-lg">+</span>
                Add Fuel Entry
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/charging-entries/new';
                }}
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 shadow hover:bg-gray-50 border border-gray-200"
              >
                <span className="mr-2 text-gray-400 text-lg">+</span>
                Add Charging Entry
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/maintenance-records/new';
                }}
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 shadow hover:bg-gray-50 border border-gray-200"
              >
                <span className="mr-2 text-gray-400 text-lg">+</span>
                Add Maintenance
              </button>
            </div>
          )}

          {/* Main + button */}
          <button
            type="button"
            onClick={toggleFab}
            aria-label="Add new record"
            className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center text-3xl sm:text-4xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isFabOpen ? '×' : '+'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
