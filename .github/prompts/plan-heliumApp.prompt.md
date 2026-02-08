# Helium App Plan

## Current Focus
- Get React web frontend running reliably on Node 24.
- Connect frontend auth and vehicles UI to existing .NET backend APIs.

## Short-Term Steps
1. **Stabilize frontend dev server**
   - Keep `NODE_OPTIONS=--openssl-legacy-provider` wired into `npm start`.
   - Confirm `npm start` runs without errors and app loads in the browser.

2. **Basic UI flow (web)**
   - Create a simple login page (email + password) that calls `/api/auth/login`.
   - Store JWT token in memory (and optionally localStorage) on success.
   - Implement a "My Vehicles" page that calls `/api/vehicles` with the token and lists vehicles.

3. **Backend readiness**
   - Run `dotnet ef migrations add InitialCreate` and `dotnet ef database update` in the Backend to create the database schema.
   - Configure a strong JWT secret in `appsettings.json` (and user secrets for non-dev).

4. **Integrate web with backend**
   - Add a small API client module in the web app (e.g., `src/api/client.ts`) to centralize base URL, auth header, and error handling.
   - Wire login and vehicles pages to this client.

5. **Review & polish**
   - Confirm happy-path flows: register → login → add vehicle → view vehicles.
   - Add basic Tailwind styling for a clean, responsive layout.

## Next Possible Work
- Mirror the same flows in the Flutter mobile app.
- Add reports and maintenance screens consuming the existing backend endpoints.
