using Helium.Domain.Common;

namespace Helium.Domain.Entities;

public class MaintenanceRecord : EntityBase
{
    public Guid VehicleId { get; set; }
    public string MaintenanceType { get; set; } = string.Empty;
    public int OdometerReadingKm { get; set; }
    public DateOnly ServiceDate { get; set; }
    public string? Notes { get; set; }
    public string? ReceiptImagePath { get; set; }

    public MaintenanceReminder? Reminder { get; set; }
    public Vehicle? Vehicle { get; set; }
}
