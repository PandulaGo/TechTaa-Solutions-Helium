using Helium.Domain.Common;
using Helium.Domain.Enums;

namespace Helium.Domain.Entities;

public class MaintenanceReminder : EntityBase
{
    public Guid MaintenanceRecordId { get; set; }
    public ReminderIntervalType IntervalType { get; set; }
    public int IntervalValue { get; set; }
    public DateOnly? LastNotifiedOn { get; set; }
    public DateOnly? NextDueDate { get; set; }
    public int? NextDueMileageKm { get; set; }

    public MaintenanceRecord? MaintenanceRecord { get; set; }
}
