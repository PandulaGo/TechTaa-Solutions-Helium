using Helium.Domain.Common;
using Helium.Domain.Enums;

namespace Helium.Domain.Entities;

public class MaintenanceRecord : EntityBase
{
    public Guid UserId { get; set; }
    public Guid VehicleId { get; set; }
    public string MaintenanceType { get; set; } = string.Empty;
    public int OdometerReadingKm { get; set; }
    public DateOnly ServiceDate { get; set; }
    public string? Notes { get; set; }
    public string? ReceiptImagePath { get; set; }
    public decimal Cost { get; set; }
    public string? GarageName { get; set; }
    public string? MechanicName { get; set; }
    public WorkStatus WorkStatus { get; set; } = WorkStatus.Scheduled;

    public MaintenanceReminder? Reminder { get; set; }
    public Vehicle? Vehicle { get; set; }
    public User? User { get; set; }
}
