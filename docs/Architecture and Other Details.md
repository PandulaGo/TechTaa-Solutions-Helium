# Architecture and Other Details

> **AI Agent Context & Instruction:** You are acting as the primary Technical Documentation Agent. Analyze the codebase (directory tree, environment configurations, ORM/model definitions, routes, and controllers). Generate a comprehensive system specification by filling out all three major sections of this document.

---

## 1. System Architecture Specification

> **AI Instruction:** Inspect the project root, configuration files, and core source tree to document the high-level architecture.

### Executive Summary
- **Core Purpose:** Helium is a full-stack vehicle fleet management application for tracking fuel/charging entries, maintenance records, and fleet analytics. It provides per-vehicle efficiency metrics (km/L, km/kWh), cost breakdown dashboards with interactive SVG charts, maintenance reminder scheduling, and receipt management. Designed for personal or small-fleet use by individual vehicle owners.
- **Target Audience:** End-users (vehicle owners managing personal fleets of 1–N vehicles). Backend also serves potential mobile (Flutter) and third-party clients via a RESTful JWT-secured API.

### Component Blueprint & Tech Stack
Map out the technical dependencies detected in configuration files.

- **Frontend Layer:** React 17, TypeScript 4.x, Tailwind CSS 4.x, Axios HTTP client, React Router v5 (HashRouter). Create React App (CRA) build toolchain. No global state management library (local component state only). Collapsible sidebar layout with viewport-locked navigation. Vehicle-themed SVG favicon (`public/favicon.svg`).
- **Backend/API Layer:** ASP.NET Core 10.0 Web API (Clean Architecture with 4 layers: Domain → Application → Infrastructure → Api). JWT Bearer authentication (HMAC-SHA256, 120-minute expiry). FluentValidation auto-validation. AutoMapper for entity↔DTO mapping. Serilog structured console logging. Global exception middleware (maps `KeyNotFoundException`→404, `UnauthorizedAccessException`→401, `InvalidOperationException`→400). Background service (`MaintenanceReminderBackgroundService`) runs every 6 hours. CORS policy allows `http://localhost:10015` only.
- **Data Persistence Layer:** Entity Framework Core 10.x with SQL Server Express LocalDB (`HeliumAppDb`). `AppDbContext` with `GenericRepository<T>` + `UnitOfWork` pattern. Single migration (`20260502044911_InitialCreate`). Local file storage for receipt images (`LocalFileStorageService` → `storage/` directory).
- **External Integrations:** None currently active. NotificationService is a log-only stub. Planned: Gmail SMTP (MailKit) for PIN-based passwordless login (ADR-015, design approved, not implemented). Mobile Flutter app scaffolded but empty.

### Data Flow & Communication Lifecycle
Describe sequential flows using clear text arrows.

1. **Authentication Flow:**
   `Frontend LoginPage → POST /api/auth/login (email + password) → AuthController.Login() → AuthService.LoginAsync() → UserRepo.Query(email) → PasswordHasher.Verify(salt+password) → JwtTokenService.GenerateToken(sub, email) → return AuthResultDto{token, user} → Frontend stores JWT in localStorage → redirects to /dashboard`
   Protected requests: `React Page → Axios.get(url, {Authorization: Bearer <token>}) → Controller [Authorize] → ClaimTypes.NameIdentifier → extract userId → service/repository → DB query filtered by userId → DTO → JSON response`

2. **Core Feature Read/Write Flow (Fuel Entry example):**
   `Frontend FuelEntryCreatePage → POST /api/fuelentries (JWT + body) → FuelEntriesController.Create() → FuelEntryService.CreateAsync() → validate VehicleId ownership (vehicle.UserId == tokenUserId) → FluentValidation → Repository.AddAsync() → UnitOfWork.SaveChangesAsync() → return 201 Created`
   `Frontend Dashboard → GET /api/dashboard/energy-trend?year=2026 → DashboardController.GetEnergyTrend() → DashboardService.GetYearlyEnergyTrendAsync() → query FuelEntry/ChargingEntry/MaintenanceRecord grouped by month → aggregate fuelCost, chargingCost, fuelVolumeLiters, energyConsumedKwh, maintenanceCost → return EnergyTrendPointDto[] (12 points) → Frontend renders SVG line chart with hover tooltips`

---

## 2. Database Schema & Data Models Matrix

> **AI Instruction:** Inspect model/schema definition files (Prisma, Mongoose, TypeORM, or SQL DDL files). Map each entity into tabular grids and document relationships.

### Entity Attributes

#### Entity: User

| Attribute Name | Storage Data Type | Key / Modifiers | Logical Field Description |
| :--- | :--- | :--- | :--- |
| `Id` | `Guid` | Primary Key / UUID | Unique auto-generated entity identifier |
| `FirstName` | `nvarchar(100)` | Not Null | User's first name |
| `LastName` | `nvarchar(100)` | Not Null | User's last name |
| `Email` | `nvarchar(200)` | Not Null / Unique Index | Primary user authentication identifier (case-insensitive) |
| `PasswordHash` | `nvarchar(max)` | Not Null | SHA256 hash of password + salt (Base64-encoded) |
| `PasswordSalt` | `nvarchar(max)` | Not Null | 16-byte random salt (Base64-encoded) |
| `PreferredCurrency` | `nvarchar(10)` | Default: `"USD"` | ISO currency code for cost display |
| `CreatedAt` | `DateTimeOffset` | Default: NOW() | Audit timestamp for entity creation (from EntityBase) |
| `UpdatedAt` | `DateTimeOffset?` | Nullable | Audit timestamp for last modification (from EntityBase) |

#### Entity: Vehicle

| Attribute Name | Storage Data Type | Key / Modifiers | Logical Field Description |
| :--- | :--- | :--- | :--- |
| `Id` | `Guid` | Primary Key / UUID | Unique identifier |
| `UserId` | `Guid` | Foreign Key → `User.Id` | Owner of the vehicle (cascade delete) |
| `Name` | `nvarchar(100)` | Not Null | User-assigned display name |
| `Make` | `nvarchar(100)` | Not Null | Manufacturer (e.g., "Toyota") |
| `Model` | `nvarchar(100)` | Not Null | Model name (e.g., "Camry") |
| `Year` | `int?` | Nullable | Manufacturing year (1900–current+1) |
| `PowertrainType` | `int` | Not Null / Enum | 0=Petrol, 1=Diesel, 2=Hybrid, 3=Electric |
| `BodyType` | `int` | Not Null / Enum | 0=Sedan, 1=SUV, 2=Truck, 3=Hatchback, 4=Coupe, 5=Wagon, 6=Van, 7=Convertible |
| `Vin` | `nvarchar(50)` | Nullable | Vehicle Identification Number |
| `CreatedAt` | `DateTimeOffset` | Default: NOW() | EntityBase audit field |
| `UpdatedAt` | `DateTimeOffset?` | Nullable | EntityBase audit field |

#### Entity: FuelEntry

| Attribute Name | Storage Data Type | Key / Modifiers | Logical Field Description |
| :--- | :--- | :--- | :--- |
| `Id` | `Guid` | Primary Key / UUID | Unique identifier |
| `UserId` | `Guid` | Foreign Key → `User.Id` | Creator of the entry (delete behavior: NoAction) |
| `VehicleId` | `Guid` | Foreign Key → `Vehicle.Id` | Associated vehicle (cascade delete) |
| `Date` | `DateTimeOffset` | Not Null | Date/time of the fuel fill-up |
| `Odometer` | `int` | Not Null | Vehicle odometer reading in km at fill-up |
| `Liters` | `decimal(18,2)` | Not Null / Positive | Volume of fuel dispensed in liters |
| `Cost` | `decimal(18,2)` | Not Null / Positive | Total cost of fuel dispensed |
| `Station` | `nvarchar(200)` | Nullable | Fuel station name |
| `ReceiptImagePath` | `nvarchar(max)` | Nullable | File path to uploaded receipt image |
| `CreatedAt` | `DateTimeOffset` | Default: NOW() | EntityBase audit field |
| `UpdatedAt` | `DateTimeOffset?` | Nullable | EntityBase audit field |

#### Entity: ChargingEntry

| Attribute Name | Storage Data Type | Key / Modifiers | Logical Field Description |
| :--- | :--- | :--- | :--- |
| `Id` | `Guid` | Primary Key / UUID | Unique identifier |
| `UserId` | `Guid` | Foreign Key → `User.Id` | Creator of the entry (delete behavior: NoAction) |
| `VehicleId` | `Guid` | Foreign Key → `Vehicle.Id` | Associated vehicle (cascade delete) |
| `Date` | `DateTimeOffset` | Not Null | Date/time of the charging session |
| `Odometer` | `int` | Not Null | Vehicle odometer reading in km |
| `KwhUsed` | `decimal(18,2)` | Not Null / Positive | Energy consumed in kilowatt-hours |
| `Cost` | `decimal(18,2)` | Not Null / Positive | Total cost of the charging session |
| `Location` | `nvarchar(200)` | Nullable | Charging station location name |
| `CreatedAt` | `DateTimeOffset` | Default: NOW() | EntityBase audit field |
| `UpdatedAt` | `DateTimeOffset?` | Nullable | EntityBase audit field |

#### Entity: MaintenanceRecord

| Attribute Name | Storage Data Type | Key / Modifiers | Logical Field Description |
| :--- | :--- | :--- | :--- |
| `Id` | `Guid` | Primary Key / UUID | Unique identifier |
| `UserId` | `Guid` | Foreign Key → `User.Id` | Creator of the record (delete behavior: NoAction) |
| `VehicleId` | `Guid` | Foreign Key → `Vehicle.Id` | Associated vehicle (cascade delete) |
| `Type` | `nvarchar(200)` | Not Null | Maintenance type description (e.g., "Oil Change") |
| `Odometer` | `int` | Not Null | Vehicle odometer reading in km at service |
| `ServiceDate` | `DateTimeOffset` | Not Null | Date the maintenance was performed |
| `Notes` | `nvarchar(max)` | Nullable | Free-text notes about the service |
| `ReceiptImagePath` | `nvarchar(max)` | Nullable | File path to uploaded receipt image |
| `Cost` | `decimal(18,2)` | Not Null / Positive | Total cost of the maintenance |
| `Garage` | `nvarchar(200)` | Nullable | Garage or shop name |
| `Mechanic` | `nvarchar(200)` | Nullable | Mechanic or technician name |
| `WorkStatus` | `int` | Not Null / Enum | 0=Scheduled, 1=InProgress, 2=Completed |
| `CreatedAt` | `DateTimeOffset` | Default: NOW() | EntityBase audit field |
| `UpdatedAt` | `DateTimeOffset?` | Nullable | EntityBase audit field |

#### Entity: MaintenanceReminder

| Attribute Name | Storage Data Type | Key / Modifiers | Logical Field Description |
| :--- | :--- | :--- | :--- |
| `Id` | `Guid` | Primary Key / UUID | Unique identifier |
| `MaintenanceRecordId` | `Guid` | Foreign Key → `MaintenanceRecord.Id` / Unique | One-to-one with parent record (cascade delete) |
| `IntervalType` | `int` | Not Null / Enum | 0=Mileage, 1=Time |
| `IntervalValue` | `int` | Not Null | Mileage interval in km, or time interval in days |
| `NextDueDate` | `DateTimeOffset?` | Nullable | Next due date (populated when IntervalType = Time) |
| `NextDueMileageKm` | `int?` | Nullable | Next due odometer (populated when IntervalType = Mileage) |
| `CreatedAt` | `DateTimeOffset` | Default: NOW() | EntityBase audit field |
| `UpdatedAt` | `DateTimeOffset?` | Nullable | EntityBase audit field |

### Entity Relationships
Define relational constraints and cascading rules between models:

* **`User` → `Vehicle`**: One-to-Many. Deleting a user cascades delete to all associated vehicles.
* **`Vehicle` → `FuelEntry`**: One-to-Many. Deleting a vehicle cascades delete to all fuel entries.
* **`Vehicle` → `ChargingEntry`**: One-to-Many. Deleting a vehicle cascades delete to all charging entries.
* **`Vehicle` → `MaintenanceRecord`**: One-to-Many. Deleting a vehicle cascades delete to all maintenance records.
* **`MaintenanceRecord` → `MaintenanceReminder`**: One-to-One (unique FK). Deleting a maintenance record cascades delete to its reminder. Only one reminder per record.
* **`FuelEntry` → `User`**: Foreign Key with NoAction delete behavior (user deletion does not cascade to fuel entries).
* **`ChargingEntry` → `User`**: Foreign Key with NoAction delete behavior.
* **`MaintenanceRecord` → `User`**: Foreign Key with NoAction delete behavior.

---

## 3. RESTful API Endpoint Reference

> **AI Instruction:** Scan all active route files, controllers, and router configurations. Extract every public and protected endpoint, mapping request payloads and response contracts.

### Service Context & Global Defaults
* **Local Base Path:** `http://localhost:10011`
* **HTTPS Base Path:** `https://localhost:10012`
* **Frontend Base Path:** `http://localhost:10015`
* **Global Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>` (for protected endpoints)
* **Error Format:** RFC 7807 `ProblemDetails` (`{type, title, status, detail}`)

---

### Route Catalog

#### `[POST /api/auth/register]`
* **Title:** User Registration
* **Auth Level:** Public
* **Request Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass1!",
    "preferredCurrency": "USD"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "guid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "preferredCurrency": "USD"
    }
  }
  ```
* **Error Response (400 Bad Request):**
  ```json
  { "type": "https://tools.ietf.org/html/rfc7807", "title": "Bad Request", "status": 400, "detail": "Email already registered." }
  ```
* **Notes:** FluentValidation auto-validates: First/LastName 1–100 chars, Email format + unique, Password 8+ chars with uppercase + lowercase + digit + special char. Email uniqueness is case-insensitive (ServerSide case-insensitive collation).

#### `[POST /api/auth/login]`
* **Title:** User Login
* **Auth Level:** Public
* **Request Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  { "email": "john@example.com", "password": "SecurePass1!" }
  ```
* **Success Response (200 OK):**
  ```json
  { "token": "eyJhbGciOiJIUzI1NiIs...", "user": { "id": "guid", "firstName": "John", "lastName": "Doe", "email": "john@example.com", "preferredCurrency": "USD" } }
  ```
* **Error Response (401 Unauthorized):**
  ```json
  { "type": "https://tools.ietf.org/html/rfc7807", "title": "Unauthorized", "status": 401, "detail": "Invalid email or password." }
  ```

#### `[GET /api/users/me]`
* **Title:** Get Current User Profile
* **Auth Level:** Bearer Token (JWT)
* **Request Headers:** `Authorization: Bearer <token>`
* **Success Response (200 OK):**
  ```json
  { "id": "guid", "firstName": "John", "lastName": "Doe", "email": "john@example.com", "preferredCurrency": "USD" }
  ```
* **Error Response (404 Not Found):**
  ```json
  { "type": "https://tools.ietf.org/html/rfc7807", "title": "Not Found", "status": 404, "detail": "User not found." }
  ```

---

#### `[GET /api/vehicles]`
* **Title:** List Vehicles (Paginated)
* **Auth Level:** Bearer Token (JWT)
* **Request Headers:** `Authorization: Bearer <token>`
* **Query Parameters:** `page` (int, default 1), `pageSize` (int, default 50), `sortBy` (`name`|`createdat`), `sortDirection` (`asc`|`desc`)
* **Success Response (200 OK):**
  ```json
  {
    "items": [{ "id": "guid", "name": "My Car", "make": "Toyota", "model": "Camry", "year": 2022, "powertrainType": 0, "bodyType": 0, "vin": "...", "createdAt": "..." }],
    "totalCount": 5, "page": 1, "pageSize": 50, "totalPages": 1
  }
  ```

#### `[GET /api/vehicles/{id}]`
* **Title:** Get Vehicle by ID
* **Auth Level:** Bearer Token (JWT)
* **Success Response (200 OK):** Single `VehicleDto` object
* **Error Response (404 Not Found):** `KeyNotFoundException` → "Vehicle not found."

#### `[POST /api/vehicles]`
* **Title:** Create Vehicle
* **Auth Level:** Bearer Token (JWT)
* **Request Body:**
  ```json
  { "name": "My Car", "make": "Toyota", "model": "Camry", "year": 2022, "powertrainType": 0, "bodyType": 0, "vin": "1234567890" }
  ```
* **Success Response (201 Created):** Created `VehicleDto` with server-assigned `id`
* **Notes:** `UserId` is overwritten from JWT token (not from request body).

#### `[PUT /api/vehicles/{id}]`
* **Title:** Update Vehicle
* **Auth Level:** Bearer Token (JWT)
* **Request Body:** Same shape as create
* **Success Response (204 No Content)**
* **Error Response (404 Not Found):** "Vehicle not found."

#### `[DELETE /api/vehicles/{id}]`
* **Title:** Delete Vehicle
* **Auth Level:** Bearer Token (JWT)
* **Success Response (204 No Content)** — silent no-op if vehicle already missing
* **Notes:** Cascades to all associated FuelEntry, ChargingEntry, MaintenanceRecord, MaintenanceReminder.

---

#### `[GET /api/fuelentries]`
* **Title:** List Fuel Entries (Paginated)
* **Auth Level:** Bearer Token (JWT)
* **Query Parameters:** `vehicleId` (Guid, required), `page` (int, default 1), `pageSize` (int, default 200), `sortBy` (`date`|`odometer`), `sortDirection` (`asc`|`desc`)
* **Success Response (200 OK):**
  ```json
  {
    "items": [{ "id": "guid", "vehicleId": "guid", "date": "2026-01-15", "odometer": 12500, "liters": 45.50, "cost": 72.80, "station": "Shell", "receiptImagePath": null, "vehicleVin": "1234567890" }],
    "totalCount": 3, "page": 1, "pageSize": 200, "totalPages": 1
  }
  ```
* **Notes:** `vehicleVin` is populated via in-memory join (not a DB FK).

#### `[GET /api/fuelentries/{id}]`
* **Title:** Get Fuel Entry by ID
* **Auth Level:** Bearer Token (JWT)
* **Success Response (200 OK):** Single `FuelEntryDto` with populated `vehicleVin`

#### `[POST /api/fuelentries]`
* **Title:** Create Fuel Entry
* **Auth Level:** Bearer Token (JWT)
* **Request Body:**
  ```json
  { "vehicleId": "guid", "date": "2026-01-15", "odometer": 12500, "liters": 45.50, "cost": 72.80, "station": "Shell", "receiptImagePath": null }
  ```
* **Success Response (201 Created)**
* **Error Response (401 Unauthorized):** "Vehicle does not belong to the current user."

#### `[PUT /api/fuelentries/{id}]`
* **Title:** Update Fuel Entry
* **Auth Level:** Bearer Token (JWT)
* **Success Response (204 No Content)**
* **Error Response (404 Not Found):** "Fuel entry not found."

#### `[DELETE /api/fuelentries/{id}]`
* **Title:** Delete Fuel Entry
* **Auth Level:** Bearer Token (JWT)
* **Success Response (204 No Content)**

---

#### `[GET /api/chargingentries]`
* **Title:** List Charging Entries (Paginated)
* **Auth Level:** Bearer Token (JWT)
* **Query Parameters:** `vehicleId` (Guid, required), `page` (int, default 1), `pageSize` (int, default 200), `sortBy` (`date`|`odometer`), `sortDirection` (`asc`|`desc`)
* **Success Response (200 OK):**
  ```json
  {
    "items": [{ "id": "guid", "vehicleId": "guid", "date": "2026-01-15", "odometer": 12500, "kwhUsed": 22.50, "cost": 5.40, "location": "Tesla Supercharger", "vehicleVin": "..." }],
    "totalCount": 3, "page": 1, "pageSize": 200, "totalPages": 1
  }
  ```

#### `[GET /api/chargingentries/{id}]`
* **Title:** Get Charging Entry by ID
* **Auth Level:** Bearer Token (JWT)
* **Success Response (200 OK):** Single `ChargingEntryDto`

#### `[POST /api/chargingentries]`
* **Title:** Create Charging Entry
* **Auth Level:** Bearer Token (JWT)
* **Request Body:**
  ```json
  { "vehicleId": "guid", "date": "2026-01-15", "odometer": 12500, "kwhUsed": 22.50, "cost": 5.40, "location": "Tesla Supercharger" }
  ```
* **Success Response (201 Created)**
* **Error Response (401 Unauthorized):** "Vehicle does not belong to the current user."

#### `[PUT /api/chargingentries/{id}]`
* **Title:** Update Charging Entry
* **Auth Level:** Bearer Token (JWT)
* **Success Response (204 No Content)**

#### `[DELETE /api/chargingentries/{id}]`
* **Title:** Delete Charging Entry
* **Auth Level:** Bearer Token (JWT)
* **Success Response (204 No Content)**

#### `[GET /api/maintenancerecords]`
* **Title:** List Maintenance Records (Paginated)
* **Auth Level:** Bearer Token (JWT)
* **Query Parameters:** `vehicleId` (Guid, required), `page` (int, default 1), `pageSize` (int, default 200), `sortBy` (`date`|`odometer`), `sortDirection` (`asc`|`desc`)
* **Success Response (200 OK):**
  ```json
  {
    "items": [{ "id": "guid", "vehicleId": "guid", "type": "Oil Change", "odometer": 12500, "serviceDate": "2026-01-15", "notes": "...", "receiptImagePath": null, "cost": 89.00, "garage": "Auto Shop", "mechanic": "Bob", "workStatus": 2, "vehicleVin": "...", "reminder": { "id": "guid", "intervalType": 1, "intervalValue": 180, "nextDueDate": "2026-07-14", "nextDueMileageKm": null } }],
    "totalCount": 3, "page": 1, "pageSize": 200, "totalPages": 1
  }
  ```
* **Notes:** `reminder` is included when the record has one. `vehicleVin` populated via in-memory join.

#### `[GET /api/maintenancerecords/due]`
* **Title:** Get Due Maintenance Records
* **Auth Level:** Bearer Token (JWT)
* **Query Parameters:** `asOfDate` (DateTimeOffset, optional, defaults to today)
* **Success Response (200 OK):** Array of `MaintenanceRecordDto` whose reminders are due as of the given date.
* **Due Logic:** Time-based → `NextDueDate <= asOfDate`; Mileage-based → `latestOdometer >= NextDueMileageKm` (latest odometer = max across fuel/charging/maintenance entries).

#### `[GET /api/maintenancerecords/{id}]`
* **Title:** Get Maintenance Record by ID
* **Auth Level:** Bearer Token (JWT)
* **Success Response (200 OK):** Single `MaintenanceRecordDto` (with reminder + vehicleVin)

#### `[POST /api/maintenancerecords]`
* **Title:** Create Maintenance Record
* **Auth Level:** Bearer Token (JWT)
* **Request Body:**
  ```json
  {
    "vehicleId": "guid", "type": "Oil Change", "odometer": 12500, "serviceDate": "2026-01-15",
    "notes": "...", "receiptImagePath": null, "cost": 89.00, "garage": "Auto Shop", "mechanic": "Bob", "workStatus": 2,
    "reminder": { "intervalType": 1, "intervalValue": 180 }
  }
  ```
* **Success Response (201 Created)**
* **Notes:** If `reminder` present: Time → `NextDueDate = ServiceDate + IntervalValue days`; Mileage → `NextDueMileageKm = Odometer + IntervalValue`.

#### `[PUT /api/maintenancerecords/{id}]`
* **Title:** Update Maintenance Record
* **Auth Level:** Bearer Token (JWT)
* **Success Response (204 No Content)**
* **Notes:** Handles reminder create/update/delete based on presence of `reminder` in payload.

#### `[DELETE /api/maintenancerecords/{id}]`
* **Title:** Delete Maintenance Record
* **Auth Level:** Bearer Token (JWT)
* **Success Response (204 No Content)** — cascades to reminder.

---

### Dashboard Endpoints (all `[Authorize]`)

#### `[GET /api/dashboard/summary]`
* **Title:** Dashboard Summary
* **Auth Level:** Bearer Token (JWT)
* **Query Parameters:** `month` (int, optional, defaults to current month)
* **Success Response (200 OK):**
  ```json
  {
    "totalVehicles": 2, "totalFuelEntries": 12, "totalChargingEntries": 4, "totalMaintenanceRecords": 3,
    "totalFuelCost": 850.00, "totalChargingCost": 120.00, "totalMaintenanceCost": 450.00,
    "totalDistanceKm": 3200, "avgFuelEfficiencyKmPerLiter": 14.5, "avgChargingEfficiencyKmPerKwh": 6.2
  }
  ```

#### `[GET /api/dashboard/energy-trend]`
* **Title:** Yearly Energy Trend (12 points)
* **Auth Level:** Bearer Token (JWT)
* **Query Parameters:** `year` (int, optional), `vehicleId` (Guid, optional)
* **Success Response (200 OK):** Array of 12 `EnergyTrendPointDto`:
  ```json
  [{ "month": 1, "fuelCost": 120.00, "chargingCost": 30.00, "maintenanceCost": 0, "fuelVolumeLiters": 45.5, "energyConsumedKwh": 22.5, "distanceKm": 600 }]
  ```
* **Notes:** `distanceKm` computed from odometer deltas via `OdometerRange` class in `DashboardService`.

#### `[GET /api/dashboard/available-years]`
* **Title:** Available Years
* **Auth Level:** Bearer Token (JWT)
* **Success Response (200 OK):** `[2026, 2025, 2024]` (descending int list)

#### `[GET /api/dashboard/vehicles]`
* **Title:** Vehicle Summaries
* **Auth Level:** Bearer Token (JWT)
* **Query Parameters:** `month` (int, optional)
* **Success Response (200 OK):** Array of `VehicleSummaryDto` (per-vehicle totals + efficiency).

#### `[GET /api/dashboard/recent-activity]`
* **Title:** Recent Activity
* **Auth Level:** Bearer Token (JWT)
* **Query Parameters:** `count` (int, default 10)
* **Success Response (200 OK):** Array of `RecentActivityDto` (recent fuel/charging/maintenance events with type, date, description).

---

### Reports / Files / Health

#### `[GET /api/reports/vehicle-efficiency/{vehicleId}]`
* **Title:** Vehicle Efficiency Report
* **Auth Level:** Bearer Token (JWT)
* **Success Response (200 OK):**
  ```json
  { "vehicleId": "guid", "kmPerLiter": 14.5, "kmPerKwh": 6.2, "costPerKm": 0.18 }
  ```
* **Notes:** Efficiency = average of consecutive per-fill-up pairs `tripDist/tripLiters` (requires ≥2 entries). `costPerKm = totalCost / (maxOdometer - minOdometer)`. Hybrid vehicles compute fuel distance from fuel-odometer pairs and charging distance from charging pairs separately.

#### `[POST /api/files/receipts]`
* **Title:** Upload Receipt Image
* **Auth Level:** Bearer Token (JWT)
* **Request:** `multipart/form-data` file field (max 10 MB)
* **Success Response (200 OK):** `{ "path": "receipts/guid.ext" }`
* **Notes:** Saves to `<base>/storage` via `LocalFileStorageService`.

#### `[GET /api/health]`
* **Title:** Health Check
* **Auth Level:** Public
* **Success Response (200 OK):** `{ "status": "ok" }`

#### `[GET /]`
* **Title:** Root Greeting
* **Auth Level:** Public
* **Success Response (200 OK):** `"Hello from Helium App — API is running."`

---

## 4. Business Logic Rules

### Fuel/Charging Efficiency (km/L & km/kWh)
- Efficiency is computed as the **average of consecutive per-fill-up pairs**: `tripDist / tripLiters` for each adjacent pair of entries.
- Requires **≥2 entries** for a vehicle to produce a meaningful efficiency value.
- **Hybrid vehicles:** fuel distance uses only fuel-odometer pairs; charging distance uses only charging-odometer pairs.
- `costPerKm = totalCost / (maxOdometer - minOdometer)`.

### Maintenance Reminder Due Logic
- **Time-based:** due when `NextDueDate <= asOfDate`.
- **Mileage-based:** due when `latestOdometer >= NextDueMileageKm`, where `latestOdometer` = max odometer across all fuel, charging, and maintenance entries for the vehicle.
- **Background service** (`MaintenanceReminderBackgroundService`) runs every 6 hours, calls `GetDueRemindersAsync(null, today)` across all users, and forwards to `NotificationService` (currently a log-only stub).

### Security & Auth
- **Password hashing:** SHA256 of UTF8 `password + salt`; salt = 16 random bytes (Base64). (ADR-004: known debt — should migrate to BCrypt/Argon2.)
- **JWT:** HMAC-SHA256, issuer `HeliumApp`, audience `HeliumAppUsers`, secret `CHANGE_ME_TO_A_SECURE_32_CHAR_SECRET`, expiry 120 minutes. Claims: `sub`, `email`, `ClaimTypes.NameIdentifier`.
- Controllers resolve the current user id from `ClaimTypes.NameIdentifier`, falling back to `sub`.
- All URLs lowercase (`LowercaseUrls=true`).

### Error Handling
`ExceptionHandlingMiddleware` maps exceptions to RFC 7807 `ProblemDetails`:
| Exception | HTTP Status |
| :--- | :--- |
| `KeyNotFoundException` | 404 Not Found |
| `UnauthorizedAccessException` | 401 Unauthorized |
| `InvalidOperationException` | 400 Bad Request |
| Any other | 500 Internal Server Error |

---

## 5. Setup & Run Guide

### Prerequisites
- .NET 10 SDK
- Node.js (with npm)
- SQL Server Express LocalDB (or full SQL Server)
- AutoHotkey (optional, for the launcher script)

### Backend
```bash
cd "F:\GitHub\Helium App\Backend\Helium.Api"
dotnet restore
dotnet run
```
- HTTP: `http://localhost:10011` | HTTPS: `https://localhost:10012`
- `Program.cs` auto-applies `dbContext.Database.Migrate()` on startup (creates `HeliumAppDb` if missing).

### Frontend
```bash
cd "F:\GitHub\Helium App\Frontend\helium-frontend\web"
npm install
npm start
```
- HTTP: `http://localhost:10015`
- Start script uses `NODE_OPTIONS=--openssl-legacy-provider` (required for the legacy Webpack/OpenSSL combination).

### One-Click Launcher
`F:\GitHub\Helium App\start-helium.ahk` (AutoHotkey):
- **Yes** → starts backend (`dotnet run --project Helium.Api`) + frontend (`npm start`)
- **No** → starts frontend only

### First-Time Login
- No default admin user exists on a fresh database. Register first via the Signup page (`admin@helium.app` / `Admin@123` was used during development).

### Common Issues
- **CORS errors:** Frontend must run on `http://localhost:10015` (the only allowed origin).
- **Port conflicts:** Ensure ports 10011/10012/10015 are free before starting.
- **OpenSSL legacy provider:** Required for the frontend build; do not remove `NODE_OPTIONS`.

---

## 6. Project Structure

```
Helium App/
├── Backend/
│   ├── Helium.Domain/            # Entities, enums, EntityBase (no deps)
│   ├── Helium.Application/       # DTOs, services, validators, AutoMapper, DI
│   ├── Helium.Infrastructure/    # AppDbContext, repositories, JWT, storage, notifications
│   ├── Helium.Api/               # Controllers, middleware, Program.cs
│   └── Helium.Api.Tests/         # Integration tests
├── Frontend/
│   └── helium-frontend/
│       └── web/                  # React 17 + TS + Tailwind (CRA)
│           ├── public/           # index.html, favicon.svg, appsettings.json
│           └── src/
│               ├── pages/        # Home, Login, Signup, Dashboard, Vehicles, Fuel, Charging, Maintenance
│               └── components/   # PrimaryButton, shared UI
├── docs/                         # Architecture and Other Details.md, Context Ledger.md
└── start-helium.ahk              # AutoHotkey launcher
```

---

## 7. Known Gaps & Tech Debt

| Area | Status | Notes |
| :--- | :--- | :--- |
| PIN-based passwordless login (ADR-015) | Design approved, **not implemented** | No MailKit, no PIN endpoints, no OnboardingPage. SignupPage/register DTOs still present. |
| NotificationService | Log-only stub | No real email delivery. |
| Route guard / auth context | Missing | Pages can be visited without a token. |
| Pagination controls | Missing on frontend | All pages hardcode pageSize 50/100/200; backend supports it. |
| Receipt upload | URL text field only | No file picker or `GET /api/files/{filename}` download endpoint. |
| Password hashing | SHA256 + salt | Should migrate to BCrypt/Argon2 (ADR-004). |
| Axios interceptor | Missing | Every page reads `localStorage.getItem('token')` manually (ADR-006). |
| Dead links | LoginPage `/forgot-password`, sidebar "Reports" | Both currently dead routes. |
