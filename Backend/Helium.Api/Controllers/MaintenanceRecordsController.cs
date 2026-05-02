using System.Security.Claims;
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
    public async Task<ActionResult<PagedResult<MaintenanceRecordDto>>> GetRecords([FromQuery] Guid? vehicleId, [FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await _maintenanceService.GetPagedAsync(userId, vehicleId, query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("due")]
    public async Task<ActionResult<IEnumerable<MaintenanceRecordDto>>> GetDueReminders([FromQuery] DateOnly? asOfDate, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        var effectiveDate = asOfDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var result = await _maintenanceService.GetDueRemindersAsync(userId, effectiveDate, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MaintenanceRecordDto>> GetRecord(Guid id, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await _maintenanceService.GetByIdAsync(userId, id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<MaintenanceRecordDto>> Create(MaintenanceRecordCreateDto dto, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        dto.UserId = userId;

        var result = await _maintenanceService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetRecord), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, MaintenanceRecordUpdateDto dto, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        await _maintenanceService.UpdateAsync(userId, id, dto, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        await _maintenanceService.DeleteAsync(userId, id, cancellationToken);
        return NoContent();
    }

    private bool TryResolveUserId(out Guid userId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? User.FindFirst("sub")?.Value;

        if (!string.IsNullOrWhiteSpace(userIdClaim) && Guid.TryParse(userIdClaim, out userId))
        {
            return true;
        }

        userId = Guid.Empty;
        return false;
    }
}
