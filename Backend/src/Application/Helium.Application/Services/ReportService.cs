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
        var fuelEntries = _unitOfWork.Repository<FuelEntry>().Query().Where(f => f.VehicleId == vehicleId).ToList();
        var chargingEntries = _unitOfWork.Repository<ChargingEntry>().Query().Where(c => c.VehicleId == vehicleId).ToList();

        var odometers = fuelEntries.Select(f => f.OdometerReadingKm)
            .Concat(chargingEntries.Select(c => c.OdometerReadingKm))
            .ToList();

        var distance = odometers.Count >= 2 ? odometers.Max() - odometers.Min() : 0;
        var totalFuelLiters = fuelEntries.Sum(f => f.Liters);
        var totalKwh = chargingEntries.Sum(c => c.KwhUsed);
        var totalCost = fuelEntries.Sum(f => f.Cost) + chargingEntries.Sum(c => c.Cost);

        var kmPerLiter = distance > 0 && totalFuelLiters > 0 ? distance / totalFuelLiters : (decimal?)null;
        var kmPerKwh = distance > 0 && totalKwh > 0 ? distance / totalKwh : (decimal?)null;
        var costPerKm = distance > 0 && totalCost > 0 ? totalCost / distance : (decimal?)null;

        return await Task.FromResult(new VehicleEfficiencyDto
        {
            VehicleId = vehicleId,
            KmPerLiter = kmPerLiter,
            KmPerKwh = kmPerKwh,
            CostPerKm = costPerKm
        });
    }
}
