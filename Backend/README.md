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
Controllers:
  - `AuthController`
  - `VehiclesController`
  - `FuelEntriesController`
  - `ChargingEntriesController`
  - `MaintenanceRecordsController`
  - `ReportsController`
  - `FilesController`
Global exception handling middleware.
Serilog request logging.
JWT authentication + authorization.
Background service: `MaintenanceReminderBackgroundService`.

### Registration Endpoint
The registration endpoint expects the following fields:
- `FirstName` (required, max 100 chars)
- `LastName` (required, max 100 chars)
- `Email` (required, valid email, max 200 chars)
- `Password` (required, min 8 chars, must include uppercase, lowercase, digit, special character)
- `PreferredCurrency` (required, max 10 chars)

Password requirements are enforced both in backend and frontend.

### Frontend Updates
- Bootstrap removed from web app, replaced with Tailwind CSS for styling.
- Registration form updated to match backend requirements, including confirm password and live password validation.

## Configuration
- `appsettings.json` includes:
  - Connection string (LocalDB default)
  - JWT settings
  - Serilog configuration

The API listens by default on:
- `http://localhost:5297`
- `https://localhost:7165`

Cross-origin requests from the frontend are enabled via a CORS policy that allows `http://localhost:3000`.

## Build Status
- `dotnet build` succeeds (after package version alignment).

## Running the Backend

From the repository root:
1. Navigate to the backend folder:
  - `cd Backend`
2. Run the API:
  - `dotnet run --project Helium.Api/Helium.Api.csproj`
3. The API will start on the URLs configured in `Properties/launchSettings.json`.

## Next Steps (Optional)
- Add migrations + seed data
- Add PostgreSQL support
- Add unit/integration tests
- Add advanced reporting queries
- Add caching and rate limiting
