# Helium App Backend

## Summary (What’s been built so far)
- Created Clean Architecture solution: **Helium Solution**
- Added projects and references:
  - **Helium.Domain**
  - **Helium.Application** (references Domain)
  - **Helium.Infrastructure** (references Application)
  - **Helium.Api** (references Application + Infrastructure)
- Removed default WeatherForecast sample and wired controllers.
- Implemented core domain entities and relationships.
- Added DTOs, services, validators, and AutoMapper profiles.
- Implemented EF Core DbContext, JWT auth, storage, and notifications placeholders.
- Added global exception handling middleware.
- Added Serilog logging.
- Added a maintenance reminder background service.
- Added REST controllers for auth, vehicles, entries, maintenance, reports, and file upload.

## Solution Structure
```
Backend
├─ Helium Solution.slnx
└─ src
   ├─ Api
   │  └─ Helium.Api
   │     ├─ BackgroundServices
   │     ├─ Controllers
   │     ├─ Middleware
   │     ├─ Program.cs
   │     └─ appsettings.json
   ├─ Application
   │  └─ Helium.Application
   │     ├─ Common
   │     ├─ Interfaces
   │     ├─ Mapping
   │     ├─ Models (DTOs)
   │     ├─ Services
   │     └─ Validation
   ├─ Domain
   │  └─ Helium.Domain
   │     ├─ Common
   │     ├─ Entities
   │     └─ Enums
   └─ Infrastructure
      └─ Helium.Infrastructure
         ├─ Notifications
         ├─ Persistence
         ├─ Security
         ├─ Settings
         └─ Storage
```

## Domain Layer
- Entities:
  - `User`
  - `Vehicle`
  - `FuelEntry`
  - `ChargingEntry`
  - `MaintenanceRecord`
  - `MaintenanceReminder`
- Enums:
  - `VehicleType` (Petrol, Diesel, Hybrid, Electric)
  - `ReminderIntervalType` (Mileage, Time)
- Base entity: `EntityBase` with `Id`, `CreatedAt`, `UpdatedAt`.

## Application Layer
- DTOs for all entities (Create/Update/Read).
- Service interfaces:
  - `IAuthService`, `IVehicleService`, `IFuelEntryService`, `IChargingEntryService`, `IMaintenanceService`, `IReportService`
- Implemented services with basic CRUD + reporting logic.
- AutoMapper profile: `ApplicationMappingProfile`.
- FluentValidation validators for auth, vehicle, fuel/charging entries, maintenance.
- Pagination models: `PaginationQuery`, `PagedResult<T>`, `SortDirection`.

## Infrastructure Layer
- EF Core DbContext: `AppDbContext` with relationships and constraints.
- Design-time factory: `AppDbContextFactory` (for migrations).
- Repository pattern:
  - `IGenericRepository<T>`
  - `IUnitOfWork`
- Security:
  - `PasswordHasher` (SHA256 + salt)
  - `JwtTokenService`
  - `JwtSettings`
- Storage:
  - `LocalFileStorageService` (for receipt uploads)
- Notifications:
  - `NotificationService` (placeholder)
- DI setup in `Helium.Infrastructure.DependencyInjection`.

## Web API Layer
- Controllers:
  - `AuthController`
  - `VehiclesController`
  - `FuelEntriesController`
  - `ChargingEntriesController`
  - `MaintenanceRecordsController`
  - `ReportsController`
  - `FilesController`
- Global exception handling middleware.
- Serilog request logging.
- JWT authentication + authorization.
- Background service: `MaintenanceReminderBackgroundService`.

## Configuration
- `appsettings.json` includes:
  - Connection string (LocalDB default)
  - JWT settings
  - Serilog configuration

## Build Status
- `dotnet build` succeeds (after package version alignment).

## Next Steps (Optional)
- Add migrations + seed data
- Add PostgreSQL support
- Add unit/integration tests
- Add advanced reporting queries
- Add caching and rate limiting
