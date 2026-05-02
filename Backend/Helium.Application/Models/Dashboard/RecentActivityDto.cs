using System;

namespace Helium.Application.Models.Dashboard;

public class RecentActivityDto
{
    public Guid Id { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public string VehicleName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public DateOnly ActivityDate { get; set; }
}
