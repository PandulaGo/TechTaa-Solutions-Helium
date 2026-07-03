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
  kmPerLiter?: number | null;
  kmPerKwh?: number | null;
  costPerKm?: number | null;
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
  distanceKm: number;
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
  const [fuelTrendVehicleId, setFuelTrendVehicleId] = useState<string>('');
  const [fuelTrendData, setFuelTrendData] = useState<EnergyTrendPoint[]>([]);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [fuelTrendHoveredPoint, setFuelTrendHoveredPoint] = useState<number | null>(null);
  const [efficiencyVehicleId, setEfficiencyVehicleId] = useState<string>('');

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
    const loadFuelTrend = async () => {
      if (!apiBaseUrl) return;

      try {
        const token = localStorage.getItem('token');
        const currentYear = new Date().getFullYear();
        const params: Record<string, any> = { year: currentYear };
        if (fuelTrendVehicleId) params.vehicleId = fuelTrendVehicleId;

        const response = await axios.get<EnergyTrendPoint[]>(`${apiBaseUrl}/api/dashboard/energy-trend`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          params,
        });

        setFuelTrendData(response.data ?? []);
      } catch (err) {
        console.error('Failed to load fuel trend', err);
      }
    };

    if (apiBaseUrl) {
      loadFuelTrend();
    }
  }, [apiBaseUrl, fuelTrendVehicleId]);

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
    const chartHeight = 130;
    const padding = { top: 10, right: 20, bottom: 25, left: 45 };
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
              <line x1={padding.left} y1={yScale(v)} x2={chartWidth - padding.right} y2={yScale(v)} stroke="#e5e7eb" strokeWidth="0.5" />
              <text x={padding.left - 6} y={yScale(v) + 3} textAnchor="end" fill="#9ca3af" fontSize="5">
                {formatCurrency(v)}
              </text>
            </g>
          ))}

          {energyTrend.map((_, i) => (
            <text key={i} x={xScale(i)} y={chartHeight - 6} textAnchor="middle" fill="#6b7280" fontWeight="500" fontSize="5">
              {energyTrend[i].monthLabel}
            </text>
          ))}

          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} stroke="#d1d5db" strokeWidth="0.5" />
          <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="#d1d5db" strokeWidth="0.5" />

          <path d={energyPath} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          <path d={chargingPath} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          <path d={maintPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

          {energyCosts.map((v, i) => (
            <circle key={`e-${i}`} cx={xScale(i)} cy={yScale(v)} r={chartHoveredMonth === i ? 3.5 : 2} fill="#3b82f6" stroke="white" strokeWidth="1" />
          ))}
          {chargingCosts.map((v, i) => (
            <circle key={`c-${i}`} cx={xScale(i)} cy={yScale(v)} r={chartHoveredMonth === i ? 3.5 : 2} fill="#22c55e" stroke="white" strokeWidth="1" />
          ))}
          {maintCosts.map((v, i) => (
            <circle key={`m-${i}`} cx={xScale(i)} cy={yScale(v)} r={chartHoveredMonth === i ? 3.5 : 2} fill="#f59e0b" stroke="white" strokeWidth="1" />
          ))}

          {chartHoveredMonth !== null && chartHoveredMonth < energyTrend.length && (
            <>
              <line x1={xScale(chartHoveredMonth)} y1={padding.top} x2={xScale(chartHoveredMonth)} y2={chartHeight - padding.bottom} stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="3 2" />
              <rect x={Math.min(xScale(chartHoveredMonth) - 50, chartWidth - padding.right - 110)} y={4} width={110} height={34} rx={3} fill="white" stroke="#e5e7eb" strokeWidth="0.5" />
              <text x={Math.min(xScale(chartHoveredMonth) - 44, chartWidth - padding.right - 104)} y={11} fill="#374151" fontWeight="600" fontSize="4" className="font-sans">
                {energyTrend[chartHoveredMonth].monthLabel} {selectedYear}
              </text>
              <text x={Math.min(xScale(chartHoveredMonth) - 44, chartWidth - padding.right - 104)} y={17} fill="#3b82f6" fontSize="4" className="font-sans">
                Fuel: {formatCurrency(energyCosts[chartHoveredMonth])}
              </text>
              <text x={Math.min(xScale(chartHoveredMonth) - 44, chartWidth - padding.right - 104)} y={23} fill="#22c55e" fontSize="4" className="font-sans">
                Charge: {formatCurrency(chargingCosts[chartHoveredMonth])}
              </text>
              <text x={Math.min(xScale(chartHoveredMonth) - 44, chartWidth - padding.right - 104)} y={29} fill="#f59e0b" fontSize="4" className="font-sans">
                Maint: {formatCurrency(maintCosts[chartHoveredMonth])}
              </text>
              <text x={Math.min(xScale(chartHoveredMonth) - 44, chartWidth - padding.right - 104)} y={35} fill="#a855f7" fontSize="4" className="font-sans">
                Dist: {formatNumber(energyTrend[chartHoveredMonth].distanceKm)}km
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
    <div className="h-screen flex flex-col md:flex-row bg-gray-100 overflow-hidden">
      <aside className={`${sidebarExpanded ? 'w-64' : 'w-14'} transition-all duration-200 bg-white shadow-md flex flex-col flex-shrink-0 overflow-hidden`}>
        {sidebarExpanded ? (
          <>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h1 className="text-xl font-bold text-blue-600">Helium</h1>
              <button
                type="button"
                onClick={() => setSidebarExpanded(false)}
                className="h-7 w-7 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label="Collapse sidebar"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2 text-sm">
              <a href="/dashboard" className="block px-3 py-2 rounded-md bg-blue-50 text-blue-700 font-medium">Overview</a>
              <a href="/vehicles" className="block px-3 py-2 rounded-md hover:bg-gray-100">Vehicles</a>
              <a href="/fuel-entries" className="block px-3 py-2 rounded-md hover:bg-gray-100">Fuel Entries</a>
              <a href="/charging-entries" className="block px-3 py-2 rounded-md hover:bg-gray-100">Charging Entries</a>
              <a href="/maintenance-records" className="block px-3 py-2 rounded-md hover:bg-gray-100">Maintenance</a>
              <span className="block px-3 py-2 rounded-md text-gray-400 cursor-not-allowed">Reports</span>
            </nav>
            <div className="px-4 py-3 border-t">
              <p className="text-xs text-gray-500 mb-2">
                {user ? `${user.firstName} ${user.lastName}` : 'Loading user...'}
              </p>
              <a
                href="/login"
                className="block text-center px-3 py-2 rounded-md bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition"
              >
                Log out
              </a>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center py-4">
            <button
              type="button"
              onClick={() => setSidebarExpanded(true)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              aria-label="Expand sidebar"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </aside>

      <main className="relative flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Overview</h2>
            <p className="text-sm text-gray-500">Welcome, {user?.firstName || 'User'}! ({currency})</p>
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

        {/* Cost Overview - Full Row */}
        <section className="rounded-xl bg-white p-3 shadow mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Cost Overview</p>
              <p className="text-xs text-gray-500">Monthly energy and maintenance costs</p>
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
            <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
              {trendError}
            </div>
          )}

          {trendLoading ? (
            <div className="mt-2 h-32 w-full animate-pulse rounded-xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
          ) : hasTrendPoints ? (
            <>
              {renderLineChart()}
              {!energyTrendHasActivity && (
                <p className="mt-2 text-center text-xs text-gray-500">No costs logged for {selectedYear} yet.</p>
              )}
            </>
          ) : (
            <div className="mt-2 rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
              No cost history recorded for {selectedYear} yet.
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-gray-600">
            {trendLegend.map((legend) => (
              <span key={legend.key} className="inline-flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${legend.color}`} />
                {legend.label}
              </span>
            ))}
          </div>
        </section>

        {/* Fleet Snapshot + Maintenance Outlook + Price per Liter */}
        <div className="grid grid-cols-12 gap-4 mb-6">
          {/* Fleet Snapshot - 7 columns */}
          <section className="col-span-12 lg:col-span-7 rounded-xl bg-white p-4 shadow">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Fleet Snapshot</p>
              <p className="text-xs text-gray-500">Per-vehicle overview for {monthLabel}</p>
            </div>

            <div className="overflow-x-auto">
              {vehicleSummaries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-xs text-gray-500">
                  No vehicles added yet.
                </div>
              ) : (
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Vehicle</th>
                      <th className="text-right py-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Odometer</th>
                      <th className="text-right py-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Fuel</th>
                      <th className="text-right py-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Charge</th>
                      <th className="text-right py-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Maint</th>
                      <th className="text-center py-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleSummaries.map((v) => (
                      <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-2 font-medium text-gray-900">{v.name}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{formatNumber(v.currentOdometerKm)}</td>
                        <td className="py-2 px-2 text-right font-semibold text-gray-900">{formatCurrency(v.monthlyFuelCost)}</td>
                        <td className="py-2 px-2 text-right font-semibold text-gray-900">{formatCurrency(v.monthlyChargingCost)}</td>
                        <td className="py-2 px-2 text-right font-semibold text-gray-900">{formatCurrency(v.monthlyMaintenanceCost)}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${getWorkStatusColor(v.workStatus)}`}>
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

          {/* Average Fuel Efficiency - 2 columns */}
          <section className="col-span-12 lg:col-span-2 rounded-xl bg-white p-4 shadow">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Avg Fuel Efficiency</p>
              <p className="text-xs text-gray-500">km per liter</p>
            </div>

            <div className="flex items-center justify-between mb-3">
              <select
                value={efficiencyVehicleId}
                onChange={(e) => setEfficiencyVehicleId(e.target.value)}
                className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white w-full"
              >
                <option value="">All Vehicles</option>
                {vehicleSummaries.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center py-4">
              {(() => {
                let avgKmPerLiter: number | null = null;
                
                if (efficiencyVehicleId) {
                  const selectedVehicle = vehicleSummaries.find(v => v.id === efficiencyVehicleId);
                  avgKmPerLiter = selectedVehicle?.kmPerLiter ?? null;
                } else {
                  const vehiclesWithEfficiency = vehicleSummaries.filter(v => v.kmPerLiter != null);
                  if (vehiclesWithEfficiency.length > 0) {
                    const totalKmPerLiter = vehiclesWithEfficiency.reduce((sum, v) => sum + (v.kmPerLiter || 0), 0);
                    avgKmPerLiter = totalKmPerLiter / vehiclesWithEfficiency.length;
                  }
                }

                if (avgKmPerLiter == null) {
                  return <p className="text-xs text-gray-400 text-center">No data</p>;
                }

                return (
                  <div className="text-center">
                    <p className="text-5xl font-bold text-blue-600">{avgKmPerLiter.toFixed(1)}</p>
                    <p className="text-xs text-gray-500 mt-1">km/L</p>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* Maintenance Outlook - 1 column (narrower) */}
          <section className="col-span-12 lg:col-span-1 rounded-xl bg-white p-4 shadow">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Maintenance Outlook</p>
              <p className="text-xs text-gray-500">What is still due this month?</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Due now / overdue</p>
                <p className="mt-1 text-2xl font-semibold text-red-600">{formatNumber(maintenanceStats.dueThisMonth)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Remaining reminders</p>
                <p className="mt-1 text-2xl font-semibold text-amber-500">{formatNumber(maintenanceStats.remainingThisMonth)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Maintenance spend</p>
                <p className="mt-1 text-2xl font-semibold text-blue-600">{formatCurrency(maintenanceStats.totalCost)}</p>
              </div>
            </div>
          </section>

          {/* Price per Liter - 2 columns (matches Avg Fuel Efficiency) */}
          <section className="col-span-12 lg:col-span-2 rounded-xl bg-white p-4 shadow">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Price per Liter</p>
                <p className="text-xs text-gray-500">Monthly fuel price trend</p>
              </div>
              <select
                value={fuelTrendVehicleId}
                onChange={(e) => setFuelTrendVehicleId(e.target.value)}
                className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
              >
                <option value="">All Vehicles</option>
                {vehicleSummaries.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            {(() => {
              const points = fuelTrendData.map((p) =>
                p.fuelVolumeLiters > 0 ? p.fuelCost / p.fuelVolumeLiters : 0
              );
              const hasData = points.some((v) => v > 0);
              if (!hasData) {
                return <p className="text-xs text-gray-400 text-center py-6">No fuel costs logged this year.</p>;
              }

              const padding = { top: 10, right: 10, bottom: 10, left: 10 };
              const viewHeight = 120;
              const viewWidth = 300;
              const chartH = viewHeight - padding.top - padding.bottom;
              const chartW = viewWidth - padding.left - padding.right;
              const valMax = Math.max(...points, 1);

              const xScale = (i: number) => padding.left + (i / Math.max(points.length - 1, 1)) * chartW;
              const yScale = (v: number) => padding.top + chartH - (v / valMax) * chartH;

              const linePath = points
                .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`)
                .join(' ');

              const handleFuelTrendMove = (e: React.MouseEvent<SVGSVGElement>) => {
                const svg = e.currentTarget;
                const rect = svg.getBoundingClientRect();
                const mouseX = ((e.clientX - rect.left) / rect.width) * viewWidth;
                const idx = points.reduce((best, _, i) =>
                  Math.abs(xScale(i) - mouseX) < Math.abs(xScale(best) - mouseX) ? i : best, 0);
                setFuelTrendHoveredPoint(idx);
              };

              return (
                <svg
                  viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                  className="w-full"
                  style={{ height: viewHeight }}
                  onMouseMove={handleFuelTrendMove}
                  onMouseLeave={() => setFuelTrendHoveredPoint(null)}
                >
                  <line x1={padding.left} y1={padding.top + chartH} x2={padding.left + chartW} y2={padding.top + chartH} stroke="#e5e7eb" strokeWidth="0.5" />
                  <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                  {points.map((v, i) => (
                    <circle key={i} cx={xScale(i)} cy={yScale(v)}
                      r={fuelTrendHoveredPoint === i ? 3 : 2}
                      fill="#f59e0b" stroke="white" strokeWidth="1"
                    />
                  ))}
                  {fuelTrendHoveredPoint !== null && fuelTrendHoveredPoint < fuelTrendData.length && (
                    <g>
                      <line x1={xScale(fuelTrendHoveredPoint)} y1={padding.top + chartH} x2={xScale(fuelTrendHoveredPoint)} y2={padding.top} stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2,2" />
                      <rect
                        x={Math.max(padding.left, Math.min(xScale(fuelTrendHoveredPoint) - 45, viewWidth - 100))}
                        y={padding.top - 2}
                        width="90" height="28" rx="4"
                        fill="white" stroke="#d1d5db" strokeWidth="1"
                      />
                      <text
                        x={Math.max(padding.left + 45, Math.min(xScale(fuelTrendHoveredPoint), viewWidth - 45))}
                        y={padding.top + 10} textAnchor="middle"
                        fill="#6b7280" fontSize="5"
                      >
                        {fuelTrendData[fuelTrendHoveredPoint].monthLabel}
                      </text>
                      <text
                        x={Math.max(padding.left + 45, Math.min(xScale(fuelTrendHoveredPoint), viewWidth - 45))}
                        y={padding.top + 22} textAnchor="middle"
                        fill="#111827" fontWeight="600" fontSize="5"
                      >
                        {formatCurrency(points[fuelTrendHoveredPoint])}/L
                      </text>
                    </g>
                  )}
                </svg>
              );
            })()}
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
