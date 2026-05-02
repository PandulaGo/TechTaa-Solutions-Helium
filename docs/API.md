# API Reference

Base URL: `http://localhost:5297` (default)

## Authentication

### POST /api/Auth/register
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

**Password Rules:** Min 8 chars, at least one uppercase, one lowercase, one digit, one special character.

**Response:** `201 Created`

---

### POST /api/Auth/login
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

## Health

### GET /api/Health
Health check endpoint.

**Auth:** None

**Response:** `200 OK` — `{ "status": "ok" }`

---

## Vehicles

All vehicle endpoints require `Authorization: Bearer <token>`.

### GET /api/Vehicles
List vehicles for the authenticated user.

**Query Parameters:** `page` (int), `pageSize` (int), `sortBy` (Name/CreatedAt), `sortDirection` (Asc/Desc)

**Response:** `200 OK` — `PagedResult<VehicleDto>`

### GET /api/Vehicles/{id}
Get a single vehicle.

**Response:** `200 OK` — `VehicleDto`

### POST /api/Vehicles
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
**BodyType:** Car=0, Van=1, Bike=2, Truck=3, Suv=4

**Response:** `201 Created`

### PUT /api/Vehicles/{id}
Update an existing vehicle.

**Response:** `200 OK`

### DELETE /api/Vehicles/{id}
Delete a vehicle.

**Response:** `204 No Content`

---

## Fuel Entries

All fuel entry endpoints require `Authorization: Bearer <token>`.

### GET /api/FuelEntries
List fuel entries.

**Query Parameters:** `vehicleId` (guid, optional filter), `page`, `pageSize`, `sortBy` (Date/Odometer), `sortDirection`

**Response:** `200 OK` — `PagedResult<FuelEntryDto>`

### GET /api/FuelEntries/{id}
Get a single fuel entry.

**Response:** `200 OK` — `FuelEntryDto`

### POST /api/FuelEntries
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

### PUT /api/FuelEntries/{id}
Update a fuel entry.

**Response:** `200 OK`

### DELETE /api/FuelEntries/{id}
Delete a fuel entry.

**Response:** `204 No Content`

---

## Charging Entries

All charging entry endpoints require `Authorization: Bearer <token>`.

### GET /api/ChargingEntries
List charging entries.

**Query Parameters:** `vehicleId` (guid, optional filter), `page`, `pageSize`, `sortBy` (Date/Odometer), `sortDirection`

**Response:** `200 OK` — `PagedResult<ChargingEntryDto>`

### GET /api/ChargingEntries/{id}
Get a single charging entry.

**Response:** `200 OK` — `ChargingEntryDto`

### POST /api/ChargingEntries
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

**Response:** `201 Created`

### PUT /api/ChargingEntries/{id}
Update a charging entry.

**Response:** `200 OK`

### DELETE /api/ChargingEntries/{id}
Delete a charging entry.

**Response:** `204 No Content`

---

## Maintenance Records

All maintenance record endpoints require `Authorization: Bearer <token>`.

### GET /api/MaintenanceRecords
List maintenance records.

**Query Parameters:** `vehicleId` (guid, optional filter), `page`, `pageSize`, `sortBy` (Date/Odometer), `sortDirection`

**Response:** `200 OK` — `PagedResult<MaintenanceRecordDto>`

### GET /api/MaintenanceRecords/due
Get maintenance records that are due for service.

**Query Parameters:** `asOfDate` (date string)

**Response:** `200 OK` — list of due maintenance records

### GET /api/MaintenanceRecords/{id}
Get a single maintenance record.

**Response:** `200 OK` — `MaintenanceRecordDto`

### POST /api/MaintenanceRecords
Create a maintenance record with optional reminder.

**Request Body:**
```json
{
  "vehicleId": "guid",
  "maintenanceType": "Oil Change",
  "odometerReadingKm": 50000,
  "serviceDate": "2024-06-01",
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

**ReminderIntervalType:** Mileage=0, Time=1

**Response:** `201 Created`

### PUT /api/MaintenanceRecords/{id}
Update a maintenance record.

**Response:** `200 OK`

### DELETE /api/MaintenanceRecords/{id}
Delete a maintenance record.

**Response:** `204 No Content`

---

## Dashboard

Requires `Authorization: Bearer <token>`.

### GET /api/Dashboard/summary
Get monthly dashboard summary.

**Query Parameters:** `month` (date string, optional — defaults to current month)

**Response:** `200 OK` — dashboard summary with vehicle count, ICE/EV spend, maintenance due count

### GET /api/Dashboard/energy-trend
Get yearly energy cost/usage trend.

**Query Parameters:** `year` (int, optional — defaults to current year)

**Response:** `200 OK` — 12-month breakdown of fuel & charging cost/volume

---

## Reports

Requires `Authorization: Bearer <token>`.

### GET /api/Reports/vehicle-efficiency/{vehicleId}
Get efficiency report for a specific vehicle.

**Response:** `200 OK` — km/liter, km/kWh, cost/km metrics

---

## Files

Requires `Authorization: Bearer <token>`.

### POST /api/Files/receipts
Upload a receipt image.

**Max file size:** 10 MB

**Request:** `multipart/form-data` with file field

**Response:** `200 OK` — `{ "filePath": "receipts/guid-filename.jpg" }`

---

## Error Responses

All endpoints return consistent error responses via the global exception middleware:

| Status | Condition |
|--------|-----------|
| 400 | Invalid operation / validation failure |
| 401 | Unauthorized / missing/invalid JWT |
| 404 | Resource not found |
| 500 | Unexpected server error |
