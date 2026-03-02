using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Helium.Application.Interfaces.Services;
using Helium.Application.Models.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Helium.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary([FromQuery] DateOnly? month, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        var referenceDate = month ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var monthStart = new DateOnly(referenceDate.Year, referenceDate.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        var summary = await _dashboardService.GetSummaryAsync(userId, monthStart, monthEnd, cancellationToken);
        return Ok(summary);
    }

    [HttpGet("energy-trend")]
    public async Task<ActionResult<IReadOnlyList<EnergyTrendPointDto>>> GetEnergyTrend([FromQuery] int? year, CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId))
        {
            return Unauthorized();
        }

        var targetYear = year.HasValue && year.Value > 0 ? year.Value : DateTime.UtcNow.Year;
        var trend = await _dashboardService.GetYearlyEnergyTrendAsync(userId, targetYear, cancellationToken);
        return Ok(trend);
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
