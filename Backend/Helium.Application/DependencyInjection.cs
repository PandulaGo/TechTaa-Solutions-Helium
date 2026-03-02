using FluentValidation;
using Helium.Application.Interfaces.Services;
using Helium.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Helium.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddAutoMapper(typeof(DependencyInjection).Assembly);
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IVehicleService, VehicleService>();
        services.AddScoped<IFuelEntryService, FuelEntryService>();
        services.AddScoped<IChargingEntryService, ChargingEntryService>();
        services.AddScoped<IMaintenanceService, MaintenanceService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IDashboardService, DashboardService>();

        return services;
    }
}
