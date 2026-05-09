# Helium App — Documentation Index

**Helium** is a full-stack vehicle management application for tracking fuel/charging entries, maintenance records, and fleet analytics. Built with ASP.NET Core, React, TypeScript, Tailwind CSS, and Flutter.

## Documentation

| File | Description |
|------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, layer descriptions, tech stack, and data flow diagrams |
| [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md) | All business rules, calculations, formulas, validations, and auth logic |
| [API.md](./API.md) | Complete REST API endpoint reference — methods, routes, auth, request/response shapes |
| [ROADMAP.md](./ROADMAP.md) | Feature roadmap & value-add ideas organized by priority |
| [DECISIONS.md](./DECISIONS.md) | Architecture Decision Records (ADRs) — rationale behind key technical choices |
| [SETUP.md](./SETUP.md) | Development environment setup guide — prerequisites, configuration, run instructions |

## Project Structure (Top-Level)

```
Helium App/
├── Backend/                     # ASP.NET Core Web API (Clean Architecture)
│   ├── Helium.Domain/           #   Entities, Enums, Common base classes
│   ├── Helium.Application/      #   DTOs, Services, Validation, Mapping
│   ├── Helium.Infrastructure/   #   EF Core, Repositories, Security, Storage
│   ├── Helium.Api/              #   Controllers, Middleware, Background Services
│   └── Helium.Api.Tests/        #   Test project
├── Frontend/
│   └── helium-frontend/
│       ├── web/                 # React + TypeScript + Tailwind CSS web app
│       └── mobile/              # Flutter mobile app (scaffolded)
└── docs/                        # Project documentation (this folder)
```

## Quick Links

- **Backend README** — [../Backend/README.md](../Backend/README.md)
- **Frontend README** — [../Frontend/helium-frontend/README.md](../Frontend/helium-frontend/README.md)
- **Web App README** — [../Frontend/helium-frontend/web/README.md](../Frontend/helium-frontend/web/README.md)
- **Mobile App README** — [../Frontend/helium-frontend/mobile/README.md](../Frontend/helium-frontend/mobile/README.md)
