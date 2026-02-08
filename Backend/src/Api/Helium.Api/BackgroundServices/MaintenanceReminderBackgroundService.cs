using Helium.Application.Interfaces.Notifications;
using Helium.Application.Interfaces.Services;

namespace Helium.Api.BackgroundServices;

public class MaintenanceReminderBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MaintenanceReminderBackgroundService> _logger;

    public MaintenanceReminderBackgroundService(IServiceProvider serviceProvider, ILogger<MaintenanceReminderBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var maintenanceService = scope.ServiceProvider.GetRequiredService<IMaintenanceService>();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                var dueRecords = await maintenanceService.GetDueRemindersAsync(DateOnly.FromDateTime(DateTime.UtcNow), stoppingToken);

                foreach (var record in dueRecords)
                {
                    await notificationService.SendMaintenanceReminderAsync(Guid.Empty, $"Maintenance due for vehicle {record.VehicleId}.", stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while processing maintenance reminders");
            }

            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }
}
