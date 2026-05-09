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
        var iceVehicles = vehicles.Where(v => v.PowertrainType == PowertrainType.Petrol || v.PowertrainType == PowertrainType.Diesel).ToList();
        var hybridVehicles = vehicles.Where(v => v.PowertrainType == PowertrainType.Hybrid).ToList();
        var evVehicles = vehicles.Where(v => v.PowertrainType == PowertrainType.Electric).ToList();
        var iceVehicleIds = iceVehicles.Select(v => v.Id).ToList();
        var hybridVehicleIds = hybridVehicles.Select(v => v.Id).ToList();
        var evVehicleIds = evVehicles.Select(v => v.Id).ToList();
        var fuelCapableIds = iceVehicleIds.Concat(hybridVehicleIds).ToList();

        var fuelEntries = _unitOfWork.Repository<FuelEntry>().Query()
            .Where(entry => fuelCapableIds.Contains(entry.VehicleId)
                            && entry.Date >= monthStart
                            && entry.Date <= monthEnd)
            .ToList();

        var chargingEntries = _unitOfWork.Repository<ChargingEntry>().Query()
            .Where(entry => (hybridVehicleIds.Concat(evVehicleIds)).Contains(entry.VehicleId)
                            && entry.Date >= monthStart
                            && entry.Date <= monthEnd)
            .ToList();

        var allMaintenanceRecords = _unitOfWork.Repository<MaintenanceRecord>().Query()
            .Where(entry => vehicleIds.Contains(entry.VehicleId))
            .ToList();

        var maintenanceEntries = allMaintenanceRecords
            .Where(e => e.ServiceDate >= monthStart && e.ServiceDate <= monthEnd)
            .ToList();

        var maintenanceRecordIds = allMaintenanceRecords.Select(e => e.Id).ToList();

        var maintenanceReminders = maintenanceRecordIds.Count == 0
            ? new List<MaintenanceReminder>()
            : _unitOfWork.Repository<MaintenanceReminder>().Query()
                .Where(r => maintenanceRecordIds.Contains(r.MaintenanceRecordId) && r.NextDueDate != null)
                .ToList();

        var maintenanceSummary = BuildMaintenanceSummary(maintenanceReminders, monthStart, monthEnd, maintenanceEntries);

        var summary = new DashboardSummaryDto
        {
            VehicleCount = vehicles.Count,
            IceSummary = BuildFuelSummary(iceVehicles, fuelEntries, e => e.VehicleId, e => e.OdometerReadingKm, e => e.Cost),
            EvSummary = BuildFuelSummary(hybridVehicles.Concat(evVehicles).ToList(), chargingEntries, e => e.VehicleId, e => e.OdometerReadingKm, e => e.Cost),
            MaintenanceSummary = maintenanceSummary
        };

        return Task.FromResult(summary);
    }

    public Task<IReadOnlyList<EnergyTrendPointDto>> GetYearlyEnergyTrendAsync(Guid userId, int year, Guid? vehicleId = null, CancellationToken cancellationToken = default)
    {
        var vehicles = _unitOfWork.Repository<Vehicle>().Query()
            .Where(v => v.UserId == userId)
            .ToList();

        var targetIds = vehicleId.HasValue && vehicles.Select(v => v.Id).Contains(vehicleId.Value)
            ? new List<Guid> { vehicleId.Value }
            : vehicles.Select(v => v.Id).ToList();

        var targetVehicles = vehicles.Where(v => targetIds.Contains(v.Id)).ToList();
        var hybridAndEvIds = targetVehicles
            .Where(v => v.PowertrainType == PowertrainType.Hybrid || v.PowertrainType == PowertrainType.Electric)
            .Select(v => v.Id)
            .ToList();

        var boundedYear = year <= 0 ? DateTime.UtcNow.Year : year;
        var yearStart = new DateOnly(boundedYear, 1, 1);
        var yearEnd = new DateOnly(boundedYear, 12, 31);

        var fuelEntries = _unitOfWork.Repository<FuelEntry>().Query()
            .Where(entry => entry.UserId == userId
                            && targetIds.Contains(entry.VehicleId)
                            && entry.Date >= yearStart
                            && entry.Date <= yearEnd)
            .ToList();

        var chargingEntries = _unitOfWork.Repository<ChargingEntry>().Query()
            .Where(entry => entry.UserId == userId
                            && hybridAndEvIds.Contains(entry.VehicleId)
                            && entry.Date >= yearStart
                            && entry.Date <= yearEnd)
            .ToList();

        var maintenanceEntries = _unitOfWork.Repository<MaintenanceRecord>().Query()
            .Where(entry => entry.UserId == userId
                            && targetIds.Contains(entry.VehicleId)
                            && entry.ServiceDate >= yearStart
                            && entry.ServiceDate <= yearEnd)
            .ToList();

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

        var maintenanceByMonth = maintenanceEntries
            .GroupBy(entry => entry.ServiceDate.Month)
            .ToDictionary(
                group => group.Key,
                group => group.Sum(e => e.Cost));

        var monthNames = CultureInfo.CurrentCulture.DateTimeFormat.AbbreviatedMonthNames;
        var points = new List<EnergyTrendPointDto>(12);

        for (var month = 1; month <= 12; month++)
        {
            fuelByMonth.TryGetValue(month, out var fuelSnapshot);
            chargingByMonth.TryGetValue(month, out var chargingSnapshot);
            maintenanceByMonth.TryGetValue(month, out var maintenanceCost);

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
                EnergyConsumedKwh = chargingSnapshot?.Energy ?? 0,
                MaintenanceCost = maintenanceCost > 0 ? Decimal.Round(maintenanceCost, 2, MidpointRounding.AwayFromZero) : 0
            });
        }

        return Task.FromResult<IReadOnlyList<EnergyTrendPointDto>>(points);
    }

    public Task<IReadOnlyList<int>> GetAvailableYearsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var vehicleIds = _unitOfWork.Repository<Vehicle>().Query()
            .Where(v => v.UserId == userId)
            .Select(v => v.Id)
            .ToList();

        var years = new HashSet<int>();

        var fuelYears = _unitOfWork.Repository<FuelEntry>().Query()
            .Where(e => e.UserId == userId && vehicleIds.Contains(e.VehicleId))
            .Select(e => e.Date.Year)
            .Distinct()
            .ToList();

        foreach (var y in fuelYears) years.Add(y);

        var chargingYears = _unitOfWork.Repository<ChargingEntry>().Query()
            .Where(e => e.UserId == userId && vehicleIds.Contains(e.VehicleId))
            .Select(e => e.Date.Year)
            .Distinct()
            .ToList();

        foreach (var y in chargingYears) years.Add(y);

        var maintenanceYears = _unitOfWork.Repository<MaintenanceRecord>().Query()
            .Where(e => e.UserId == userId && vehicleIds.Contains(e.VehicleId))
            .Select(e => e.ServiceDate.Year)
            .Distinct()
            .ToList();

        foreach (var y in maintenanceYears) years.Add(y);

        years.Add(DateTime.UtcNow.Year);

        var sortedYears = years.OrderByDescending(y => y).ToList();

        return Task.FromResult<IReadOnlyList<int>>(sortedYears);
    }

    public Task<IReadOnlyList<VehicleSummaryDto>> GetVehicleSummariesAsync(Guid userId, DateOnly monthStart, DateOnly monthEnd, CancellationToken cancellationToken = default)
    {
        var vehicles = _unitOfWork.Repository<Vehicle>().Query()
            .Where(v => v.UserId == userId)
            .ToList();

        var vehicleIds = vehicles.Select(v => v.Id).ToList();

        var allFuelEntries = _unitOfWork.Repository<FuelEntry>().Query()
            .Where(e => e.UserId == userId && vehicleIds.Contains(e.VehicleId))
            .ToList();

        var allChargingEntries = _unitOfWork.Repository<ChargingEntry>().Query()
            .Where(e => e.UserId == userId && vehicleIds.Contains(e.VehicleId))
            .ToList();

        var allMaintenanceRecords = _unitOfWork.Repository<MaintenanceRecord>().Query()
            .Where(e => e.UserId == userId && vehicleIds.Contains(e.VehicleId))
            .ToList();

        var maintenanceRecordIds = allMaintenanceRecords.Select(m => m.Id).ToList();

        var allReminders = maintenanceRecordIds.Count == 0
            ? new List<MaintenanceReminder>()
            : _unitOfWork.Repository<MaintenanceReminder>().Query()
                .Where(r => maintenanceRecordIds.Contains(r.MaintenanceRecordId))
                .ToList();

        var maintenanceRecordLookup = allMaintenanceRecords.ToDictionary(m => m.Id);

        var summaries = new List<VehicleSummaryDto>();

        foreach (var vehicle in vehicles)
        {
            var monthFuelCost = allFuelEntries
                .Where(e => e.VehicleId == vehicle.Id && e.Date >= monthStart && e.Date <= monthEnd)
                .Sum(e => e.Cost);

            var monthChargingCost = allChargingEntries
                .Where(e => e.VehicleId == vehicle.Id && e.Date >= monthStart && e.Date <= monthEnd)
                .Sum(e => e.Cost);

            var monthMaintenanceCost = allMaintenanceRecords
                .Where(e => e.VehicleId == vehicle.Id && e.ServiceDate >= monthStart && e.ServiceDate <= monthEnd)
                .Sum(e => e.Cost);

            var vehicleMaintenanceRecords = allMaintenanceRecords
                .Where(e => e.VehicleId == vehicle.Id)
                .OrderByDescending(e => e.OdometerReadingKm)
                .ToList();

            var vehicleMaintenanceIds = vehicleMaintenanceRecords.Select(m => m.Id).ToHashSet();

            var currentOdometer = vehicleMaintenanceRecords.Any()
                ? Math.Max(
                    vehicleMaintenanceRecords.Max(e => e.OdometerReadingKm),
                    Math.Max(
                        allFuelEntries.Where(e => e.VehicleId == vehicle.Id).Select(e => e.OdometerReadingKm).DefaultIfEmpty(0).Max(),
                        allChargingEntries.Where(e => e.VehicleId == vehicle.Id).Select(e => e.OdometerReadingKm).DefaultIfEmpty(0).Max()))
                : allFuelEntries.Where(e => e.VehicleId == vehicle.Id).Select(e => e.OdometerReadingKm).DefaultIfEmpty(0).Max();

            var vehicleReminders = allReminders
                .Where(r => vehicleMaintenanceIds.Contains(r.MaintenanceRecordId))
                .Select(r => new
                {
                    MaintenanceRecord = maintenanceRecordLookup[r.MaintenanceRecordId],
                    Reminder = r
                })
                .Where(x => x.MaintenanceRecord.WorkStatus != WorkStatus.Completed || x.Reminder.NextDueDate.HasValue)
                .ToList();

            var upcomingReminder = vehicleReminders.FirstOrDefault();

            string? nextMaintenanceType = null;
            string? nextMaintenanceDue = null;
            int workStatus = (int)WorkStatus.Completed;

            if (upcomingReminder != null)
            {
                var record = upcomingReminder.MaintenanceRecord;
                var reminder = upcomingReminder.Reminder;
                nextMaintenanceType = record.MaintenanceType;
                workStatus = (int)record.WorkStatus;

                if (reminder.NextDueDate.HasValue)
                {
                    nextMaintenanceDue = reminder.NextDueDate.Value.ToString();
                }
                else if (reminder.NextDueMileageKm.HasValue)
                {
                    nextMaintenanceDue = $"{reminder.NextDueMileageKm.Value:N0} km";
                }
            }

            summaries.Add(new VehicleSummaryDto
            {
                Id = vehicle.Id,
                Name = vehicle.Name,
                PowertrainType = vehicle.PowertrainType.ToString(),
                CurrentOdometerKm = currentOdometer,
                MonthlyFuelCost = monthFuelCost,
                MonthlyChargingCost = monthChargingCost,
                MonthlyMaintenanceCost = monthMaintenanceCost,
                MonthlyCost = Math.Round(monthFuelCost + monthChargingCost + monthMaintenanceCost, 2, MidpointRounding.AwayFromZero),
                NextMaintenanceType = nextMaintenanceType,
                NextMaintenanceDue = nextMaintenanceDue,
                WorkStatus = workStatus
            });
        }

        return Task.FromResult<IReadOnlyList<VehicleSummaryDto>>(summaries);
    }

    public Task<IReadOnlyList<RecentActivityDto>> GetRecentActivityAsync(Guid userId, int count, CancellationToken cancellationToken = default)
    {
        var vehicleIds = _unitOfWork.Repository<Vehicle>().Query()
            .Where(v => v.UserId == userId)
            .Select(v => new { v.Id, v.Name })
            .ToList();

        var vehicleLookup = vehicleIds.ToDictionary(v => v.Id, v => v.Name);
        var idSet = vehicleLookup.Keys.ToList();

        var fuelEntries = _unitOfWork.Repository<FuelEntry>().Query()
            .Where(e => e.UserId == userId && idSet.Contains(e.VehicleId))
            .OrderByDescending(e => e.Date)
            .Take(count)
            .Select(e => new RecentActivityDto
            {
                Id = e.Id,
                ActivityType = "Fuel",
                VehicleName = vehicleLookup.ContainsKey(e.VehicleId) ? vehicleLookup[e.VehicleId] : "Unknown",
                Description = $"Filled {e.Liters:N1}L at {e.FuelStationName}",
                Cost = e.Cost,
                ActivityDate = e.Date
            })
            .ToList();

        var chargingEntries = _unitOfWork.Repository<ChargingEntry>().Query()
            .Where(e => e.UserId == userId && idSet.Contains(e.VehicleId))
            .OrderByDescending(e => e.Date)
            .Take(count)
            .Select(e => new RecentActivityDto
            {
                Id = e.Id,
                ActivityType = "Charging",
                VehicleName = vehicleLookup.ContainsKey(e.VehicleId) ? vehicleLookup[e.VehicleId] : "Unknown",
                Description = $"Charged {e.KwhUsed:N1}kWh at {e.ChargingLocation}",
                Cost = e.Cost,
                ActivityDate = e.Date
            })
            .ToList();

        var maintenanceRecords = _unitOfWork.Repository<MaintenanceRecord>().Query()
            .Where(e => e.UserId == userId && idSet.Contains(e.VehicleId))
            .OrderByDescending(e => e.ServiceDate)
            .Take(count)
            .Select(e => new RecentActivityDto
            {
                Id = e.Id,
                ActivityType = "Maintenance",
                VehicleName = vehicleLookup.ContainsKey(e.VehicleId) ? vehicleLookup[e.VehicleId] : "Unknown",
                Description = $"{e.MaintenanceType} ({e.WorkStatus})",
                Cost = e.Cost,
                ActivityDate = e.ServiceDate
            })
            .ToList();

        var allActivities = fuelEntries.Concat(chargingEntries).Concat(maintenanceRecords)
            .OrderByDescending(a => a.ActivityDate)
            .Take(count)
            .ToList();

        return Task.FromResult<IReadOnlyList<RecentActivityDto>>(allActivities);
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
        DateOnly monthEnd,
        IReadOnlyCollection<MaintenanceRecord> maintenanceEntries)
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

            if (dueDate.Value <= today)
            {
                due++;
            }
            else if (dueDate.Value <= monthEnd)
            {
                remaining++;
            }
        }

        var totalCost = maintenanceEntries.Sum(e => e.Cost);

        return new MaintenanceSummaryDto
        {
            DueThisMonth = due,
            RemainingThisMonth = remaining,
            TotalCost = Math.Round(totalCost, 2, MidpointRounding.AwayFromZero)
        };
    }
}
