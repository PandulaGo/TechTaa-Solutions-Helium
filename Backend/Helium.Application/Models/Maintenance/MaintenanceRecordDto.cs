using Helium.Domain.Enums;

namespace Helium.Application.Models.Maintenance;

public class MaintenanceRecordDto
{
    public Guid Id { get; set; }
    public Guid VehicleId { get; set; }
    public string? VehicleVin { get; set; }
    public string MaintenanceType { get; set; } = string.Empty;
    public int OdometerReadingKm { get; set; }
    public DateOnly ServiceDate { get; set; }
    public string? Notes { get; set; }
    public string? ReceiptImagePath { get; set; }
    public decimal Cost { get; set; }
    public string? GarageName { get; set; }
    public string? MechanicName { get; set; }
    public WorkStatus WorkStatus { get; set; }
    public MaintenanceReminderDto? Reminder { get; set; }
}
