using Helium.Application.Interfaces.Services;
using Helium.Application.Models.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Helium.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("vehicle-efficiency/{vehicleId:guid}")]
    public async Task<ActionResult<VehicleEfficiencyDto>> GetVehicleEfficiency(Guid vehicleId, CancellationToken cancellationToken)
    {
        var result = await _reportService.GetVehicleEfficiencyAsync(vehicleId, cancellationToken);
        return Ok(result);
    }
}
