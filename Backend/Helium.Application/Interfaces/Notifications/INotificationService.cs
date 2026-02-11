namespace Helium.Application.Interfaces.Notifications;

public interface INotificationService
{
    Task SendMaintenanceReminderAsync(Guid userId, string message, CancellationToken cancellationToken = default);
}
