# Roadmap & Feature Ideas

This document captures planned features, value-add ideas, and improvements for the Helium App. Organized by priority and estimated effort.

---

## Priority Legend

| Tier | Label | Meaning |
|------|-------|---------|
| 🥇 | **P0 — Critical UX Gap** | Missing essential functionality; noticeable to every user |
| 🥈 | **P1 — High Value** | Significant improvement to usability or capability |
| 🥉 | **P2 — Nice to Have** | Polish, quality-of-life, or differentiation features |

---

## P0 — Critical UX Gaps

### 1. User Profile & Settings
- **Backend:** `GET /api/users/me` ✅, `PUT /api/users/me`, `PUT /api/users/me/password`
- **Frontend:** Profile page with name, currency, avatar upload, password change form
- **Why:** User name now displays in sidebar via `/api/users/me`. Still no profile edit page.
- **Effort:** Medium (2 endpoints + 1 page)
- **Status:** Partially done (GET /me implemented, name + currency shown in dashboard)

### 2. Route Guard / Auth Context
- React Context providing auth state (token, user info)
- `PrivateRoute` wrapper that redirects unauthenticated users to `/login`
- Proper logout that clears `localStorage` + redirects
- **Why:** Currently any page can be visited without a valid token; API calls just silently fail.
- **Effort:** Small (1 context + 1 wrapper component)

### 3. Receipt Upload & Viewer
- Replace text URL input with a file picker
- Backend: `GET /api/files/{filename}` to download/view uploaded receipts
- Frontend: image preview in lists + receipt gallery/modal
- **Why:** Receipt tracking is a core feature but currently requires users to manually type a URL.
- **Effort:** Medium (1 endpoint + 1 component + form update)

### 4. PIN-Based Passwordless Login (supersedes Forgot Password)
- Replace email+password login with: user enters email → 6-digit PIN emailed via Gmail SMTP → user enters PIN → JWT issued
- Auto-create account on first PIN verification (no registration page); new users complete profile on an `/onboarding` page (first/last name required; address, mobile number optional)
- Backend: `POST /api/auth/send-pin`, `POST /api/auth/verify-pin`, `PATCH /api/users/me`; PIN stored in `IMemoryCache` with 5-min expiry
- Frontend: two-stage `LoginPage`, new `OnboardingPage`; delete `SignupPage`
- **Why:** Removes password management entirely (no forgot-password flow needed); email inbox is the proof of identity.
- **Effort:** Medium (2 auth endpoints + profile endpoint + 1 new page + login rewrite + MailKit/Gmail SMTP setup)
- **Status:** Design approved — see ADR-015. Not yet implemented.

### 5. Pagination in List Pages ✅
- Backend already supports `PaginationQuery`/`PagedResult<T>`
- Frontend: add pagination controls (prev/next, page numbers, page size selector)
- **Why:** All list pages hardcode `pageSize: 200` — breaks with real-world data.
- **Effort:** Small (1 shared pagination component)
- **Status:** Backend complete, frontend pending

---

## P1 — High Value Features

### 6. Reports Page
- New backend endpoints: cost-over-time, per-vehicle breakdown, total cost of ownership
- CSV/PDF export capability
- Frontend: dedicated reports page with date range filters and chart visualizations
- **Why:** Sidebar already links to "Reports" — currently a dead link. This differentiates Helium from a simple CRUD app.
- **Effort:** Large (multiple endpoints + 1 page + export logic)

### 7. Real Email Notifications
- Replace no-op `INotificationService` with SMTP email
- Send maintenance reminders, welcome emails, password reset links
- **Why:** Full maintenance reminder infrastructure exists but nothing reaches the user.
- **Effort:** Medium (email provider integration + email templates)

### 8. Shared Fleet / Multi-User
- Allow multiple users to manage the same vehicles
- Role-based access: Owner, Editor, Viewer
- Invitation system via email
- **Why:** Families and small businesses need shared access to vehicle records.
- **Effort:** Large (new entity relationships + permission system + UI)

### 9. Advanced Analytics & Insights ✅ (in progress)
- Fuel price trends (cost/liter over time, per station) ✅ — Price per Liter chart on dashboard
- Carbon footprint estimation (kg CO2 per fuel/charge type)
- Cost-per-km trends across all vehicles ✅ — efficiency cards on dashboard
- Best/worst performing vehicles by efficiency
- Fuel efficiency per vehicle (km/L & km/kWh) ✅ — efficiency cards
- **Why:** Transforms Helium from a record-keeper into a proactive optimization tool.
- **Effort:** Medium (new report endpoints + chart components)
- **Status:** Efficiency cards + price per liter trend implemented. Remaining items: carbon footprint, best/worst vehicles.

### 10. Mobile App (Flutter)
- Build out Flutter app with login, dashboard, vehicle list, entry creation
- Offline-first capability for logging at the pump/charger
- Camera integration for receipt capture
- **Why:** The primary use case happens away from a desk. Scaffold exists but is empty.
- **Effort:** Large (full mobile app build)

---

## P2 — Nice to Have

### 11. Dark Mode
- Theme toggle using Tailwind's `dark:` variant
- Persist preference in localStorage
- **Effort:** Small

### 12. i18n / Multi-Currency
- Users already have `PreferredCurrency` field
- Add locale switching, number/date formatting
- **Effort:** Medium

### 13. Vehicle Health Score
- Algorithm combining: maintenance history frequency, odometer vs. expected, age, overdue reminders
- Display score on vehicle detail and dashboard
- **Effort:** Small–Medium

### 14. CSV/PDF Export Everywhere
- Export any list (vehicles, fuel, charging, maintenance) to CSV or PDF
- Export reports to PDF
- **Effort:** Medium

### 15. Service History Book (Digital Logbook)
- Generate a PDF "service history book" per vehicle — useful for resale
- Include all maintenance records, receipts, and notes
- **Effort:** Medium

### 16. Fuel Price Map
- Plot fuel stations on a map with logged prices
- Help users find the cheapest fuel nearby
- **Effort:** Large (map integration + geo-data)

### 17. PWA / Offline Support
- Service worker for caching
- Offline-first data entry (sync when online)
- Installable web app
- **Effort:** Large

### 18. Search & Advanced Filtering
- Free-text search on list pages
- Advanced filters: date range, cost range, powertrain type, etc.
- **Effort:** Medium

### 19. Form Drafts / Save-for-Later
- Auto-save form state to localStorage
- Resume partially filled forms after navigation
- **Effort:** Small

### 20. Loading Skeletons & Shared Component Library
- Replace "Loading..." text with proper skeleton components
- Extract duplicated form elements into shared components
- `PrimaryButton` already exists but is unused — integrate or remove it
- **Effort:** Small–Medium

---

## Implementation Order (Recommended Path)

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

---

*This is a living document. Update it as priorities change or new ideas emerge.*
