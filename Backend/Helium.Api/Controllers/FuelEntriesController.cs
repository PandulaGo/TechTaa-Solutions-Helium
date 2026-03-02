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
        var result = await _fuelEntryService.GetPagedAsync(vehicleId, query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<FuelEntryDto>> GetEntry(Guid id, CancellationToken cancellationToken)
    {
        var result = await _fuelEntryService.GetByIdAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<FuelEntryDto>> Create(FuelEntryCreateDto dto, CancellationToken cancellationToken)
    {
        var result = await _fuelEntryService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetEntry), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, FuelEntryUpdateDto dto, CancellationToken cancellationToken)
    {
        await _fuelEntryService.UpdateAsync(id, dto, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _fuelEntryService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
