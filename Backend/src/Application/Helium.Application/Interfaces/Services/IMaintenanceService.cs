using Helium.Application.Common.Models;
using Helium.Application.Models.Maintenance;

namespace Helium.Application.Interfaces.Services;

public interface IMaintenanceService
{
    Task<MaintenanceRecordDto> CreateAsync(MaintenanceRecordCreateDto dto, CancellationToken cancellationToken = default);
    Task<MaintenanceRecordDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<MaintenanceRecordDto>> GetPagedAsync(Guid vehicleId, PaginationQuery query, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, MaintenanceRecordUpdateDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MaintenanceRecordDto>> GetDueRemindersAsync(DateOnly asOfDate, CancellationToken cancellationToken = default);
}
