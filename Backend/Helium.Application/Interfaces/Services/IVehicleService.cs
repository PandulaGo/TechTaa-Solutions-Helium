using Helium.Application.Common.Models;
using Helium.Application.Models.Vehicles;

namespace Helium.Application.Interfaces.Services;

public interface IVehicleService
{
    Task<VehicleDto> CreateAsync(VehicleCreateDto dto, CancellationToken cancellationToken = default);
    Task<VehicleDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<VehicleDto>> GetPagedAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, VehicleUpdateDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
