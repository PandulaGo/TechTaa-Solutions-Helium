namespace Helium.Application.Models.Reports;

public class VehicleEfficiencyDto
{
    public Guid VehicleId { get; set; }
    public decimal? KmPerLiter { get; set; }
    public decimal? KmPerKwh { get; set; }
    public decimal? CostPerKm { get; set; }
}
