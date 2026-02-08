namespace Helium.Application.Models.FuelEntries;

public class FuelEntryDto
{
    public Guid Id { get; set; }
    public Guid VehicleId { get; set; }
    public DateOnly Date { get; set; }
    public int OdometerReadingKm { get; set; }
    public decimal Liters { get; set; }
    public decimal Cost { get; set; }
    public string FuelStationName { get; set; } = string.Empty;
    public string? ReceiptImagePath { get; set; }
}
