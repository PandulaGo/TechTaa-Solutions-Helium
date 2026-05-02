using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Helium.Application.Interfaces.Persistence;
using Helium.Application.Interfaces.Services;
using Helium.Application.Models.Dashboard;
using Helium.Domain.Entities;
using Helium.Domain.Enums;

namespace Helium.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _unitOfWork;

    public DashboardService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public Task<DashboardSummaryDto> GetSummaryAsync(Guid userId, DateOnly monthStart, DateOnly monthEnd, CancellationToken cancellationToken = default)
    {
        var vehicles = _unitOfWork.Repository<Vehicle>().Query()
            .Where(v => v.UserId == userId)
            .ToList();

        var vehicleIds = vehicles.Select(v => v.Id).ToList();
        var iceVehicles = vehicles.Where(v => v.PowertrainType != PowertrainType.Electric).ToList();
        var evVehicles = vehicles.Where(v => v.PowertrainType == PowertrainType.Electric).ToList();
        var iceVehicleIds = iceVehicles.Select(v => v.Id).ToList();
        var evVehicleIds = evVehicles.Select(v => v.Id).ToList();

        var fuelEntries = _unitOfWork.Repository<FuelEntry>().Query()
            .Where(entry => entry.UserId == userId
                            && iceVehicleIds.Contains(entry.VehicleId)
                            && entry.Date >= monthStart
                            && entry.Date <= monthEnd)
            .ToList();

        var chargingEntries = _unitOfWork.Repository<ChargingEntry>().Query()
            .Where(entry => entry.UserId == userId
                            && evVehicleIds.Contains(entry.VehicleId)
                            && entry.Date >= monthStart
                            && entry.Date <= monthEnd)
            .ToList();

        var maintenanceRecordIds = _unitOfWork.Repository<MaintenanceRecord>().Query()
            .Where(r => vehicleIds.Contains(r.VehicleId))
            .Select(r => r.Id)
            .ToList();

        var maintenanceReminders = maintenanceRecordIds.Count == 0
            ? new List<MaintenanceReminder>()
            : _unitOfWork.Repository<MaintenanceReminder>().Query()
                .Where(r => maintenanceRecordIds.Contains(r.MaintenanceRecordId) && r.NextDueDate != null)
                .ToList();

        var summary = new DashboardSummaryDto
        {
            VehicleCount = vehicles.Count,
            IceSummary = BuildFuelSummary(iceVehicles, fuelEntries, e => e.VehicleId, e => e.OdometerReadingKm, e => e.Cost),
            EvSummary = BuildFuelSummary(evVehicles, chargingEntries, e => e.VehicleId, e => e.OdometerReadingKm, e => e.Cost),
            MaintenanceSummary = BuildMaintenanceSummary(maintenanceReminders, monthStart, monthEnd)
        };

        return Task.FromResult(summary);
    }

    public Task<IReadOnlyList<EnergyTrendPointDto>> GetYearlyEnergyTrendAsync(Guid userId, int year, CancellationToken cancellationToken = default)
    {
        var vehicleIds = _unitOfWork.Repository<Vehicle>().Query()
            .Where(v => v.UserId == userId)
            .Select(v => v.Id)
            .ToList();

        var boundedYear = year <= 0 ? DateTime.UtcNow.Year : year;
        var yearStart = new DateOnly(boundedYear, 1, 1);
        var yearEnd = new DateOnly(boundedYear, 12, 31);

        var fuelEntriesQuery = _unitOfWork.Repository<FuelEntry>().Query()
            .Where(entry => entry.UserId == userId
                            && entry.Date >= yearStart
                            && entry.Date <= yearEnd);

        var fuelEntries = fuelEntriesQuery.ToList();

        var chargingEntriesQuery = _unitOfWork.Repository<ChargingEntry>().Query()
            .Where(entry => entry.UserId == userId
                            && entry.Date >= yearStart
                            && entry.Date <= yearEnd);

        var chargingEntries = chargingEntriesQuery.ToList();

        var fuelByMonth = fuelEntries
            .GroupBy(entry => entry.Date.Month)
            .ToDictionary(
                group => group.Key,
                group => new
                {
                    Cost = group.Sum(e => e.Cost),
                    Volume = group.Sum(e => e.Liters)
                });

        var chargingByMonth = chargingEntries
            .GroupBy(entry => entry.Date.Month)
            .ToDictionary(
                group => group.Key,
                group => new
                {
                    Cost = group.Sum(e => e.Cost),
                    Energy = group.Sum(e => e.KwhUsed)
                });

        var monthNames = CultureInfo.CurrentCulture.DateTimeFormat.AbbreviatedMonthNames;
        var points = new List<EnergyTrendPointDto>(12);

        for (var month = 1; month <= 12; month++)
        {
            fuelByMonth.TryGetValue(month, out var fuelSnapshot);
            chargingByMonth.TryGetValue(month, out var chargingSnapshot);

            var monthLabel = monthNames.Length >= month
                ? monthNames[month - 1]
                : CultureInfo.CurrentCulture.DateTimeFormat.GetAbbreviatedMonthName(month);

            points.Add(new EnergyTrendPointDto
            {
                Month = month,
                MonthLabel = monthLabel,
                FuelCost = fuelSnapshot is null ? 0 : Decimal.Round(fuelSnapshot.Cost, 2, MidpointRounding.AwayFromZero),
                ChargingCost = chargingSnapshot is null ? 0 : Decimal.Round(chargingSnapshot.Cost, 2, MidpointRounding.AwayFromZero),
                FuelVolumeLiters = fuelSnapshot?.Volume ?? 0,
                EnergyConsumedKwh = chargingSnapshot?.Energy ?? 0
            });
        }

        return Task.FromResult<IReadOnlyList<EnergyTrendPointDto>>(points);
    }

    private static FuelSummaryDto BuildFuelSummary<TEntry>(
        IReadOnlyCollection<Vehicle> vehicles,
        IReadOnlyCollection<TEntry> entries,
        Func<TEntry, Guid> vehicleIdSelector,
        Func<TEntry, int> odometerSelector,
        Func<TEntry, decimal> costSelector)
    {
        if (vehicles.Count == 0)
        {
            return new FuelSummaryDto();
        }

        var totalCost = entries.Sum(costSelector);
        var totalMileage = entries
            .GroupBy(vehicleIdSelector)
            .Sum(group =>
            {
                var ordered = group.OrderBy(odometerSelector).ToList();
                if (ordered.Count < 2)
                {
                    return 0;
                }

                var start = odometerSelector(ordered.First());
                var end = odometerSelector(ordered.Last());
                return Math.Max(0, end - start);
            });

        var vins = vehicles
            .Select(v => v.Vin)
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Select(v => v!.ToUpperInvariant())
            .Distinct()
            .ToList();

        return new FuelSummaryDto
        {
            TotalCost = Decimal.Round(totalCost, 2, MidpointRounding.AwayFromZero),
            TotalMileageKm = totalMileage,
            VehicleVins = vins
        };
    }

    private static MaintenanceSummaryDto BuildMaintenanceSummary(
        IReadOnlyCollection<MaintenanceReminder> maintenanceReminders,
        DateOnly monthStart,
        DateOnly monthEnd)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var due = 0;
        var remaining = 0;

        foreach (var reminder in maintenanceReminders)
        {
            var dueDate = reminder.NextDueDate;
            if (dueDate is null)
            {
                continue;
            }

            if (dueDate.Value < monthStart || dueDate.Value > monthEnd)
            {
                continue;
            }

            if (dueDate.Value <= today)
            {
                due++;
            }
            else
            {
                remaining++;
            }
        }

        return new MaintenanceSummaryDto
        {
            DueThisMonth = due,
            RemainingThisMonth = remaining
        };
    }
}
