using System.Security.Claims;
using Helium.Application.Common.Models;
using Helium.Application.Interfaces.Services;
using Helium.Application.Models.ChargingEntries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Helium.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChargingEntriesController : ControllerBase
{
    private readonly IChargingEntryService _chargingEntryService;

    public ChargingEntriesController(IChargingEntryService chargingEntryService)
    {
        _chargingEntryService = chargingEntryService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ChargingEntryDto>>> GetEntries([FromQuery] Guid? vehicleId, [FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await _chargingEntryService.GetPagedAsync(userId, vehicleId, query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ChargingEntryDto>> GetEntry(Guid id, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await _chargingEntryService.GetByIdAsync(userId, id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ChargingEntryDto>> Create(ChargingEntryCreateDto dto, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        dto.UserId = userId;

        var result = await _chargingEntryService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetEntry), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, ChargingEntryUpdateDto dto, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        await _chargingEntryService.UpdateAsync(userId, id, dto, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        await _chargingEntryService.DeleteAsync(userId, id, cancellationToken);
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
