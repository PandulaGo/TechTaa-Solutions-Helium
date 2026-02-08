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
    public async Task<ActionResult<PagedResult<ChargingEntryDto>>> GetEntries([FromQuery] Guid vehicleId, [FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        var result = await _chargingEntryService.GetPagedAsync(vehicleId, query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ChargingEntryDto>> GetEntry(Guid id, CancellationToken cancellationToken)
    {
        var result = await _chargingEntryService.GetByIdAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ChargingEntryDto>> Create(ChargingEntryCreateDto dto, CancellationToken cancellationToken)
    {
        var result = await _chargingEntryService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetEntry), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, ChargingEntryUpdateDto dto, CancellationToken cancellationToken)
    {
        await _chargingEntryService.UpdateAsync(id, dto, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _chargingEntryService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
