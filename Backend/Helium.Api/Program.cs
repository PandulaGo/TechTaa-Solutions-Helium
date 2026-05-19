using Helium.Api.BackgroundServices;
using Helium.Api.Middleware;
using Helium.Application;
using Helium.Infrastructure;
using Helium.Infrastructure.Settings;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Text;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add CORS policy to allow frontend requests
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:50005")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Host.UseSerilog((context, services, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration).ReadFrom.Services(services));

builder.Services.AddControllers();
builder.Services.Configure<RouteOptions>(options =>
{
    options.LowercaseUrls = true;
});
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();

builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

builder.Services.AddScoped<ExceptionHandlingMiddleware>();
builder.Services.AddHostedService<MaintenanceReminderBackgroundService>();

var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = signingKey
        };
    });

builder.Services.AddAuthorization();


var app = builder.Build();

// Ensure database is created and apply migrations
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetService<Helium.Infrastructure.Persistence.AppDbContext>();
    if (dbContext != null)
    {
        Console.WriteLine("🚀 Helium App | Applying database migrations...");
        dbContext.Database.Migrate();
    }
}

app.UseSerilogRequestLogging();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/", () => Results.Ok("Hello from Helium App — API is running."));

var appLogger = app.Services.GetRequiredService<Serilog.ILogger>();
app.Lifetime.ApplicationStarted.Register(() =>
{
    var urls = app.Urls;
    appLogger.Information("🚀 Helium App | Backend started on {Urls}", string.Join(", ", urls));
    Console.WriteLine($"🚀 Helium App | Backend started on {string.Join(", ", urls)}");
});

app.Run();

