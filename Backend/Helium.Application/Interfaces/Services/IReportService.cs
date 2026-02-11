using Helium.Application.Models.Reports;

namespace Helium.Application.Interfaces.Services;

public interface IReportService
{
    Task<VehicleEfficiencyDto> GetVehicleEfficiencyAsync(Guid vehicleId, CancellationToken cancellationToken = default);
}
