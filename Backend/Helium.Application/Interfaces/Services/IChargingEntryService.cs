using Helium.Application.Common.Models;
using Helium.Application.Models.ChargingEntries;

namespace Helium.Application.Interfaces.Services;

public interface IChargingEntryService
{
    Task<ChargingEntryDto> CreateAsync(ChargingEntryCreateDto dto, CancellationToken cancellationToken = default);
    Task<ChargingEntryDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<ChargingEntryDto>> GetPagedAsync(Guid vehicleId, PaginationQuery query, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, ChargingEntryUpdateDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
