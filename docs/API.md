# API Reference

Base URL: `http://localhost:10011` (default)
**All URLs are lowercase** due to `LowercaseUrls = true` in the backend config. Routes below use lowercase.

## Authentication

### POST /api/auth/register
Create a new user account.

**Auth:** None

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Str0ng!Pass",
  "preferredCurrency": "USD"
}
```

**Password Rules:** Min 6 chars.

**Response:** `200 OK` — returns JWT token string.

---

### POST /api/auth/login
Authenticate and receive a JWT token.

**Auth:** None

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Str0ng!Pass"
}
```

**Response:** `200 OK` — returns JWT token string.

---

## Users

Requires `Authorization: Bearer <token>`.

### GET /api/users/me
Get the currently authenticated user's profile.

**Response:** `200 OK`
```json
{
  "id": "guid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "preferredCurrency": "USD"
}
```

---

## Health

### GET /api/health
Health check endpoint.

**Auth:** None

**Response:** `200 OK` — `{ "status": "ok" }`

---

## Vehicles

All vehicle endpoints require `Authorization: Bearer <token>`.

### GET /api/vehicles
List vehicles for the authenticated user.

**Query Parameters:** `page` (int), `pageSize` (int), `sortBy` (Name/CreatedAt), `sortDirection` (Asc/Desc)

**Response:** `200 OK` — `PagedResult<VehicleDto>`

### GET /api/vehicles/{id}
Get a single vehicle.

**Response:** `200 OK` — `VehicleDto`

### POST /api/vehicles
Create a new vehicle.

**Request Body:**
```json
{
  "name": "My Car",
  "make": "Toyota",
  "model": "Camry",
  "year": 2022,
  "powertrainType": 0,
  "bodyType": 0,
  "vin": "1HGCM82633A004352"
}
```

**PowertrainType:** Petrol=0, Diesel=1, Hybrid=2, Electric=3
**BodyType:** Sedan=0, SUV=1, Truck=2, Hatchback=3, Coupe=4, Wagon=5, Van=6, Convertible=7

**Response:** `201 Created`

### PUT /api/vehicles/{id}
Update an existing vehicle.

**Response:** `200 OK`

### DELETE /api/vehicles/{id}
Delete a vehicle.

**Response:** `204 No Content`

---

## Fuel Entries

All fuel entry endpoints require `Authorization: Bearer <token>`.

### GET /api/fuelentries
List fuel entries.

**Query Parameters:** `vehicleId` (guid, optional filter), `page`, `pageSize`, `sortBy` (Date/Odometer), `sortDirection`

**Response:** `200 OK` — `PagedResult<FuelEntryDto>`

### GET /api/fuelentries/{id}
Get a single fuel entry.

**Response:** `200 OK` — `FuelEntryDto`

### POST /api/fuelentries
Create a fuel entry.

**Request Body:**
```json
{
  "vehicleId": "guid",
  "date": "2024-01-15",
  "odometerReadingKm": 50000,
  "liters": 45.5,
  "cost": 85.00,
  "fuelStationName": "Shell",
  "receiptImagePath": "receipts/abc.jpg"
}
```

**Response:** `201 Created`

### PUT /api/fuelentries/{id}
Update a fuel entry.

**Response:** `200 OK`

### DELETE /api/fuelentries/{id}
Delete a fuel entry.

**Response:** `204 No Content`

---

## Charging Entries

All charging entry endpoints require `Authorization: Bearer <token>`.

### GET /api/chargingentries
List charging entries.

**Query Parameters:** `vehicleId` (guid, optional filter), `page`, `pageSize`, `sortBy` (Date/Odometer), `sortDirection`

**Response:** `200 OK` — `PagedResult<ChargingEntryDto>`

### GET /api/chargingentries/{id}
Get a single charging entry.

**Response:** `200 OK` — `ChargingEntryDto`

### POST /api/chargingentries
Create a charging entry.

**Request Body:**
```json
{
  "vehicleId": "guid",
  "date": "2024-01-15",
  "odometerReadingKm": 50000,
  "kwhUsed": 35.2,
  "cost": 12.50,
  "chargingLocation": "ChargePoint - Downtown"
}
```

**Vehicle eligibility:** Only `Hybrid` or `Electric` vehicles accept charging entries.

**Response:** `201 Created`

### PUT /api/chargingentries/{id}
Update a charging entry.

**Response:** `200 OK`

### DELETE /api/chargingentries/{id}
Delete a charging entry.

**Response:** `204 No Content`

---

## Maintenance Records

All maintenance record endpoints require `Authorization: Bearer <token>`.

### GET /api/maintenancerecords
List maintenance records.

**Query Parameters:** `vehicleId` (guid, optional filter), `page`, `pageSize`, `sortBy` (Date/Odometer), `sortDirection`

**Response:** `200 OK` — `PagedResult<MaintenanceRecordDto>`

### GET /api/maintenancerecords/due
Get maintenance records that are due for service.

**Query Parameters:** `asOfDate` (date string, optional)

**Response:** `200 OK` — list of due maintenance records

### GET /api/maintenancerecords/{id}
Get a single maintenance record.

**Response:** `200 OK` — `MaintenanceRecordDto`

### POST /api/maintenancerecords
Create a maintenance record with optional reminder.

**Request Body:**
```json
{
  "vehicleId": "guid",
  "maintenanceType": "Oil Change",
  "odometerReadingKm": 50000,
  "serviceDate": "2024-06-01",
  "cost": 85.00,
  "garageName": "AutoCare Center",
  "mechanicName": "Mike",
  "workStatus": 0,
  "notes": "Full synthetic",
  "receiptImagePath": "receipts/oil.jpg",
  "reminder": {
    "intervalType": 1,
    "intervalValue": 180,
    "nextDueDate": "2024-11-28",
    "nextDueMileageKm": null
  }
}
```

**WorkStatus:** Scheduled=0, InProgress=1, Completed=2
**ReminderIntervalType:** Mileage=0, Time=1

**Response:** `201 Created`

### PUT /api/maintenancerecords/{id}
Update a maintenance record.

**Response:** `200 OK`

### DELETE /api/maintenancerecords/{id}
Delete a maintenance record.

**Response:** `204 No Content`

---

## Dashboard

Requires `Authorization: Bearer <token>`.

### GET /api/dashboard/summary
Get monthly dashboard summary.

**Query Parameters:** `month` (date string, optional — defaults to current month)

**Response:** `200 OK` — dashboard summary with vehicle count, ICE/EV spend, maintenance due count

### GET /api/dashboard/energy-trend
Get yearly energy cost/usage trend.

**Query Parameters:** `year` (int, optional — defaults to current year), `vehicleId` (guid, optional — filter to one vehicle)

**Response:** `200 OK` — 12-month breakdown of fuel & charging cost/volume including `fuelCost`, `chargingCost`, `fuelVolumeLiters`, `energyConsumedKwh`, `maintenanceCost`, `totalCost`, `totalUsage`, `grandTotalCost`

### GET /api/dashboard/vehicles
Get per-vehicle summary with efficiency metrics.

**Query Parameters:** `month` (date string, optional — defaults to current month)

**Response:** `200 OK` — list of vehicle summaries including `monthlyFuelCost`, `monthlyChargingCost`, `monthlyMaintenanceCost`, `kmPerLiter`, `kmPerKwh`, `costPerKm`

### GET /api/dashboard/recent-activity
Get latest entries across all vehicles.

**Query Parameters:** `count` (int, optional — defaults to 10)

**Response:** `200 OK` — list of `RecentActivityDto` (fuel/charging/maintenance)

### GET /api/dashboard/available-years
Get distinct years with data.

**Response:** `200 OK` — list of years (ints), sorted descending

---

## Reports

Requires `Authorization: Bearer <token>`.

### GET /api/reports/vehicle-efficiency/{vehicleId}
Get efficiency report for a specific vehicle.

**Response:** `200 OK`
```json
{
  "vehicleId": "guid",
  "kmPerLiter": 15.2,
  "kmPerKwh": null,
  "costPerKm": 0.08
}
```
- `kmPerLiter`: Per-fill-up average (fuel-capable vehicles only, ≥2 entries required)
- `kmPerKwh`: Per-charge-pair average (EV-capable vehicles only, ≥2 entries required)
- `costPerKm`: Lifetime total cost / total distance

---

## Files

Requires `Authorization: Bearer <token>`.

### POST /api/files/receipts
Upload a receipt image.

**Max file size:** 10 MB

**Request:** `multipart/form-data` with file field

**Response:** `200 OK` — `{ "path": "receipts/guid-filename.jpg" }`

---

## Error Responses

All endpoints return consistent error responses via the global exception middleware:

| Status | Condition |
|--------|-----------|
| 400 | Invalid operation / validation failure |
| 401 | Unauthorized / missing/invalid JWT |
| 404 | Resource not found |
| 500 | Unexpected server error |
