using Helium.Domain.Common;

namespace Helium.Domain.Entities;

public class FuelEntry : EntityBase
{
    public Guid VehicleId { get; set; }
    public DateOnly Date { get; set; }
    public int OdometerReadingKm { get; set; }
    public decimal Liters { get; set; }
    public decimal Cost { get; set; }
    public string FuelStationName { get; set; } = string.Empty;
    public string? ReceiptImagePath { get; set; }

    public Vehicle? Vehicle { get; set; }
}
