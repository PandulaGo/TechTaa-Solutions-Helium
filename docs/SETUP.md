# Development Setup Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [.NET SDK](https://dotnet.microsoft.com/download) | 8.0+ | Backend API |
| [Node.js](https://nodejs.org/) | 14+ | Frontend web app |
| [npm](https://www.npmjs.com/) | 8+ | Package management |
| [SQL Server LocalDB](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb) | 2019+ | Local database (ships with Visual Studio) |
| [Flutter](https://flutter.dev/docs/get-started/install) | Latest | Mobile app (optional) |

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd "Helium App"
```

---

## 2. Configure the Backend

### 2.1 Database Connection

Navigate to `Backend/Helium.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "HeliumCoreConnection": "Server=(localdb)\\mssqllocaldb;Database=HeliumAppDb;Trusted_Connection=True;MultipleActiveResultSets=true"
  }
}
```

The default uses SQL Server LocalDB. Change if using a different SQL Server instance.

### 2.2 JWT Secret

In the same file, update the JWT secret:

```json
{
  "Jwt": {
    "Issuer": "HeliumApp",
    "Audience": "HeliumAppUsers",
    "Secret": "YOUR_32_CHAR_OR_LONGER_SECRET_KEY",
    "ExpiresMinutes": 120
  }
}
```

**Important:** The secret should be at least 32 characters long. Never commit a real secret to version control.

### 2.3 Run Database Migrations

The backend applies migrations automatically on startup via the `MaintenanceReminderBackgroundService`. Alternatively, run manually:

```bash
cd Backend
dotnet ef database update --project Helium.Infrastructure --startup-project Helium.Api
```

### 2.4 Run the Backend

```bash
cd Backend
dotnet run --project Helium.Api/Helium.Api.csproj
```

The API starts on:
- `http://localhost:5297`
- `https://localhost:7165`

To verify: visit `http://localhost:5297/api/Health` — should return `{"status":"ok"}`.

---

## 3. Configure the Web Frontend

### 3.1 Install Dependencies

```bash
cd "Frontend/helium-frontend/web"
npm install
```

### 3.2 Configure Backend URL

Edit `public/appsettings.json`:

```json
{
  "apiBaseUrl": "http://localhost:5297"
}
```

Match the URL where the backend is running.

### 3.3 Run the Web App

```bash
npm start
```

Opens at `http://localhost:3000`.

---

## 4. Mobile App (Flutter)

The Flutter project is scaffolded but has no application code yet.

### 4.1 Install Dependencies

```bash
cd "Frontend/helium-frontend/mobile"
flutter pub get
```

### 4.2 Run

```bash
flutter run
```

Requires an emulator or physical device.

---

## 5. Verify Everything Works

1. Backend is running → `http://localhost:5297/api/Health` returns ok
2. Frontend is running → `http://localhost:3000` loads
3. Create an account via the Signup page
4. Log in → redirected to Dashboard
5. Add a vehicle → appears in Vehicles list
6. Add fuel/charging/maintenance entries → appear in their respective lists
7. Dashboard shows summary stats

---

## Common Issues

### "Could not find database" / Login failed
- Ensure SQL Server LocalDB is installed: run `SqlLocalDB info` in Command Prompt
- If not installed, install via Visual Studio Installer (add "SQL Server Express LocalDB" workload)

### CORS error in browser
- Ensure the backend URL in `public/appsettings.json` matches exactly (including port)
- Backend CORS is configured to allow `http://localhost:3000` only

### JWT token expired
- Tokens expire after 120 minutes (configurable in `appsettings.json`)
- Log out and log in again to get a new token
- No refresh token mechanism currently implemented

### `dotnet build` fails
- Ensure .NET 8 SDK is installed: `dotnet --version`
- Restore NuGet packages: `dotnet restore`

### `npm start` fails
- Ensure Node.js 14+: `node --version`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- If OpenSSL errors, the start script includes `NODE_OPTIONS=--openssl-legacy-provider`

---

## Useful Commands

```bash
# Backend
dotnet build                           # Build the backend
dotnet run --project Helium.Api        # Run the API
dotnet test                            # Run tests
dotnet ef migrations add MigrationName # Create a new migration

# Frontend
npm start                              # Start dev server
npm run build                          # Production build
npm test                               # Run frontend tests
```
