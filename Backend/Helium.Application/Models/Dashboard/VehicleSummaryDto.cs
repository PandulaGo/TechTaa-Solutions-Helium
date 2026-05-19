using System;

namespace Helium.Application.Models.Dashboard;

public class VehicleSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PowertrainType { get; set; } = string.Empty;
    public int CurrentOdometerKm { get; set; }
    public decimal MonthlyFuelCost { get; set; }
    public decimal MonthlyChargingCost { get; set; }
    public decimal MonthlyMaintenanceCost { get; set; }
    public decimal MonthlyCost { get; set; }
    public decimal? KmPerLiter { get; set; }
    public decimal? KmPerKwh { get; set; }
    public decimal? CostPerKm { get; set; }
    public string? NextMaintenanceType { get; set; }
    public string? NextMaintenanceDue { get; set; }
    public int WorkStatus { get; set; }
}
