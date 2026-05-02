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

*This is a living document. Add new ADRs as decisions are made.*
