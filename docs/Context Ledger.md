# Context Ledger

> **Helium App** — living context document capturing architecture decisions, the feature roadmap, and the engineering session history. Use this as the primary source of truth to resume work across machines or sessions.

## Part 1 — Architecture Decision Records (ADRs)

### ADR-001: Clean Architecture
**Status:** Accepted
**Context:** The backend could be built as a simple monolithic API, but we anticipated growth in clients (web, mobile) and wanted clear separation of concerns.
**Decision:** Use Clean Architecture with 4 layers: Domain → Application → Infrastructure → Api.
**Consequences:**
- Domain has zero dependencies — pure business logic
- Application orchestrates use cases without knowing about databases or external services
- Infrastructure implements interfaces from Application (DI inversion)
- Api handles HTTP concerns only
- Slightly more boilerplate, but significantly easier to test and evolve

### ADR-002: React 17 + TypeScript over Next.js / Vite
**Status:** Accepted
**Context:** Needed a frontend framework; considered Next.js (SSR), Vite (modern bundler), and Create React App (CRA).
**Decision:** Use React 17 + TypeScript with Create React App.
**Consequences:**
- CRA provided a zero-config setup that was quick to start
- React Router v5 (current at the time) for client-side routing
- No SSR needed since the app is data-driven behind auth
- TypeScript catches type errors at compile time
- Note: CRA is now deprecated; migrating to Vite would be beneficial in the future

### ADR-003: Tailwind CSS over Bootstrap
**Status:** Accepted
**Context:** The web app initially used Bootstrap, but needed more design flexibility without fighting framework defaults.
**Decision:** Remove Bootstrap, replace with Tailwind CSS exclusively.
**Consequences:**
- Utility-first approach gives pixel-level control over every component
- Much smaller bundle size (no unused Bootstrap CSS)
- Faster iteration on custom designs
- Dark mode support built into Tailwind

### ADR-004: SHA256 + Salt over BCrypt / Argon2
**Status:** Accepted
**Context:** Needed a password hashing strategy.
**Decision:** Use SHA256 with a 16-byte random salt (custom implementation).
**Consequences:**
- Simpler to implement without external dependencies
- However, SHA256 is a fast hash and not ideal for password storage
- **Should be revisited:** BCrypt or Argon2id would be more resistant to brute-force attacks
- This is a known technical debt item

### ADR-005: SQL Server LocalDB for Development
**Status:** Accepted
**Context:** Needed a local database that works out of the box on Windows.
**Decision:** Use SQL Server Express LocalDB for development.
**Consequences:**
- Zero-install database on Windows (ships with Visual Studio)
- Full SQL Server compatibility for production migration
- Not available on Linux/macOS — limits team portability
- PostgreSQL support noted as a future option

### ADR-006: No State Management Library (No Redux/Zustand)
**Status:** Accepted
**Context:** Needed to manage frontend state.
**Decision:** Use local component state only — no Redux, Zustand, React Query, or Context for global state.
**Consequences:**
- Simpler mental model; easy to onboard new developers
- Duplicate API call logic across pages (each page fetches its own `appsettings.json`)
- No caching layer — every page re-fetches data on mount
- As the app grows, React Query or Zustand should be introduced

### ADR-007: JWT with Bearer Token Authentication
**Status:** Accepted
**Context:** Needed a stateless auth mechanism for both web and future mobile clients.
**Decision:** Use JWT (HMAC-SHA256) with Bearer token passed in `Authorization` header.
**Consequences:**
- Stateless — no server-side session storage needed
- Works seamlessly across web and mobile
- Token expiry after 120 minutes (configurable)
- **No refresh tokens:** once expired, user must re-login
- Future improvement: add refresh token flow for better UX

### ADR-008: AutoMapper for Entity-to-DTO Mapping
**Status:** Accepted
**Context:** Domain entities differ significantly from API DTOs; manual mapping is tedious and error-prone.
**Decision:** Use AutoMapper with a centralized `ApplicationMappingProfile`.
**Consequences:**
- Reduces boilerplate mapping code
- Single profile file makes it easy to audit mappings
- Can cause difficult-to-debug issues if not configured carefully
- Tests should validate mapping configurations

### ADR-009: FluentValidation over Data Annotations
**Status:** Accepted
**Context:** Needed validation that is testable, composable, and kept separate from domain models.
**Decision:** Use FluentValidation with separate validator classes.
**Consequences:**
- Keeps entities clean (no validation attributes mixing with business data)
- Validators are easily unit-testable
- Composable rules (e.g., reuse password rules across register and change-password)
- Slightly more files, but cleaner separation

### ADR-010: Local File Storage over Cloud Storage
**Status:** Accepted
**Context:** Receipt images need to be stored somewhere; cloud storage adds cost and complexity.
**Decision:** Store receipt images on local disk via `LocalFileStorageService`.
**Consequences:**
- Simple, no external dependencies
- Not suitable for production (single server, no backup, no CDN)
- Future: replace with Azure Blob Storage or AWS S3 via the same interface

### ADR-011: Serilog for Logging
**Status:** Accepted
**Context:** Needed structured logging that works in development and production.
**Decision:** Use Serilog with console sink.
**Consequences:**
- Structured JSON logging (easier to query than plain text)
- Extensible with sinks (File, Elasticsearch, Seq, etc.)
- Currently only console sink configured; can add sinks without code changes

### ADR-012: Per-Fill-Up Efficiency Calculation
**Status:** Accepted
**Context:** The original efficiency formula used a lifetime average (`total distance / total liters`) which was inaccurate for hybrids and didn't reflect individual fill-up performance.
**Decision:** Calculate km/L as the average of each consecutive fill-up pair: `tripDist / tripLiters` for each `entries[i]` paired with `entries[i-1]`. Only includes pairs where both entries have valid odometer readings and liters > 0. Requires ≥2 entries.
**Consequences:**
- More accurate per-trip efficiency measurement
- Partial fill-ups still skew results (future: add `IsFullTank` flag)
- Same logic applies to km/kWh for EV charging entries
- Hybrids get separate fuel and electric efficiency using only their respective entry types

### ADR-013: Collapsible Sidebar
**Status:** Accepted
**Context:** The sidebar navigation consumed significant horizontal space on smaller screens.
**Decision:** Add a toggle button (double-chevron icon) in the sidebar header. When collapsed, sidebar shrinks from `w-64` to `w-14`, showing only the expand button. Smooth transition via `transition-all duration-200`.
**Consequences:**
- More screen real estate for dashboard content when collapsed
- Simple to implement (local `sidebarExpanded` state only)
- No icon-only nav items in collapsed mode (keeps implementation simple)

### ADR-014: km/L over L/100km
**Status:** Accepted
**Context:** Initially implemented as L/100km (European standard), but the user prefers km/L which is more intuitive for their use case.
**Decision:** Use km/L as the primary fuel efficiency metric. Displayed as `⛽ 16.9 km/L` on efficiency cards.
**Consequences:**
- Higher = better (intuitive for most users)
- Common in Asian and US markets
- L/100km can be added as an alternative display option in the future

### ADR-015: PIN-Based Passwordless Login (Email + Gmail SMTP)
**Status:** Accepted (design approved; implementation pending)
**Context:** Password login brings ongoing burdens — password hashing debt (see ADR-004), forgot-password flows, and signup friction. The email inbox itself is a sufficient proof of identity for a personal fleet-tracking app.
**Decision:** Replace password authentication with an email PIN flow:
1. User submits email → backend generates a 6-digit PIN, stores it in `IMemoryCache` (`pin:{email}` key, 5-minute expiry) and emails it via Gmail SMTP (MailKit, port 587, Google App Password).
2. User submits the PIN → on match the account is auto-created if it doesn't exist (email = identity) and a JWT is returned.
3. First-time users are redirected to an `/onboarding` page to complete their profile (first/last name required; address, mobile number optional) via `PATCH /api/users/me`. Returning users go straight to the dashboard.

A dev-mode flag (`IsDevelopmentMode`) logs the PIN to the console instead of sending email. Registration page and password DTOs/validators are removed.
**Consequences:**
- No passwords to hash, store, reset, or leak — retires ADR-004's SHA256 hashing concern
- `SignupPage` deleted; account creation happens implicitly at first PIN verification
- Security now depends on email inbox security (Gmail 2FA) — acceptable for this app's threat model
- Gmail SMTP limits: 500 emails/day; requires App Password setup
- `IMemoryCache` PINs don't survive backend restarts — acceptable (user just requests a new PIN)
- Rate limiting / resend cooldown needed to prevent PIN spam (60s frontend cooldown planned)

## Part 2 — Roadmap & Feature Ideas

### Priority Legend

| Tier | Label | Meaning |
|------|-------|---------|
| 🥇 | **P0 — Critical UX Gap** | Missing essential functionality; noticeable to every user |
| 🥈 | **P1 — High Value** | Significant improvement to usability or capability |
| 🥉 | **P2 — Nice to Have** | Polish, quality-of-life, or differentiation features |

### P0 — Critical UX Gaps

#### 1. User Profile & Settings
- **Backend:** `GET /api/users/me` ✅, `PUT /api/users/me`, `PUT /api/users/me/password`
- **Frontend:** Profile page with name, currency, avatar upload, password change form
- **Why:** User name now displays in sidebar via `/api/users/me`. Still no profile edit page.
- **Effort:** Medium (2 endpoints + 1 page)
- **Status:** Partially done (GET /me implemented, name + currency shown in dashboard)

#### 2. Route Guard / Auth Context
- React Context providing auth state (token, user info)
- `PrivateRoute` wrapper that redirects unauthenticated users to `/login`
- Proper logout that clears `localStorage` + redirects
- **Why:** Currently any page can be visited without a valid token; API calls just silently fail.
- **Effort:** Small (1 context + 1 wrapper component)

#### 3. Receipt Upload & Viewer
- Replace text URL input with a file picker
- Backend: `GET /api/files/{filename}` to download/view uploaded receipts
- Frontend: image preview in lists + receipt gallery/modal
- **Why:** Receipt tracking is a core feature but currently requires users to manually type a URL.
- **Effort:** Medium (1 endpoint + 1 component + form update)

#### 4. PIN-Based Passwordless Login (supersedes Forgot Password)
- Replace email+password login with: user enters email → 6-digit PIN emailed via Gmail SMTP → user enters PIN → JWT issued
- Auto-create account on first PIN verification (no registration page); new users complete profile on an `/onboarding` page (first/last name required; address, mobile number optional)
- Backend: `POST /api/auth/send-pin`, `POST /api/auth/verify-pin`, `PATCH /api/users/me`; PIN stored in `IMemoryCache` with 5-min expiry
- Frontend: two-stage `LoginPage`, new `OnboardingPage`; delete `SignupPage`
- **Why:** Removes password management entirely; email inbox is the proof of identity.
- **Effort:** Medium (2 auth endpoints + profile endpoint + 1 new page + login rewrite + MailKit/Gmail SMTP setup)
- **Status:** Design approved — see ADR-015. Not yet implemented.

#### 5. Pagination in List Pages ✅
- Backend already supports `PaginationQuery`/`PagedResult<T>`
- Frontend: add pagination controls (prev/next, page numbers, page size selector)
- **Why:** All list pages hardcode `pageSize: 200` — breaks with real-world data.
- **Effort:** Small (1 shared pagination component)
- **Status:** Backend complete, frontend pending

### P1 — High Value Features

#### 6. Reports Page
- New backend endpoints: cost-over-time, per-vehicle breakdown, total cost of ownership
- CSV/PDF export capability
- Frontend: dedicated reports page with date range filters and chart visualizations
- **Why:** Sidebar already links to "Reports" — currently a dead link. This differentiates Helium from a simple CRUD app.
- **Effort:** Large (multiple endpoints + 1 page + export logic)

#### 7. Real Email Notifications
- Replace no-op `INotificationService` with SMTP email
- Send maintenance reminders, welcome emails, password reset links
- **Why:** Full maintenance reminder infrastructure exists but nothing reaches the user.
- **Effort:** Medium (email provider integration + email templates)
- **Note:** Gmail SMTP infrastructure from ADR-015 can be reused here.

#### 8. Shared Fleet / Multi-User
- Allow multiple users to manage the same vehicles
- Role-based access: Owner, Editor, Viewer
- Invitation system via email
- **Why:** Families and small businesses need shared access to vehicle records.
- **Effort:** Large (new entity relationships + permission system + UI)

#### 9. Advanced Analytics & Insights ✅ (in progress)
- Fuel price trends (cost/liter over time, per station) ✅ — Price per Liter chart on dashboard
- Carbon footprint estimation (kg CO2 per fuel/charge type)
- Cost-per-km trends across all vehicles ✅ — efficiency cards on dashboard
- Best/worst performing vehicles by efficiency
- Fuel efficiency per vehicle (km/L & km/kWh) ✅ — efficiency cards
- **Why:** Transforms Helium from a record-keeper into a proactive optimization tool.
- **Effort:** Medium (new report endpoints + chart components)
- **Status:** Efficiency cards + price per liter trend implemented. Remaining: carbon footprint, best/worst vehicles.

#### 10. Mobile App (Flutter)
- Build out Flutter app with login, dashboard, vehicle list, entry creation
- Offline-first capability for logging at the pump/charger
- Camera integration for receipt capture
- **Why:** The primary use case happens away from a desk. Scaffold exists but is empty.
- **Effort:** Large (full mobile app build)

### P2 — Nice to Have

| # | Feature | Detail | Effort |
|---|---------|--------|--------|
| 11 | Dark Mode | Tailwind `dark:` variant toggle; persist in localStorage | Small |
| 12 | i18n / Multi-Currency | Locale switching, number/date formatting (`PreferredCurrency` exists) | Medium |
| 13 | Vehicle Health Score | Maintenance frequency + odometer vs expected + age + overdue reminders | Small–Medium |
| 14 | CSV/PDF Export Everywhere | Export any list or report | Medium |
| 15 | Service History Book | PDF logbook per vehicle for resale | Medium |
| 16 | Fuel Price Map | Map of stations with logged prices | Large |
| 17 | PWA / Offline Support | Service worker, offline entry sync, installable | Large |
| 18 | Search & Advanced Filtering | Free-text search; date/cost/powertrain filters | Medium |
| 19 | Form Drafts | Auto-save form state to localStorage | Small |
| 20 | Loading Skeletons & Shared Components | Skeleton loaders; extract duplicated form elements; integrate or remove unused `PrimaryButton` | Small–Medium |

### Implementation Order (Recommended Path)

```
Phase 1 (Quick Wins)
├── User name/currency in dashboard ✅
├── Efficiency cards (km/L, km/kWh) ✅
├── Price per Liter trend chart ✅
├── Collapsible sidebar ✅
├── Maintenance search bar + expandable rows ✅
├── Fleet Snapshot with cost breakdown (Fuel/Charging/Maintenance) ✅
├── Auth Context + Route Guard
├── Pagination Component
├── Dark Mode
└── Loading Skeletons

Phase 2 (Core UX)
├── PIN-Based Passwordless Login (ADR-015, design approved)
├── User Profile & Settings
├── Receipt Upload & Viewer
└── Search & Filters

Phase 3 (Differentiation)
├── Reports Page + CSV/PDF Export
├── Email Notifications
├── Analytics & Insights
└── Vehicle Health Score

Phase 4 (Scale)
├── Mobile App (Flutter)
├── Shared Fleet / Multi-User
├── Fuel Price Map
└── PWA / Offline Support
```

## Part 3 — Session History Ledger

> Append new sessions at the **top** of this list. Do not delete past entries.

### [2026-08-23] — Docs Consolidation, Favicon & Launcher Finalization

#### Active Focus & Target Objective
* **Primary Objective:** Consolidate all project documentation into two instruction-defined documents (`Architecture and Other Details.md`, `Context Ledger.md`); add browser tab favicon; finalize AutoHotkey launcher naming.
* **Context Bridge:** Seven separate docs existed (README, ARCHITECTURE, API, BUSINESS_LOGIC, DECISIONS, ROADMAP, SETUP). No favicon existed. Launcher script had temporary wrong names (`start-lithium.ahk`).

#### Comprehensive Changes & File Ledger
* **Files Modified / Created:**
  * `docs/Architecture and Other Details.md` (Created) — consolidates architecture, business logic, API reference, setup guide, project structure
  * `docs/Context Ledger.md` (Created) — consolidates ADRs, roadmap, session history
  * `Frontend/helium-frontend/web/public/favicon.svg` (Created) — vehicle-themed SVG logo (blue badge, white car silhouette, speedometer arc)
  * `Frontend/helium-frontend/web/public/index.html` (Modified) — added `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`
  * `start-helium.ahk` (Renamed: `HeliumApp.ahk` → `start-lithium.ahk` → `start-helium.ahk`)
  * Legacy docs deleted: `README.md`, `ARCHITECTURE.md`, `API.md`, `BUSINESS_LOGIC.md`, `DECISIONS.md`, `ROADMAP.md`, `SETUP.md`
* **Structural & Logical Implementations:**
  * Verified favicon served at `http://localhost:10015/favicon.svg` (HTTP 200, `image/svg+xml`)
  * Documented ADR-015 (PIN login design approved this session — see Part 1)

#### State Handover & Next Engineering Actions
* **Current Working State:** Fully functional; docs restructured; favicon live (hard refresh needed to bypass browser cache)
* **Exact Next Actions:**
  1. Implement PIN-based passwordless login per ADR-015 (backend first: MailKit + EmailService + PIN endpoints; then frontend LoginPage rewrite + OnboardingPage)
  2. Set up Gmail App Password for SMTP sending
  3. Update "Architecture and Other Details.md" Part 3 auth section when PIN login ships

### [2026-08-23] — PIN Login Design Approval & Documentation Updates

#### Active Focus & Target Objective
* **Primary Objective:** Design and get approval for passwordless PIN-based login; update all legacy docs to reflect approved plan.
* **Context Bridge:** Password auth existed with SHA256 hashing debt (ADR-004) and a dead `/forgot-password` link on the login page.

#### Comprehensive Changes & File Ledger
* **Files Modified / Created:**
  * `docs/DECISIONS.md` (Modified) — added ADR-015
  * `docs/ROADMAP.md` (Modified) — replaced Forgot Password item with PIN-Based Passwordless Login
  * `docs/BUSINESS_LOGIC.md` (Modified) — added section 10.5 planned PIN flow
  * `docs/ARCHITECTURE.md` (Modified) — added branding bullet
  * `docs/SETUP.md` (Modified) — fixed HTTPS port 7165→10012; added AutoHotkey launcher section
  * `docs/README.md` (Modified) — added start-helium.ahk to structure tree
* **Key Decisions:** Auto-create accounts on first PIN verification (no signup page); Gmail SMTP (App Password); IMemoryCache PIN store (5-min expiry); dev-mode console PIN logging

#### State Handover & Next Engineering Actions
* **Current Working State:** Design approved, zero implementation started
* **Notes / Edge Cases Discovered:** No email infrastructure exists yet — MailKit must be added to Infrastructure layer

### [2026-08-22] — Dashboard Refinements & UX Polish

#### Active Focus & Target Objective
* **Primary Objective:** Compact dashboard charts, add distance tracking to tooltips, reorganize bottom-row layout, remove horizontal scrollbars from list pages.
* **Context Bridge:** Cost Overview chart was oversized (300px height, large fonts); efficiency cards took a full row; list pages had horizontal scrollbars.

#### Comprehensive Changes & File Ledger
* **Files Modified / Created:**
  * `Backend/Helium.Application/Models/Dashboard/EnergyTrendPointDto.cs` (Modified) — added `DistanceKm`
  * `Backend/Helium.Application/Services/DashboardService.cs` (Modified) — added `OdometerRange` class + `CalculateMonthlyDistance`
  * `Frontend/.../pages/DashboardPage.tsx` (Modified) — chart compaction (130px height, 6px axis fonts, 1.5px lines), compact tooltip (110x34, shows distance), Average Fuel Efficiency card with vehicle dropdown, 12-col grid: Fleet Snapshot(7)/Avg Efficiency(2)/Maintenance Outlook(1)/Price per Liter(2)
  * `Frontend/.../pages/VehiclesPage.tsx`, `FuelEntriesPage.tsx`, `ChargingEntriesPage.tsx`, `MaintenanceEntriesPage.tsx` (Modified) — removed horizontal scroll (`overflow-hidden`, reduced padding, `truncate` on long columns)

#### State Handover & Next Engineering Actions
* **Current Working State:** Fully functional
* **Notes / Edge Cases Discovered:** SVG chart text scales with viewBox — font sizes are in SVG coordinates, not Tailwind classes

### [2026-08-21] — Port Standardization & Startup Automation

#### Active Focus & Target Objective
* **Primary Objective:** Standardize ports (backend HTTP 10011 / HTTPS 10012, frontend HTTP 10015 / HTTPS 10016); create AutoHotkey startup launcher.
* **Context Bridge:** Apps ran on default ports; no one-click startup existed.

#### Comprehensive Changes & File Ledger
* **Files Modified / Created:**
  * `Backend/Helium.Api/Properties/launchSettings.json` (Modified) — ports 10011/10012
  * `Backend/Helium.Api/Program.cs` (Modified) — CORS for :10015, root endpoint, startup logs
  * `Frontend/.../web/package.json` (Modified) — PORT=10015
  * `Frontend/.../web/public/appsettings.json`, `src/appsettings.json` (Modified) — apiBaseUrl :10011
  * `C:\Users\Pandula\...\Startup\HeliumAppStartup.ahk` (Created) — auto-start both apps minimized at Windows login

#### State Handover & Next Engineering Actions
* **Current Working State:** Fully functional on standardized ports
* **Notes:** Default admin user registered manually: `admin@helium.app` / `Admin@123` (no seed user exists on fresh DB)

*This is a living document. Append new sessions at the top of Part 3 as work continues.*
