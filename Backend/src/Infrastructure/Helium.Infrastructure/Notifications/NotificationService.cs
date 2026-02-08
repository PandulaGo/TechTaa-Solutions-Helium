using Helium.Application.Interfaces.Notifications;
using Microsoft.Extensions.Logging;

namespace Helium.Infrastructure.Notifications;

public class NotificationService : INotificationService
{
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ILogger<NotificationService> logger)
    {
        _logger = logger;
    }

    public Task SendMaintenanceReminderAsync(Guid userId, string message, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Sending reminder to user {UserId}: {Message}", userId, message);
        return Task.CompletedTask;
    }
}
