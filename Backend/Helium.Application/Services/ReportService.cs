using Helium.Application.Interfaces.Persistence;
using Helium.Application.Interfaces.Services;
using Helium.Application.Models.Reports;
using Helium.Domain.Entities;

namespace Helium.Application.Services;

public class ReportService : IReportService
{
    private readonly IUnitOfWork _unitOfWork;

    public ReportService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<VehicleEfficiencyDto> GetVehicleEfficiencyAsync(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var fuelEntries = _unitOfWork.Repository<FuelEntry>().Query()
            .Where(f => f.VehicleId == vehicleId)
            .OrderBy(f => f.OdometerReadingKm)
            .ToList();

        var chargingEntries = _unitOfWork.Repository<ChargingEntry>().Query()
            .Where(c => c.VehicleId == vehicleId)
            .OrderBy(c => c.OdometerReadingKm)
            .ToList();

        decimal? kmPerLiter = null;
        if (fuelEntries.Count >= 2)
        {
            var pairEfficiencies = new List<decimal>();
            for (int i = 1; i < fuelEntries.Count; i++)
            {
                var tripDist = fuelEntries[i].OdometerReadingKm - fuelEntries[i - 1].OdometerReadingKm;
                var tripLiters = fuelEntries[i].Liters;
                if (tripDist > 0 && tripLiters > 0)
                    pairEfficiencies.Add(tripDist / tripLiters);
            }

            if (pairEfficiencies.Count > 0)
                kmPerLiter = pairEfficiencies.Average();
        }

        decimal? kmPerKwh = null;
        if (chargingEntries.Count >= 2)
        {
            var electricDistance = chargingEntries.Last().OdometerReadingKm - chargingEntries.First().OdometerReadingKm;
            var kwhUsed = chargingEntries.Skip(1).Sum(c => c.KwhUsed);
            if (electricDistance > 0 && kwhUsed > 0)
                kmPerKwh = electricDistance / kwhUsed;
        }

        var totalCost = fuelEntries.Sum(f => f.Cost) + chargingEntries.Sum(c => c.Cost);

        decimal? costPerKm = null;
        if (fuelEntries.Count + chargingEntries.Count >= 2 && totalCost > 0)
        {
            var allOdometers = fuelEntries.Select(f => f.OdometerReadingKm)
                .Concat(chargingEntries.Select(c => c.OdometerReadingKm))
                .ToList();
            var distance = allOdometers.Max() - allOdometers.Min();
            if (distance > 0)
                costPerKm = totalCost / distance;
        }

        return await Task.FromResult(new VehicleEfficiencyDto
        {
            VehicleId = vehicleId,
            KmPerLiter = kmPerLiter,
            KmPerKwh = kmPerKwh,
            CostPerKm = costPerKm
        });
    }
}
