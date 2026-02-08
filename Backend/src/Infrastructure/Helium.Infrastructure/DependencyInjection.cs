using Helium.Application.Interfaces.Notifications;
using Helium.Application.Interfaces.Persistence;
using Helium.Application.Interfaces.Security;
using Helium.Application.Interfaces.Storage;
using Helium.Infrastructure.Notifications;
using Helium.Infrastructure.Persistence;
using Helium.Infrastructure.Persistence.Repositories;
using Helium.Infrastructure.Security;
using Helium.Infrastructure.Settings;
using Helium.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Helium.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Server=(localdb)\\mssqllocaldb;Database=HeliumAppDb;Trusted_Connection=True;MultipleActiveResultSets=true";

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<INotificationService, NotificationService>();

        var storageRoot = Path.Combine(AppContext.BaseDirectory, "storage");
        services.AddSingleton<IFileStorageService>(new LocalFileStorageService(storageRoot));

        return services;
    }
}
