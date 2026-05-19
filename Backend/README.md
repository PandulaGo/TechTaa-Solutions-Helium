# Helium App Backend

## Summary (What’s been built so far)
- Clean Architecture backend for the Helium application.
- Projects and references:
  - **Helium.Domain** (core entities and enums)
  - **Helium.Application** (DTOs, services, validators, mapping) – references Domain
  - **Helium.Infrastructure** (EF Core, security, storage, notifications) – references Application & Domain
  - **Helium.Api** (ASP.NET Core Web API) – references Application & Infrastructure
- Removed default WeatherForecast sample and wired all feature controllers.
- Implemented core domain entities and relationships.
- Added DTOs, services, validators, and AutoMapper profiles.
- Implemented EF Core `AppDbContext`, JWT auth, local file storage, and notification service placeholder.
- Added global exception handling middleware.
- Added Serilog request logging.
- Added a maintenance reminder background service with automatic migration on startup.
- Added REST controllers for auth, vehicles, fuel/charging entries, maintenance, reports, and file upload.

## High-Level Architecture

```mermaid
graph TD
    ClientWeb[Web Frontend (React)] --> Api[Helium.Api (ASP.NET Core)]
    ClientMobile[Mobile App (Flutter)] --> Api

    Api --> AppLayer[Helium.Application<br/>Services, DTOs, Validation]
    AppLayer --> Domain[Helium.Domain<br/>Entities, Enums]
    AppLayer --> Infra[Helium.Infrastructure<br/>EF Core, Security, Storage, Notifications]

    Infra --> Db[(SQL Server Database)]
    Infra --> Files[(File Storage: receipts)]

    Api -.Background Jobs.- Bg[MaintenanceReminderBackgroundService]
    Bg --> Infra
```

## Solution Structure (Current)

```
Backend
├─ Helium Solution.slnx
├─ Helium.Api
│  ├─ BackgroundServices
│  │  └─ MaintenanceReminderBackgroundService.cs
│  ├─ Controllers
│  │  ├─ AuthController.cs
│  │  ├─ VehiclesController.cs
│  │  ├─ FuelEntriesController.cs
│  │  ├─ ChargingEntriesController.cs
│  │  ├─ MaintenanceRecordsController.cs
│  │  ├─ ReportsController.cs
│  │  └─ FilesController.cs
│  ├─ Middleware
│  │  └─ ExceptionHandlingMiddleware.cs
│  ├─ Program.cs
│  └─ appsettings.json
├─ Helium.Application
│  ├─ Common
│  ├─ Interfaces
│  ├─ Mapping
│  ├─ Models (DTOs)
│  ├─ Services
│  └─ Validation
├─ Helium.Domain
│  ├─ Common
│  │  └─ EntityBase.cs
│  ├─ Entities
│  └─ Enums
└─ Helium.Infrastructure
  ├─ Notifications
  ├─ Persistence
  │  ├─ AppDbContext.cs
  │  ├─ Repositories
  │  └─ Migrations
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
  - `PowertrainType` (Petrol, Diesel, Hybrid, Electric)
  - `VehicleBodyType` (Car, Van, Bike, Truck, Suv)
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
- `http://localhost:10011`
- `https://localhost:7165`

Cross-origin requests from the frontend are enabled via a CORS policy that allows `http://localhost:10015`.

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
