using Helium.Application.Common.Models;
using Helium.Application.Interfaces.Services;
using Helium.Application.Models.Vehicles;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Helium.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleService _vehicleService;

    public VehiclesController(IVehicleService vehicleService)
    {
        _vehicleService = vehicleService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<VehicleDto>>> GetVehicles([FromQuery] Guid userId, [FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        var result = await _vehicleService.GetPagedAsync(userId, query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<VehicleDto>> GetVehicle(Guid id, CancellationToken cancellationToken)
    {
        var result = await _vehicleService.GetByIdAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<VehicleDto>> Create(VehicleCreateDto dto, CancellationToken cancellationToken)
    {
        var result = await _vehicleService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetVehicle), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, VehicleUpdateDto dto, CancellationToken cancellationToken)
    {
        await _vehicleService.UpdateAsync(id, dto, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _vehicleService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
