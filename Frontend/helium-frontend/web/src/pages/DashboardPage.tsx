import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

interface AppSettings {
  apiBaseUrl: string;
}

interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  preferredCurrency: string;
}

interface VehicleSummaryDto {
  id: string;
  name: string;
  powertrainType: string;
  currentOdometerKm: number;
  monthlyFuelCost: number;
  monthlyChargingCost: number;
  monthlyMaintenanceCost: number;
  monthlyCost: number;
  nextMaintenanceType?: string | null;
  nextMaintenanceDue?: string | null;
  workStatus: number;
}

interface RecentActivityDto {
  id: string;
  activityType: string;
  vehicleName: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cost: number;
  activityDate: string;
}

interface FuelSummary {
  totalCost: number;
  totalMileageKm: number;
  vehicleVins: string[];
}

interface MaintenanceSummary {
  dueThisMonth: number;
  remainingThisMonth: number;
  totalCost: number;
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
  maintenanceCost: number;
  totalCost: number;
  totalUsage: number;
  grandTotalCost: number;
}

const DashboardPage: React.FC = () => {
  const history = useHistory();
  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null);
  const [user, setUser] = useState<UserDto | null>(null);
  const [vehicleSummaries, setVehicleSummaries] = useState<VehicleSummaryDto[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [energyTrend, setEnergyTrend] = useState<EnergyTrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityDto[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [chartHoveredMonth, setChartHoveredMonth] = useState<number | null>(null);

  const currency = user?.preferredCurrency || 'USD';

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
      }),
    [currency]
  );

  const monthLabel = useMemo(() => {
    const d = new Date();
    return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(d);
  }, []);

  const formatCurrency = (value: number) => currencyFormatter.format(value);
  const formatNumber = (value: number) => value.toLocaleString();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/appsettings.json');
        const data: AppSettings = await response.json();
        setApiBaseUrl(data.apiBaseUrl);
      } catch (err) {
        console.error('Failed to load appsettings.json', err);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      if (!apiBaseUrl) return;

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<UserDto>(`${apiBaseUrl}/api/users/me`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        setUser(response.data);
      } catch (err) {
        console.error('Failed to load user profile', err);
      }
    };

    if (apiBaseUrl) {
      loadUser();
    }
  }, [apiBaseUrl]);

  useEffect(() => {
     const loadSummary = async () => {
      if (!apiBaseUrl) {
        return;
      }

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
        // Stats error removed - no longer showing stats error UI
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
        const params: Record<string, any> = { year: selectedYear };
        if (selectedVehicleId) {
          params.vehicleId = selectedVehicleId;
        }
        const response = await axios.get<EnergyTrendPoint[]>(`${apiBaseUrl}/api/dashboard/energy-trend`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          params,
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
  }, [apiBaseUrl, selectedYear, selectedVehicleId]);

  useEffect(() => {
    const loadAvailableYears = async () => {
      if (!apiBaseUrl) return;

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<number[]>(`${apiBaseUrl}/api/dashboard/available-years`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        setAvailableYears(response.data ?? []);
      } catch (err) {
        console.error('Failed to load available years', err);
      }
    };

    if (apiBaseUrl) {
      loadAvailableYears();
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    const loadVehicleSummaries = async () => {
      if (!apiBaseUrl) return;

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<VehicleSummaryDto[]>(`${apiBaseUrl}/api/dashboard/vehicles`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        setVehicleSummaries(response.data ?? []);
      } catch (err) {
        console.error('Failed to load vehicle summaries', err);
      }
    };

    if (apiBaseUrl) {
      loadVehicleSummaries();
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    const loadRecentActivity = async () => {
      if (!apiBaseUrl) return;

      setActivityLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<RecentActivityDto[]>(`${apiBaseUrl}/api/dashboard/recent-activity`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          params: { count: 8 },
        });
        setRecentActivity(response.data ?? []);
      } catch (err) {
        console.error('Failed to load recent activity', err);
      } finally {
        setActivityLoading(false);
      }
    };

    if (apiBaseUrl) {
      loadRecentActivity();
    }
  }, [apiBaseUrl]);

  const defaultFuelSummary: FuelSummary = {
    totalCost: 0,
    totalMileageKm: 0,
    vehicleVins: [],
  };

  const defaultMaintenanceSummary: MaintenanceSummary = {
    dueThisMonth: 0,
    remainingThisMonth: 0,
    totalCost: 0,
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const iceStats = summary?.iceSummary ?? defaultFuelSummary;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const evStats = summary?.evSummary ?? defaultFuelSummary;
  const maintenanceStats = summary?.maintenanceSummary ?? defaultMaintenanceSummary;
  const energyTrendTotals = useMemo(() => {
    return energyTrend.reduce(
      (acc, point) => {
        const fuelCost = point.fuelCost || 0;
        const evCost = point.chargingCost || 0;
        const maintCost = point.maintenanceCost || 0;
        const totalCost = fuelCost + evCost;

        const fuelUsage = point.fuelVolumeLiters || 0;
        const evUsage = point.energyConsumedKwh || 0;
        const totalUsage = fuelUsage + evUsage;

        acc.totalCost += totalCost;
        acc.totalFuelUsage += fuelUsage;
        acc.totalEvUsage += evUsage;
        acc.totalMaintenanceCost += maintCost;
        acc.maxCost = Math.max(acc.maxCost, totalCost);
        acc.maxUsage = Math.max(acc.maxUsage, totalUsage);
        acc.maxMaintenanceCost = Math.max(acc.maxMaintenanceCost, maintCost);
        return acc;
      },
      { totalCost: 0, totalFuelUsage: 0, totalEvUsage: 0, totalMaintenanceCost: 0, maxCost: 0, maxUsage: 0, maxMaintenanceCost: 0 }
    );
  }, [energyTrend]);
  const trendCostMax = energyTrendTotals.maxCost;
  const trendUsageMax = energyTrendTotals.maxUsage;
  const trendMaintenanceMax = energyTrendTotals.maxMaintenanceCost;
  const hasTrendPoints = energyTrend.length > 0;
  const energyTrendHasActivity = trendCostMax > 0 || trendUsageMax > 0 || trendMaintenanceMax > 0;

  const getWorkStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Scheduled';
      case 1: return 'In Progress';
      case 2: return 'Completed';
      default: return 'Unknown';
    }
  };

  const getWorkStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-red-100 text-red-700';
      case 1: return 'bg-amber-100 text-amber-700';
      case 2: return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const trendLegend = [
    { key: 'fuel', label: 'Fuel cost', color: 'bg-blue-500' },
    { key: 'charging', label: 'Charging cost', color: 'bg-green-500' },
    { key: 'maintenance', label: 'Maintenance cost', color: 'bg-amber-500' },
  ];

  const renderLineChart = () => {
    const chartWidth = 800;
    const chartHeight = 300;
    const padding = { top: 20, right: 30, bottom: 40, left: 60 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const energyCosts = energyTrend.map(p => (p.fuelCost || 0) + (p.chargingCost || 0));
    const chargingCosts = energyTrend.map(p => p.chargingCost || 0);
    const maintCosts = energyTrend.map(p => p.maintenanceCost || 0);
    const yMax = Math.max(...energyCosts, ...chargingCosts, ...maintCosts, 1);
    const yStep = yMax > 100 ? Math.ceil(yMax / 5 / 50) * 50 : yMax > 10 ? Math.ceil(yMax / 5 / 10) * 10 : Math.ceil(yMax / 5);

    const xScale = (i: number) => padding.left + (i / 11) * innerWidth;
    const yScale = (v: number) => padding.top + innerHeight - (v / yMax) * innerHeight;

    const energyPath = energyCosts.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ');
    const chargingPath = chargingCosts.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ');
    const maintPath = maintCosts.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ');

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * chartWidth;
      const relX = x - padding.left;
      const monthIdx = Math.round((relX / innerWidth) * 11);
      setChartHoveredMonth(Math.max(0, Math.min(11, monthIdx)));
    };

    const handleMouseLeave = () => setChartHoveredMonth(null);

    const yGridLines = [];
    for (let v = 0; v <= yMax; v += yStep) {
      yGridLines.push(v);
    }

    return (
      <div className="mt-4">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {yGridLines.map((v) => (
            <g key={v}>
              <line x1={padding.left} y1={yScale(v)} x2={chartWidth - padding.right} y2={yScale(v)} stroke="#e5e7eb" strokeWidth="1" />
              <text x={padding.left - 8} y={yScale(v) + 4} textAnchor="end" className="text-[10px] fill-gray-400">
                {formatCurrency(v)}
              </text>
            </g>
          ))}

          {energyTrend.map((_, i) => (
            <text key={i} x={xScale(i)} y={chartHeight - 8} textAnchor="middle" className="text-[10px] fill-gray-500 font-medium">
              {energyTrend[i].monthLabel}
            </text>
          ))}

          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} stroke="#d1d5db" strokeWidth="1" />
          <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="#d1d5db" strokeWidth="1" />

          <path d={energyPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          <path d={chargingPath} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          <path d={maintPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          {energyCosts.map((v, i) => (
            <circle key={`e-${i}`} cx={xScale(i)} cy={yScale(v)} r={chartHoveredMonth === i ? 5 : 3} fill="#3b82f6" stroke="white" strokeWidth="1.5" />
          ))}
          {chargingCosts.map((v, i) => (
            <circle key={`c-${i}`} cx={xScale(i)} cy={yScale(v)} r={chartHoveredMonth === i ? 5 : 3} fill="#22c55e" stroke="white" strokeWidth="1.5" />
          ))}
          {maintCosts.map((v, i) => (
            <circle key={`m-${i}`} cx={xScale(i)} cy={yScale(v)} r={chartHoveredMonth === i ? 5 : 3} fill="#f59e0b" stroke="white" strokeWidth="1.5" />
          ))}

          {chartHoveredMonth !== null && chartHoveredMonth < energyTrend.length && (
            <>
              <line x1={xScale(chartHoveredMonth)} y1={padding.top} x2={xScale(chartHoveredMonth)} y2={chartHeight - padding.bottom} stroke="#9ca3af" strokeWidth="1" strokeDasharray="4 2" />
              <rect x={Math.min(xScale(chartHoveredMonth) - 70, chartWidth - padding.right - 150)} y={8} width={150} height={56} rx={6} fill="white" stroke="#e5e7eb" strokeWidth="1" />
              <text x={Math.min(xScale(chartHoveredMonth) - 62, chartWidth - padding.right - 142)} y={24} className="text-[11px] fill-gray-700 font-semibold">
                {energyTrend[chartHoveredMonth].monthLabel} {selectedYear}
              </text>
              <text x={Math.min(xScale(chartHoveredMonth) - 62, chartWidth - padding.right - 142)} y={38} className="text-[10px] fill-blue-500">
                Fuel: {formatCurrency(energyCosts[chartHoveredMonth])}
              </text>
              <text x={Math.min(xScale(chartHoveredMonth) - 62, chartWidth - padding.right - 142)} y={52} className="text-[10px] fill-green-500">
                Charging: {formatCurrency(chargingCosts[chartHoveredMonth])}
              </text>
              <text x={Math.min(xScale(chartHoveredMonth) - 62, chartWidth - padding.right - 142)} y={66} className="text-[10px] fill-amber-500">
                Maintenance: {formatCurrency(maintCosts[chartHoveredMonth])}
              </text>
            </>
          )}
        </svg>
      </div>
    );
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Fuel':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h4l2 5v11a2 2 0 002 2h2a2 2 0 002-2V8l2-5h4" />
          </svg>
        );
      case 'Charging':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        );
      case 'Maintenance':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'Fuel': return 'text-orange-500 bg-orange-50';
      case 'Charging': return 'text-emerald-500 bg-emerald-50';
      case 'Maintenance': return 'text-indigo-500 bg-indigo-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
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
          <span className="block px-3 py-2 rounded-md text-gray-400 cursor-not-allowed">Reports</span>
        </nav>
        <div className="px-4 py-4 border-t text-xs text-gray-500">
          {user ? `${user.firstName} ${user.lastName}` : 'Loading user...'}
        </div>
      </aside>

      <main className="relative flex-1 p-4 md:p-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Overview</h2>
            <p className="text-sm text-gray-500">Welcome, {user?.firstName || 'User'}! ({currency})</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/login"
              className="text-sm text-red-600 hover:underline"
            >
              Log out
            </a>
          </div>
        </header>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            type="button"
            onClick={() => { window.location.href = '/vehicles/new'; }}
            className="inline-flex items-center rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-medium shadow hover:bg-blue-700 transition"
          >
            <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Vehicle
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = '/fuel-entries/new'; }}
            className="inline-flex items-center rounded-full bg-orange-500 text-white px-4 py-2 text-sm font-medium shadow hover:bg-orange-600 transition"
          >
            <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Fuel Entry
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = '/charging-entries/new'; }}
            className="inline-flex items-center rounded-full bg-emerald-500 text-white px-4 py-2 text-sm font-medium shadow hover:bg-emerald-600 transition"
          >
            <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Charging Entry
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = '/maintenance-records/new'; }}
            className="inline-flex items-center rounded-full bg-indigo-500 text-white px-4 py-2 text-sm font-medium shadow hover:bg-indigo-600 transition"
          >
            <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Maintenance
          </button>
        </div>

        {/* Cost Overview Section */}
        <section className="mb-8 rounded-2xl bg-white p-4 shadow md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Cost Overview</p>
              <p className="text-sm text-gray-500">Monthly energy and maintenance costs</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
              >
                <option value="">All Vehicles</option>
                {vehicleSummaries.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {trendError && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
              {trendError}
            </div>
          )}

          {trendLoading ? (
            <div className="mt-4 h-56 w-full animate-pulse rounded-2xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
          ) : hasTrendPoints ? (
            <>
              {renderLineChart()}
              {!energyTrendHasActivity && (
                <p className="mt-4 text-center text-xs text-gray-500">No costs logged for {selectedYear} yet.</p>
              )}
            </>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-500">
              No cost history recorded for {selectedYear} yet.
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
            {trendLegend.map((legend) => (
              <span key={legend.key} className="inline-flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${legend.color}`} />
                {legend.label}
              </span>
            ))}
          </div>
        </section>

        {/* Fleet Snapshot + Maintenance Outlook Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Fleet Snapshot */}
          <section className="rounded-2xl bg-white p-4 shadow md:p-6">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Fleet Snapshot</p>
              <p className="text-sm text-gray-500">Per-vehicle overview for {monthLabel}</p>
            </div>

            <div className="mt-4 overflow-x-auto">
              {vehicleSummaries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
                  No vehicles added yet. Add a vehicle to see its summary here.
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Vehicle</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Odometer</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Fuel</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Charging</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Maintenance</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Next Maintenance</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleSummaries.map((v) => (
                      <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-3 font-medium text-gray-900">{v.name}</td>
                        <td className="py-3 px-3 text-gray-600">{v.powertrainType}</td>
                        <td className="py-3 px-3 text-right text-gray-600">{formatNumber(v.currentOdometerKm)} km</td>
                        <td className="py-3 px-3 text-right font-semibold text-gray-900">{formatCurrency(v.monthlyFuelCost)}</td>
                        <td className="py-3 px-3 text-right font-semibold text-gray-900">{formatCurrency(v.monthlyChargingCost)}</td>
                        <td className="py-3 px-3 text-right font-semibold text-gray-900">{formatCurrency(v.monthlyMaintenanceCost)}</td>
                        <td className="py-3 px-3 text-gray-600">
                          {v.nextMaintenanceType ? (
                            <span>
                              {v.nextMaintenanceType}
                              {v.nextMaintenanceDue ? <span className="text-xs text-gray-400 ml-1">({v.nextMaintenanceDue})</span> : null}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${getWorkStatusColor(v.workStatus)}`}>
                            {getWorkStatusLabel(v.workStatus)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Maintenance Outlook */}
          <section className="rounded-2xl bg-white p-4 shadow md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Maintenance Outlook</p>
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

            <div className="grid grid-cols-1 gap-3">
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
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Maintenance spend</p>
                <p className="mt-2 text-4xl font-semibold text-blue-600">{formatCurrency(maintenanceStats.totalCost)}</p>
                <p className="text-sm text-gray-500">Total cost this month.</p>
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
        </div>

        {/* Recent Activity */}
        <section className="mb-8 rounded-2xl bg-white p-4 shadow md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Recent Activity</p>
              <p className="text-sm text-gray-500">Latest entries across all vehicles</p>
            </div>
          </div>

          {activityLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-gray-100" />
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-gray-100 rounded" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
              No recent activity. Start logging fuel, charging, or maintenance entries.
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getActivityColor(activity.activityType)}`}>
                    {getActivityIcon(activity.activityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.vehicleName} · {new Date(activity.activityDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(activity.cost)}</p>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">{activity.activityType}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
