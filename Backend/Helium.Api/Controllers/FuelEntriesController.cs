using System.Security.Claims;
using Helium.Application.Common.Models;
using Helium.Application.Interfaces.Services;
using Helium.Application.Models.FuelEntries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Helium.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FuelEntriesController : ControllerBase
{
    private readonly IFuelEntryService _fuelEntryService;

    public FuelEntriesController(IFuelEntryService fuelEntryService)
    {
        _fuelEntryService = fuelEntryService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<FuelEntryDto>>> GetEntries([FromQuery] Guid? vehicleId, [FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await _fuelEntryService.GetPagedAsync(userId, vehicleId, query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<FuelEntryDto>> GetEntry(Guid id, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await _fuelEntryService.GetByIdAsync(userId, id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<FuelEntryDto>> Create(FuelEntryCreateDto dto, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        dto.UserId = userId;

        var result = await _fuelEntryService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetEntry), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, FuelEntryUpdateDto dto, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        await _fuelEntryService.UpdateAsync(userId, id, dto, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        await _fuelEntryService.DeleteAsync(userId, id, cancellationToken);
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
