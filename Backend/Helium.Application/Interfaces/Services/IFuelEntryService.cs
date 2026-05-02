using Helium.Application.Common.Models;
using Helium.Application.Models.FuelEntries;

namespace Helium.Application.Interfaces.Services;

public interface IFuelEntryService
{
    Task<FuelEntryDto> CreateAsync(FuelEntryCreateDto dto, CancellationToken cancellationToken = default);
    Task<FuelEntryDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<FuelEntryDto>> GetPagedAsync(Guid userId, Guid? vehicleId, PaginationQuery query, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid userId, Guid id, FuelEntryUpdateDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
}
