using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Helium.Application.Models.Dashboard;

namespace Helium.Application.Interfaces.Services;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(Guid userId, DateOnly monthStart, DateOnly monthEnd, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EnergyTrendPointDto>> GetYearlyEnergyTrendAsync(Guid userId, int year, Guid? vehicleId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<int>> GetAvailableYearsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<VehicleSummaryDto>> GetVehicleSummariesAsync(Guid userId, DateOnly monthStart, DateOnly monthEnd, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RecentActivityDto>> GetRecentActivityAsync(Guid userId, int count, CancellationToken cancellationToken = default);
}
