using Helium.Application.Common.Models;
using Helium.Application.Models.ChargingEntries;

namespace Helium.Application.Interfaces.Services;

public interface IChargingEntryService
{
    Task<ChargingEntryDto> CreateAsync(ChargingEntryCreateDto dto, CancellationToken cancellationToken = default);
    Task<ChargingEntryDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<ChargingEntryDto>> GetPagedAsync(Guid userId, Guid? vehicleId, PaginationQuery query, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid userId, Guid id, ChargingEntryUpdateDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
}
