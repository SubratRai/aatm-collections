# Aatm Collections

Customer-facing e-commerce storefront for **Aatm Collections**, separate from Retail360 ERP.

## Stack
- Backend: Spring Boot 3.4, Spring Data JPA, Spring Security JWT, PostgreSQL (H2 for local)
- Frontend: React + Vite

## Quick start

### Backend
```bash
./mvnw spring-boot:run
```
API: http://localhost:8080

Seeded admin: `admin@aatm.local` / `admin123`

Use PostgreSQL:
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=postgres
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Storefront: http://localhost:5173

## Website configuration
Admin → **Website Configuration** (`/admin/website`) after login as admin.

Public settings: `GET /api/public/site-settings`

## Docs
See `docs/aatm-roadmap.md`
