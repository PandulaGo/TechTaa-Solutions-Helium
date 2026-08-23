# Business Logic Reference

This document captures every business rule, calculation, formula, and validation across the Helium App backend. Use this as the single source of truth for how the system behaves.

---

## 1. Entity Business Rules

### 1.1 Vehicle

| Rule | Detail |
|------|--------|
| Ownership | Every vehicle belongs to a `User` via `UserId` FK |
| Name | Required, max 100 chars |
| Make | Required, max 100 chars |
| Model | Required, max 100 chars |
| Year | Optional; if provided, 1900 ≤ Year ≤ (current year + 1) |
| VIN | Optional, max 50 chars |
| PowertrainType | `Petrol=0, Diesel=1, Hybrid=2, Electric=3` |
| BodyType | Enum (`Sedan, SUV, Truck, Hatchback, Coupe, Wagon, Van, Convertible`) |

**Powertrain Classification for calculations:**
- **ICE (Internal Combustion):** `Petrol` OR `Diesel`
- **Fuel-capable:** ICE + `Hybrid` (can receive fuel entries)
- **EV-capable:** `Hybrid` OR `Electric` (can receive charging entries)

### 1.2 FuelEntry

| Rule | Detail |
|------|--------|
| Ownership | Belongs to `User` and `Vehicle` via FK |
| Date | Required (`DateOnly`) |
| OdometerReadingKm | Required, ≥ 0 |
| Liters | Required, > 0 |
| Cost | Required, ≥ 0, stored as `decimal(18,2)` |
| FuelStationName | Optional, max 200 chars |
| User FK | `DeleteBehavior.NoAction` (prevents cascade cycle) |

### 1.3 ChargingEntry

| Rule | Detail |
|------|--------|
| Ownership | Belongs to `User` and `Vehicle` via FK |
| Date | Required (`DateOnly`) |
| OdometerReadingKm | Required, ≥ 0 |
| KwhUsed | Required, > 0, stored as `decimal(18,2)` |
| Cost | Required, ≥ 0, stored as `decimal(18,2)` |
| ChargingLocation | Optional, max 200 chars |
| Vehicle eligibility | Only `Hybrid` or `Electric` vehicles accept charging entries |
| User FK | `DeleteBehavior.NoAction` |

### 1.4 MaintenanceRecord

| Rule | Detail |
|------|--------|
| Ownership | Belongs to `User` and `Vehicle` via FK |
| MaintenanceType | Required, max 200 chars |
| OdometerReadingKm | Required, ≥ 0 |
| ServiceDate | Required (`DateOnly`) |
| Cost | Required, ≥ 0, stored as `decimal(18,2)` |
| WorkStatus | Enum: `Scheduled=0, InProgress=1, Completed=2`; default `Scheduled` |
| GarageName | Optional, max 200 chars |
| MechanicName | Optional, max 200 chars |
| User FK | `DeleteBehavior.NoAction` |
| Reminder FK | `DeleteBehavior.Cascade` (delete reminders when record deleted) |

### 1.5 MaintenanceReminder

| Rule | Detail |
|------|--------|
| IntervalType | `Mileage=0` or `Time=1` |
| IntervalValue | Positive integer (days for Time, km for Mileage) |
| NextDueDate | Set if IntervalType == Time: `ServiceDate + IntervalValue days` |
| NextDueMileageKm | Set if IntervalType == Mileage: `OdometerReadingKm + IntervalValue km` |

### 1.6 User

| Rule | Detail |
|------|--------|
| Email | Required, max 200 chars, unique (case-insensitive) |
| FirstName | Required, max 100 chars |
| LastName | Required, max 100 chars |
| PreferredCurrency | Required, max 10 chars, default `"USD"` |
| Password | Self-hashed: SHA256(salt + password), salt = 16 random bytes |
| JWT | Contains `sub` (UserId), `email`; expires after 120 min; signed HMAC-SHA256 |

---

## 2. Authorization Rules

### 2.1 Data Isolation

Every entry table (`FuelEntry`, `ChargingEntry`, `MaintenanceRecord`) has a direct `UserId` FK. All read/write operations filter by `userId` extracted from the JWT `sub` claim.

| Service | Create Check | Read/Update/Delete Check |
|---------|-------------|-------------------------|
| FuelEntryService | `vehicle.UserId == dto.UserId` | `entity.UserId == userId` |
| ChargingEntryService | `vehicle.UserId == dto.UserId` | `entity.UserId == userId` |
| MaintenanceService | `vehicle.UserId == dto.UserId` | `entity.UserId == userId` |
| VehicleService | Any authenticated user | `vehicle.UserId == userId` |

Unauthorized attempts throw `UnauthorizedAccessException` → mapped to HTTP 401.

---

## 3. Dashboard Calculations

### 3.1 Summary (`GetSummaryAsync`)

Returns `DashboardSummaryDto` with three sections:

**ICE Summary (`iceSummary`):**
- Vehicles: `PowertrainType == Petrol || Diesel`
- TotalCost: `Sum(FuelEntry.Cost)` for these vehicles in the current month
- TotalMileageKm: For each ICE vehicle, `max(Odometer) - min(Odometer)` from its fuel entries, summed across all vehicles

**EV Summary (`evSummary`):**
- Vehicles: `PowertrainType == Hybrid || Electric`
- Cost/Mileage calculated from `ChargingEntry` entries (same formula as ICE)
- Note: Uses charging entries, not fuel entries

**Maintenance Summary (`maintenanceSummary`):**
- `DueThisMonth`: Count of reminders where `NextDueDate <= today`
- `RemainingThisMonth`: Count where `today < NextDueDate <= monthEnd`
- `TotalCost`: `Sum(MaintenanceRecord.Cost)` for the month

### 3.2 Vehicle Summaries (`GetVehicleSummariesAsync`)

Per-vehicle snapshot for the Fleet Snapshot table:

**Current Odometer:**
```
currentOdometer = max(
    max(MaintenanceRecords.Odometer),
    max(FuelEntries.Odometer),
    max(ChargingEntries.Odometer)
)
```

**Monthly Costs (per vehicle):**
| Cost Field | Source | Filter |
|------------|--------|--------|
| `monthlyFuelCost` | `FuelEntry.Cost` | `VehicleId == vehicle.Id && Date in [monthStart, monthEnd]` |
| `monthlyChargingCost` | `ChargingEntry.Cost` | `VehicleId == vehicle.Id && Date in [monthStart, monthEnd]` |
| `monthlyMaintenanceCost` | `MaintenanceRecord.Cost` | `VehicleId == vehicle.Id && ServiceDate in [monthStart, monthEnd]` |
| `monthlyCost` (total) | Sum of the three above | — |

**Next Maintenance:**
- Finds the earliest upcoming reminder where `WorkStatus != Completed`
- If `NextDueDate.HasValue` → show date
- If `NextDueMileageKm.HasValue` → show formatted km

### 3.3 Energy Trend (`GetYearlyEnergyTrendAsync`)

Returns monthly aggregated data for line/trend charts.

**Input:** Year, optional VehicleId (per-vehicle filter)

**Per-month aggregation:**
| Field | Formula |
|-------|---------|
| `fuelCost` | `Sum(FuelEntry.Cost)` where month matches |
| `chargingCost` | `Sum(ChargingEntry.Cost)` where month matches |
| `fuelVolumeLiters` | `Sum(FuelEntry.Liters)` |
| `energyConsumedKwh` | `Sum(ChargingEntry.KwhUsed)` |
| `maintenanceCost` | `Sum(MaintenanceRecord.Cost)` where month matches |

**Derived fields in `EnergyTrendPointDto`:**
```csharp
TotalCost      = FuelCost + ChargingCost
TotalUsage     = FuelVolumeLiters + EnergyConsumedKwh
GrandTotalCost = FuelCost + ChargingCost + MaintenanceCost
```

**Used by frontend for:**
- **Cost Overview line chart**: Shows `fuelCost`, `chargingCost`, `maintenanceCost` as 3 separate lines
- **Price per Liter trend**: Shows `fuelCost / fuelVolumeLiters` per month (line chart with hover tooltips)

### 3.4 Recent Activity (`GetRecentActivityAsync`)

**Activity type mapping:**
| Source | ActivityType | Description Format |
|--------|-------------|-------------------|
| FuelEntry | `"Fuel"` | `"Filled {Liters:N1}L at {StationName}"` |
| ChargingEntry | `"Charging"` | `"Charged {KwhUsed:N1}kWh at {Location}"` |
| MaintenanceRecord | `"Maintenance"` | `"{MaintenanceType} ({WorkStatus})"` |

**Sorting:** By `ActivityDate` descending, top 10.

### 3.5 Available Years (`GetAvailableYearsAsync`)

Collects distinct years from `FuelEntry.Date`, `ChargingEntry.Date`, and `MaintenanceRecord.ServiceDate`. Always includes current year. Returns sorted descending.

---

## 4. Fuel Efficiency Calculation

### 4.1 Formula (Per-Fill-Up Average)

**km/L (fuel efficiency):**
```csharp
// For each consecutive pair of fuel entries:
for (int i = 1; i < entries.Count; i++) {
    tripDist  = entries[i].Odometer - entries[i-1].Odometer;  // km driven
    tripLiters = entries[i].Liters;                            // liters added
    if (tripDist > 0 && tripLiters > 0)
        kmPerLiter = tripDist / tripLiters;  // this fill-up's efficiency
}
// Display: average of all per-fill-up km/L values
```

**km/kWh (electric efficiency):** Same per-charge-pair average approach.

**Cost/km:**
```csharp
costPerKm = totalCost / totalDistance
```

### 4.2 Requires ≥ 2 entries

You need at least 2 fuel/charging entries with different odometer readings to calculate efficiency. Each pair of consecutive entries produces one trip measurement.

### 4.3 Hybrid Handling

- **Fuel distance**: Uses only fuel entry odometer pairs — NOT total vehicle distance
- **Electric distance**: Uses only charging entry odometer pairs
- This prevents hybrids from getting inflated efficiency where battery-assisted km were attributed to fuel

---

## 5. Maintenance Reminder Logic

### 5.1 Reminder Calculation (`MaintenanceService.CreateOrUpdateReminder`)

| Interval Type | Next Due Calculation |
|---------------|---------------------|
| `Time` | `NextDueDate = ServiceDate.AddDays(IntervalValue)`; `NextDueMileageKm = null` |
| `Mileage` | `NextDueMileageKm = OdometerReadingKm + IntervalValue`; `NextDueDate = null` |

### 5.2 Due Check (`MaintenanceService.GetDueRemindersAsync`)

| Check | Condition |
|-------|-----------|
| Due by Date | `IntervalType == Time && NextDueDate <= asOfDate` |
| Due by Mileage | `IntervalType == Mileage && latestOdometer >= NextDueMileageKm` |

Where `latestOdometer` is the max odometer from Fuel, Charging, and Maintenance entries for the vehicle.

### 5.3 Background Service

- Runs every **6 hours**
- Checks ALL users (passes `userId = null`)
- Identifies due reminders and processes them

---

## 6. Validation Rules

### 6.1 Vehicle

| Field | Rule | Create | Update |
|-------|------|:------:|:------:|
| Name | NotEmpty, MaxLength(100) | ✓ | ✓ |
| Make | NotEmpty, MaxLength(100) | ✓ | ✓ |
| Model | NotEmpty, MaxLength(100) | ✓ | ✓ |
| Year | InclusiveBetween(1900, currentYear+1) when set | ✓ | ✓ |
| BodyType | IsInEnum | ✓ | — |
| PowertrainType | IsInEnum | ✓ | — |

### 6.2 FuelEntry

| Field | Rule | Create | Update |
|-------|------|:------:|:------:|
| VehicleId | NotEmpty | ✓ | — |
| Date | NotEmpty | ✓ | ✓ |
| OdometerReadingKm | GreaterThanOrEqualTo(0) | ✓ | ✓ |
| Liters | GreaterThan(0) | ✓ | ✓ |
| Cost | GreaterThanOrEqualTo(0) | ✓ | ✓ |
| FuelStationName | MaxLength(200) | ✓ | ✓ |

### 6.3 ChargingEntry

| Field | Rule | Create | Update |
|-------|------|:------:|:------:|
| VehicleId | NotEmpty | ✓ | — |
| Date | NotEmpty | ✓ | ✓ |
| OdometerReadingKm | GreaterThanOrEqualTo(0) | ✓ | ✓ |
| KwhUsed | GreaterThan(0) | ✓ | ✓ |
| Cost | GreaterThanOrEqualTo(0) | ✓ | ✓ |
| ChargingLocation | MaxLength(200) | ✓ | ✓ |

### 6.4 MaintenanceRecord

| Field | Rule | Create | Update |
|-------|------|:------:|:------:|
| VehicleId | NotEmpty | ✓ | — |
| MaintenanceType | NotEmpty, MaxLength(200) | ✓ | ✓ |
| OdometerReadingKm | GreaterThanOrEqualTo(0) | ✓ | ✓ |
| ServiceDate | NotEmpty | ✓ | ✓ |
| Cost | GreaterThanOrEqualTo(0) | ✓ | ✓ |
| GarageName | MaxLength(200) | ✓ | ✓ |
| MechanicName | MaxLength(200) | ✓ | ✓ |
| WorkStatus | IsInEnum | ✓ | ✓ |

### 6.5 Auth

| Register Field | Rule |
|----------------|------|
| FirstName | NotEmpty, MaxLength(100) |
| LastName | NotEmpty, MaxLength(100) |
| Email | NotEmpty, EmailAddress, MaxLength(200) |
| Password | NotEmpty, MinimumLength(6) |
| PreferredCurrency | NotEmpty, MaxLength(10) |

| Login Field | Rule |
|-------------|------|
| Email | NotEmpty, EmailAddress, MaxLength(200) |
| Password | NotEmpty, MinimumLength(6) |

---

## 7. Pagination & Sorting

### 7.1 Defaults (`PaginationQuery`)
- `Page`: 1
- `PageSize`: 20 (clamped: min 1, max 500)
- `SortDirection`: Desc

### 7.2 Sort Fields per Entity

| Entity | Supported Sort Fields |
|--------|----------------------|
| Vehicles | `name`, `createdat` |
| FuelEntries | `date`, `odometer` |
| ChargingEntries | `date`, `odometer` |
| MaintenanceRecords | `date`, `odometer` |

---

## 8. Exception to HTTP Status Mapping

| Exception | HTTP Status |
|-----------|-------------|
| `KeyNotFoundException` | 404 Not Found |
| `UnauthorizedAccessException` | 401 Unauthorized |
| `InvalidOperationException` | 400 Bad Request |
| Validation failures | 400 Bad Request (FluentValidation) |
| All other exceptions | 500 Internal Server Error |

---

## 9. Database Constraints

### 9.1 Decimal Precision
- `FuelEntry.Cost`, `FuelEntry.Liters` → `decimal(18,2)`
- `ChargingEntry.Cost`, `ChargingEntry.KwhUsed` → `decimal(18,2)`
- `MaintenanceRecord.Cost` → `decimal(18,2)`

### 9.2 FK Cascade Rules
- User → Entry tables: `DeleteBehavior.NoAction` (prevents SQL Server cascade path cycles)
- MaintenanceRecord → MaintenanceReminder: `DeleteBehavior.Cascade`

### 9.3 Indexes
- `User.Email` — unique index

---

## 10. Auth & Security

### 10.1 Password Hashing
```
salt = RandomBytes(16)       // Base64-encoded
hash = SHA256(salt + password) // Base64-encoded
```

### 10.2 JWT Token
```
Claims: sub (UserId), email, nameid
Algorithm: HmacSha256
Expires: DateTime.UtcNow + 120 minutes
```

### 10.3 Registration
1. Check email uniqueness (case-insensitive)
2. Hash password with salt
3. Create User with new GUID
4. Return JWT token

### 10.4 Login
1. Find user by email (case-insensitive)
2. Hash input password with stored salt
3. Compare hash with stored hash
4. Return JWT token on match; throw `UnauthorizedAccessException` on mismatch

### 10.5 Planned: PIN-Based Passwordless Login (ADR-015)
> Design approved, not yet implemented. The flow below will replace sections 10.3–10.4.

1. `POST /api/auth/send-pin` — generate 6-digit PIN, store in `IMemoryCache` (`pin:{email}`, 5-min expiry), email via Gmail SMTP (MailKit); dev mode logs PIN to console instead
2. `POST /api/auth/verify-pin` — validate PIN against cache; auto-create user if email is new; return JWT + user
3. First-time users complete profile via `PATCH /api/users/me` on an `/onboarding` page (first/last name required; address, mobile optional) before reaching the dashboard

---

## 11. API URL Configuration

- Backend uses `LowercaseUrls = true` — all routes are lowercase
- Examples: `/api/fuelentries`, `/api/dashboard/summary`, `/api/users/me`

---

## 12. Dashboard Frontend Features

| Section | Location | Data Source |
|---------|----------|-------------|
| **Action Buttons** | Top | Navigation links |
| **Efficiency Cards** | Below actions | Per-vehicle km/L & km/kWh from `GetVehicleSummariesAsync` |
| **Price per Liter Trend** | Below efficiency | `GetYearlyEnergyTrendAsync` → `fuelCost / fuelVolumeLiters` |
| **Cost Overview Line Chart** | Below price trend | `GetYearlyEnergyTrendAsync` — 3 lines (fuel/charging/maintenance) |
| **Fleet Snapshot** | Side-by-side with Maintenance | Vehicle summary table with Fuel/Charging/Maintenance cost columns |
| **Maintenance Outlook** | Side-by-side with Fleet | Due/remaining reminders + spend + quick tips |
| **Recent Activity** | Bottom | Latest 10 fuel/charging/maintenance entries |

### 12.1 Sidebar

- Collapsible: toggle between full `w-64` and minimal `w-14`
- Navigation: Overview, Vehicles, Fuel Entries, Charging Entries, Maintenance
- Footer: User name + red Logout button
- `h-screen overflow-hidden` on parent keeps sidebar fixed to viewport

---

*Last updated: 2026-05-10*
