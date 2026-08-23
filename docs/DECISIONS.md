# Architecture Decision Records (ADRs)

This document captures the rationale behind key technical decisions made during the development of the Helium App.

---

## ADR-001: Clean Architecture

**Status:** Accepted  
**Context:** The backend could be built as a simple monolithic API, but we anticipated growth in clients (web, mobile) and wanted clear separation of concerns.  
**Decision:** Use Clean Architecture with 4 layers: Domain → Application → Infrastructure → Api.  
**Consequences:**
- Domain has zero dependencies — pure business logic
- Application orchestrates use cases without knowing about databases or external services
- Infrastructure implements interfaces from Application (DI inversion)
- Api handles HTTP concerns only
- Slightly more boilerplate, but significantly easier to test and evolve

---

## ADR-002: React 17 + TypeScript over Next.js / Vite

**Status:** Accepted  
**Context:** Needed a frontend framework; considered Next.js (SSR), Vite (modern bundler), and Create React App (CRA).  
**Decision:** Use React 17 + TypeScript with Create React App.  
**Consequences:**
- CRA provided a zero-config setup that was quick to start
- React Router v5 (current at the time) for client-side routing
- No SSR needed since the app is data-driven behind auth
- TypeScript catches type errors at compile time
- Note: CRA is now deprecated; migrating to Vite would be beneficial in the future

---

## ADR-003: Tailwind CSS over Bootstrap

**Status:** Accepted  
**Context:** The web app initially used Bootstrap, but needed more design flexibility without fighting framework defaults.  
**Decision:** Remove Bootstrap, replace with Tailwind CSS exclusively.  
**Consequences:**
- Utility-first approach gives pixel-level control over every component
- Much smaller bundle size (no unused Bootstrap CSS)
- Faster iteration on custom designs
- Dark mode support built into Tailwind

---

## ADR-004: SHA256 + Salt over BCrypt / Argon2

**Status:** Accepted  
**Context:** Needed a password hashing strategy.  
**Decision:** Use SHA256 with a 16-byte random salt (custom implementation).  
**Consequences:**
- Simpler to implement without external dependencies
- However, SHA256 is a fast hash and not ideal for password storage
- **Should be revisited:** BCrypt or Argon2id would be more resistant to brute-force attacks
- This is a known technical debt item

---

## ADR-005: SQL Server LocalDB for Development

**Status:** Accepted  
**Context:** Needed a local database that works out of the box on Windows.  
**Decision:** Use SQL Server Express LocalDB for development.  
**Consequences:**
- Zero-install database on Windows (ships with Visual Studio)
- Full SQL Server compatibility for production migration
- Not available on Linux/macOS — limits team portability
- README notes PostgreSQL support as a future option

---

## ADR-006: No State Management Library (No Redux/Zustand)

**Status:** Accepted  
**Context:** Needed to manage frontend state.  
**Decision:** Use local component state only — no Redux, Zustand, React Query, or Context for global state.  
**Consequences:**
- Simpler mental model; easy to onboard new developers
- Duplicate API call logic across pages (each page fetches its own `appsettings.json`)
- No caching layer — every page re-fetches data on mount
- As the app grows, React Query or Zustand should be introduced

---

## ADR-007: JWT with Bearer Token Authentication

**Status:** Accepted  
**Context:** Needed a stateless auth mechanism for both web and future mobile clients.  
**Decision:** Use JWT (HMAC-SHA256) with Bearer token passed in `Authorization` header.  
**Consequences:**
- Stateless — no server-side session storage needed
- Works seamlessly across web and mobile
- Token expiry after 120 minutes (configurable)
- **No refresh tokens:** once expired, user must re-login
- Future improvement: add refresh token flow for better UX

---

## ADR-008: AutoMapper for Entity-to-DTO Mapping

**Status:** Accepted  
**Context:** Domain entities differ significantly from API DTOs; manual mapping is tedious and error-prone.  
**Decision:** Use AutoMapper with a centralized `ApplicationMappingProfile`.  
**Consequences:**
- Reduces boilerplate mapping code
- Single profile file makes it easy to audit mappings
- Can cause difficult-to-debug issues if not configured carefully
- Tests should validate mapping configurations

---

## ADR-009: FluentValidation over Data Annotations

**Status:** Accepted  
**Context:** Needed validation that is testable, composable, and kept separate from domain models.  
**Decision:** Use FluentValidation with separate validator classes.  
**Consequences:**
- Keeps entities clean (no validation attributes mixing with business data)
- Validators are easily unit-testable
- Composable rules (e.g., reuse password rules across register and change-password)
- Slightly more files, but cleaner separation

---

## ADR-010: Local File Storage over Cloud Storage

**Status:** Accepted  
**Context:** Receipt images need to be stored somewhere; cloud storage adds cost and complexity.  
**Decision:** Store receipt images on local disk via `LocalFileStorageService`.  
**Consequences:**
- Simple, no external dependencies
- Not suitable for production (single server, no backup, no CDN)
- Future: replace with Azure Blob Storage or AWS S3 via the same interface

---

## ADR-011: Serilog for Logging

**Status:** Accepted  
**Context:** Needed structured logging that works in development and production.  
**Decision:** Use Serilog with console sink.  
**Consequences:**
- Structured JSON logging (easier to query than plain text)
- Extensible with sinks (File, Elasticsearch, Seq, etc.)
- Currently only console sink configured; can add sinks without code changes

---

## ADR-012: Per-Fill-Up Efficiency Calculation

**Status:** Accepted  
**Context:** The original efficiency formula used a lifetime average (`total distance / total liters`) which was inaccurate for hybrids and didn't reflect individual fill-up performance.  
**Decision:** Calculate km/L as the average of each consecutive fill-up pair: `tripDist / tripLiters` for each `entries[i]` paired with `entries[i-1]`. Only includes pairs where both the previous and current entries have valid odometer readings and liters > 0. Requires ≥2 entries.  
**Consequences:**
- More accurate per-trip efficiency measurement
- Partial fill-ups still skew results (future: add `IsFullTank` flag)
- Same logic applies to km/kWh for EV charging entries
- Hybrids get separate fuel and electric efficiency using only their respective entry types

---

## ADR-013: Collapsible Sidebar

**Status:** Accepted  
**Context:** The sidebar navigation consumed significant horizontal space on smaller screens.  
**Decision:** Add a toggle button (double-chevron icon) in the sidebar header. When collapsed, sidebar shrinks from `w-64` to `w-14`, showing only the expand button. Smooth transition via `transition-all duration-200`.  
**Consequences:**
- More screen real estate for dashboard content when collapsed
- Simple to implement (local `sidebarExpanded` state only)
- No icon-only nav items in collapsed mode (keeps implementation simple)

---

## ADR-014: km/L over L/100km

**Status:** Accepted  
**Context:** Initially implemented as L/100km (European standard), but the user prefers km/L which is more intuitive for their use case.  
**Decision:** Use km/L as the primary fuel efficiency metric. Displayed as `⛽ 16.9 km/L` on efficiency cards.  
**Consequences:**
- Higher = better (intuitive for most users)
- Common in Asian and US markets
- L/100km can be added as an alternative display option in the future

---

## ADR-015: PIN-Based Passwordless Login (Email + Gmail SMTP)

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

---

*This is a living document. Add new ADRs as decisions are made.*
