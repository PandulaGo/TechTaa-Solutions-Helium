namespace Helium.Application.Models.Dashboard;

public class EnergyTrendPointDto
{
    public int Month { get; set; }
    public string MonthLabel { get; set; } = string.Empty;
    public decimal FuelCost { get; set; }
    public decimal ChargingCost { get; set; }
    public decimal FuelVolumeLiters { get; set; }
    public decimal EnergyConsumedKwh { get; set; }
    public decimal MaintenanceCost { get; set; }
    public int DistanceKm { get; set; }

    public decimal TotalCost => FuelCost + ChargingCost;
    public decimal TotalUsage => FuelVolumeLiters + EnergyConsumedKwh;
    public decimal GrandTotalCost => FuelCost + ChargingCost + MaintenanceCost;
}
