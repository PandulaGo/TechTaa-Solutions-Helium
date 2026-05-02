using Helium.Domain.Enums;

namespace Helium.Application.Models.Maintenance;

public class MaintenanceRecordUpdateDto
{
    public string MaintenanceType { get; set; } = string.Empty;
    public int OdometerReadingKm { get; set; }
    public DateOnly ServiceDate { get; set; }
    public string? Notes { get; set; }
    public string? ReceiptImagePath { get; set; }
    public decimal Cost { get; set; }
    public string? GarageName { get; set; }
    public string? MechanicName { get; set; }
    public WorkStatus WorkStatus { get; set; } = WorkStatus.Scheduled;
    public MaintenanceReminderDto? Reminder { get; set; }
}
