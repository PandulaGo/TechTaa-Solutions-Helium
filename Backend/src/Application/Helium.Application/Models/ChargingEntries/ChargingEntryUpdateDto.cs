namespace Helium.Application.Models.ChargingEntries;

public class ChargingEntryUpdateDto
{
    public DateOnly Date { get; set; }
    public int OdometerReadingKm { get; set; }
    public decimal KwhUsed { get; set; }
    public decimal Cost { get; set; }
    public string ChargingLocation { get; set; } = string.Empty;
}
