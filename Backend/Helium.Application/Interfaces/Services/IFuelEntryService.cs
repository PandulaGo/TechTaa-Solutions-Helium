using Helium.Application.Common.Models;
using Helium.Application.Models.FuelEntries;

namespace Helium.Application.Interfaces.Services;

public interface IFuelEntryService
{
    Task<FuelEntryDto> CreateAsync(FuelEntryCreateDto dto, CancellationToken cancellationToken = default);
    Task<FuelEntryDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<FuelEntryDto>> GetPagedAsync(Guid? vehicleId, PaginationQuery query, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, FuelEntryUpdateDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
