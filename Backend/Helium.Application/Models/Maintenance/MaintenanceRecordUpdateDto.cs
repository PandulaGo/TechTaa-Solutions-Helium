namespace Helium.Application.Models.Maintenance;

public class MaintenanceRecordUpdateDto
{
    public string MaintenanceType { get; set; } = string.Empty;
    public int OdometerReadingKm { get; set; }
    public DateOnly ServiceDate { get; set; }
    public string? Notes { get; set; }
    public string? ReceiptImagePath { get; set; }
    public MaintenanceReminderDto? Reminder { get; set; }
}
