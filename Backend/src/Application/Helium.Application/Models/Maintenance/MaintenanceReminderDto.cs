using Helium.Domain.Enums;

namespace Helium.Application.Models.Maintenance;

public class MaintenanceReminderDto
{
    public Guid? Id { get; set; }
    public ReminderIntervalType IntervalType { get; set; }
    public int IntervalValue { get; set; }
    public DateOnly? NextDueDate { get; set; }
    public int? NextDueMileageKm { get; set; }
}
