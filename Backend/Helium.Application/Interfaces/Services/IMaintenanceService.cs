using Helium.Application.Common.Models;
using Helium.Application.Models.Maintenance;

namespace Helium.Application.Interfaces.Services;

public interface IMaintenanceService
{
    Task<MaintenanceRecordDto> CreateAsync(MaintenanceRecordCreateDto dto, CancellationToken cancellationToken = default);
    Task<MaintenanceRecordDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<MaintenanceRecordDto>> GetPagedAsync(Guid userId, Guid? vehicleId, PaginationQuery query, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid userId, Guid id, MaintenanceRecordUpdateDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MaintenanceRecordDto>> GetDueRemindersAsync(Guid? userId, DateOnly asOfDate, CancellationToken cancellationToken = default);
}
