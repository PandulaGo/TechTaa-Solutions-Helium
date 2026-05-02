using System;

namespace Helium.Application.Models.Dashboard;

public class DashboardSummaryDto
{
    public int VehicleCount { get; set; }
    public FuelSummaryDto IceSummary { get; set; } = new();
    public FuelSummaryDto EvSummary { get; set; } = new();
    public MaintenanceSummaryDto MaintenanceSummary { get; set; } = new();
}

public class FuelSummaryDto
{
    public decimal TotalCost { get; set; }
    public int TotalMileageKm { get; set; }
    public IReadOnlyCollection<string> VehicleVins { get; set; } = Array.Empty<string>();
}

public class MaintenanceSummaryDto
{
    public int DueThisMonth { get; set; }
    public int RemainingThisMonth { get; set; }
    public decimal TotalCost { get; set; }
}
