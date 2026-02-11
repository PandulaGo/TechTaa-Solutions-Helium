using Helium.Application.Common.Models;
using Helium.Application.Interfaces.Services;
using Helium.Application.Models.Maintenance;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Helium.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MaintenanceRecordsController : ControllerBase
{
    private readonly IMaintenanceService _maintenanceService;

    public MaintenanceRecordsController(IMaintenanceService maintenanceService)
    {
        _maintenanceService = maintenanceService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<MaintenanceRecordDto>>> GetRecords([FromQuery] Guid vehicleId, [FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        var result = await _maintenanceService.GetPagedAsync(vehicleId, query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MaintenanceRecordDto>> GetRecord(Guid id, CancellationToken cancellationToken)
    {
        var result = await _maintenanceService.GetByIdAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<MaintenanceRecordDto>> Create(MaintenanceRecordCreateDto dto, CancellationToken cancellationToken)
    {
        var result = await _maintenanceService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetRecord), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, MaintenanceRecordUpdateDto dto, CancellationToken cancellationToken)
    {
        await _maintenanceService.UpdateAsync(id, dto, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _maintenanceService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
