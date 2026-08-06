# E-Commerce Platform with ERP Integration
## Project Report — Consolidated Scope, Architecture & Plan

**Document version:** 2.0  
**Date:** August 5, 2026  
**Source:** `ecommerce-erp-project-report-v1.md` + JPA Architecture Specification + Stakeholder Refinements (Requirement #2 Admin Authority)

---

## Executive Summary

This project delivers a **customer-facing e-commerce platform** that integrates with a **centralized ERP system owned by an external team**. The platform enables public product browsing, authenticated shopping (cart, checkout, orders), reliable order submission to the ERP, and admin-controlled product sync, payment configurations, and direct product management authority.

| Item | Detail |
| --- | --- |
| **Technology stack** | Spring Boot · Spring Data JPA (Hibernate) · React · PostgreSQL · JWT |
| **Database Communication** | **Spring Data JPA Repositories** with ORM Entity Mappings, `@Transactional` boundaries, and JPA Specifications for dynamic search/filtering |
| **Your responsibility** | Customer-facing app: auth, catalog, cart, orders, payments, admin tooling, ERP integration client |
| **External responsibility** | ERP APIs: full product catalog, stock updates, order intake |
| **Estimated timeline** | 10–12 weeks (team: 1–2 backend, 1 frontend) |
| **Database** | PostgreSQL (relational: users ➔ addresses ➔ orders ➔ order items) |

---

## Table of Contents

1. [Project Scope](#1-project-scope)
2. [Stakeholder Requirements](#2-stakeholder-requirements)
3. [Architecture Overview](#3-architecture-overview)
4. [Product Sync & Admin Authority Strategy](#4-product-sync--admin-authority-strategy)
5. [Spring Data JPA Architecture](#5-spring-data-jpa-architecture)
6. [Authentication & Access Control](#6-authentication--access-control)
7. [Payment System](#7-payment-system)
8. [Database Schema](#8-database-schema)
9. [REST API Design](#9-rest-api-design)
10. [Security Design](#10-security-design)
11. [Development Roadmap](#11-development-roadmap)
12. [Key Risks & Mitigations](#12-key-risks--mitigations)
13. [Immediate Next Steps](#13-immediate-next-steps)
14. [Appendix — Consolidated Requirements Checklist](#14-appendix----consolidated-requirements-checklist)

---

## 1. Project Scope

### In-Scope (This Team)

- React single-page application (customer + admin UI)
- Spring Boot REST API built with **Spring Data JPA / Hibernate**
- PostgreSQL database (`users`, `addresses`, `cart`, `orders`, `product_cache`, `erp_outbox`)
- JWT-based authentication (register, login, refresh, logout)
- Local product cache with automatic background sync, manual sync triggers, and **admin manual edit authority**
- Cart, checkout, and order management
- ERP integration service (consume external APIs, submit orders, receive webhooks)
- Payment integration (Cash on Delivery + online gateway)
- Admin panel: sync controls, direct product editing/overrides, payment configuration, order management

### Out of Scope (External ERP Team)

- Building or owning the ERP backend
- ERP product master data management in external system
- ERP inventory source of truth (except consumption via API)

---

## 2. Stakeholder Requirements

### Requirement #1 — Public Browse, Login for Cart & Orders

| Action | Login required? | Behavior if not logged in |
| --- | --- | --- |
| Browse products | No | Full access |
| Search products | No | Full access |
| View product details | No | Full access |
| Add to cart | **Yes** | Redirect to Login / Signup |
| View cart | **Yes** | Redirect to Login / Signup |
| Track / view orders | **Yes** | Redirect to Login / Signup |
| Checkout / buy | **Yes** | Redirect to Login / Signup |
| Manage addresses | **Yes** | Redirect to Login / Signup |

**Rules:**
- Only catalog-related pages are public.
- Any page or action involving **cart** or **orders** requires authentication.
- Unauthenticated users attempting protected routes are **redirected to Login / Signup**.
- After login/register, user returns to the originally requested page (`returnUrl`).
- **No guest order tracking** — orders are tied to authenticated users only.

---

### Requirement #2 — Product Sync & Admin Manual Authority (Automatic + Manual)

Product management operates with **dual capabilities**: automatic ERP synchronization AND full administrative authority for manual overrides.

1. **Automatic Sync (Scheduled)**:
   - **Full Catalog Sync**: Runs automatically every **6–24 hours** via Spring `@Scheduled` background tasks to fetch new products, updated descriptions, prices, and categories from ERP.
   - **Quick Stock Sync**: Runs automatically every **2–5 minutes** to sync stock quantities.

2. **Manual Sync Trigger (Admin On-Demand)**:
   - **Full Catalog Sync Trigger**: Admin can click a button in the Admin Panel to force an immediate full sync from ERP.
   - **Single-Product Sync Trigger**: Admin can trigger a sync for a specific `erp_product_id` for instant updates.

3. **Admin Direct Manual Authority (Manual Overrides & Edits)**:
   - **Direct Edit Rights**: The admin has full authority to manually create, edit, or override any product field (Name, Description, Price, Stock, Category, Payment Options, Active/Inactive status) directly in the local system.
   - **Override Flag (`is_manually_overridden`)**: When an admin manually edits a product, an `is_manually_overridden = true` flag is set.
   - **Sync Protection Policy**: Automatic background syncs will **respect admin manual edits** and will NOT stomp on manually overridden fields unless the admin explicitly chooses "Reset & Re-sync from ERP".

---

### Requirement #3 — Configurable Payment System

- Integrate **Cash on Delivery (COD)** and **online payment** (Razorpay or Stripe).
- **Admin configures payment options per product:**
  - `COD_ONLY` — Cash on delivery only
  - `ONLINE_ONLY` — Online payment only
  - `BOTH` — Customer chooses at checkout
- **Admin global settings:** enable/disable COD, enable/disable online payment, default option for new products, gateway selection.
- Checkout shows only payment methods allowed for **all items in the cart** (intersection logic).
- Conflicting cart items (e.g. one COD-only + one online-only) block checkout with a clear message.

---

## 3. Architecture Overview

```
                                                 +-----------------------+
                                                 |       React SPA       |
                                                 |  Public + Protected   |
                                                 |        Routes         |
                                                 +-----------+-----------+
                                                             | HTTPS + JWT
                                                             v
                                                 +-----------------------+
                                                 |    Spring Boot API    |
                                                 | +-------------------+ |
                                                 | | Auth Service      | |
                                                 | | Product Service   | | <--- reads local cache / handles admin edits
                                                 | | Cart Service      | |
                                                 | | Order Service     | |
                                                 | | Payment Service   | |
                                                 | | ERP Integration   | | <--- talks to ERP
                                                 | +-------------------+ |
                                                 +----+-------------+----+
                                                      |             |
                                  Spring Data JPA     |             | REST API (external team)
                                  (Entities & Repos)  v             v
                                           +------------+  +-----------------------+
                                           | PostgreSQL |  |    Centralized ERP    |
                                           | Users, Cart|  |  Full product API     |
                                           | Orders,    |  |  Stock-only API       |
                                           | Products   |  |  Order intake         |
                                           +------------+  +-----------------------+
```

---

## 4. Product Sync & Admin Authority Strategy

### Multi-Tiered Synchronization & Edit Matrix

| Level | Mode | Frequency / Trigger | Payload | Behavior & Scope |
| --- | --- | --- | --- | --- |
| **Full Sync** | Automatic | Every 6–24 hours | Full product payload | Updates products where `is_manually_overridden = false`. |
| **Stock Sync** | Automatic | Every 2–5 minutes | `{ erp_product_id, stock_qty }` | Updates stock quantity. |
| **Live Check** | Automatic | At checkout (per item) | Real-time stock call | Validates stock before order placement. |
| **Admin Manual Sync** | Manual | On demand (Admin UI) | Full catalog or single product | Syncs from ERP on demand. |
| **Admin Direct Edit** | Manual | On demand (Admin UI) | Custom form fields | Directly updates product in DB, sets `is_manually_overridden = true`. |
| **Admin Reset Sync** | Manual | On demand (Admin UI) | Re-fetches ERP data | Overwrites admin edits and clears `is_manually_overridden` flag. |

---

## 5. Spring Data JPA Architecture

All database communication is handled via **Spring Data JPA** and **Hibernate ORM**.

### 1. Key Entities & Relationships
- **`User` Entity**: `@OneToMany` with `Address` and `Order`.
- **`Product` Entity**: Contains JPA annotations (`@Entity`, `@Table`, `@Id`, `@Version` for optimistic locking).
- **`CartItem` Entity**: `@ManyToOne` with `User` and `Product`.
- **`Order` Entity**: `@OneToMany(cascade = CascadeType.ALL)` with `OrderItem`.
- **`ErpOutbox` Entity**: Stores transactional payloads for reliable delivery.

### 2. JPA Repositories
- `UserRepository extends JpaRepository<User, UUID>`
- `ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product>`
  - Includes custom queries for dynamic filtering, category filtering, and sync operations.
- `CartItemRepository extends JpaRepository<CartItem, UUID>`
- `OrderRepository extends JpaRepository<Order, UUID>`
- `ErpOutboxRepository extends JpaRepository<ErpOutbox, UUID>`

### 3. Transaction Management (`@Transactional`)
- Checkout operation uses `@Transactional(isolation = Isolation.READ_COMMITTED)` to atomically:
  1. Validate cart and stock.
  2. Create `Order` and `OrderItem` entries.
  3. Clear `CartItem` entries.
  4. Write `ErpOutbox` record for background sync.

---

## 6. Authentication & Access Control

### JWT Design

| Token | Expiry | Storage | Claims |
| --- | --- | --- | --- |
| Access token | 15 minutes | In memory (frontend) | `sub`, `role`, `email` |
| Refresh token | 7 days | httpOnly secure cookie | Token ID, User ID |

### Role-Based Access Summary

| Endpoint group | Authentication | Required Role |
| --- | --- | --- |
| Products (list, detail, search) | Public | None |
| Auth (register, login, refresh) | Public | None |
| Cart & Checkout | JWT required | `CUSTOMER` / `ADMIN` |
| User Orders & Addresses | JWT required | `CUSTOMER` / `ADMIN` |
| Admin Operations & Direct Product Edits | JWT required | **`ADMIN`** |
| ERP Webhooks | HMAC Signature | External System |

---

## 7. Payment System

### Per-Product & Cart Intersection Rules
- Products specify `payment_options`: `COD_ONLY`, `ONLINE_ONLY`, or `BOTH`.
- Admin sets global defaults (`cod_enabled`, `online_enabled`).
- Cart evaluates allowed methods dynamically based on all items in the cart.

---

## 8. Database Schema

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(30),
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    erp_customer_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT now()
);

-- Addresses
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    label VARCHAR(50),
    line1 VARCHAR(255), line2 VARCHAR(255),
    city VARCHAR(100), state VARCHAR(100),
    postal_code VARCHAR(20), country VARCHAR(100),
    phone VARCHAR(30),
    is_default BOOLEAN DEFAULT false
);

-- Products (local cache + admin manual edit support)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    erp_product_id VARCHAR(100) UNIQUE, -- optional/nullable for admin locally-created products
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL,
    category VARCHAR(100),
    image_url TEXT,
    stock_qty INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_manually_overridden BOOLEAN DEFAULT false, -- Tracks Admin Direct Edit Authority
    payment_options VARCHAR(20) NOT NULL DEFAULT 'BOTH',
    last_full_sync_at TIMESTAMP,
    last_stock_sync_at TIMESTAMP,
    version BIGINT DEFAULT 0 -- JPA Optimistic Locking
);

-- Cart items
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    quantity INT NOT NULL,
    added_at TIMESTAMP DEFAULT now()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    address_id UUID REFERENCES addresses(id),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    erp_order_id VARCHAR(100),
    total_amount NUMERIC(12,2),
    payment_method VARCHAR(20),
    payment_status VARCHAR(30) DEFAULT 'UNPAID',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Order items (snapshot)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    erp_product_id VARCHAR(100),
    sku VARCHAR(100),
    product_name VARCHAR(255),
    quantity INT NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL
);

-- Outbox for reliable ERP sync
CREATE TABLE erp_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    attempts INT DEFAULT 0,
    last_attempt_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);

-- Global payment settings
CREATE TABLE payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_enabled BOOLEAN DEFAULT true,
    online_enabled BOOLEAN DEFAULT true,
    default_product_payment_options VARCHAR(20) DEFAULT 'BOTH',
    online_gateway VARCHAR(30) DEFAULT 'RAZORPAY',
    updated_at TIMESTAMP DEFAULT now()
);
```

---

## 9. REST API Design

### Admin Product Management & Sync APIs (`ADMIN` Role Required)

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/admin/products/full-sync` | `ADMIN` | Trigger manual full product sync from ERP |
| `POST` | `/api/admin/products/{erpProductId}/sync` | `ADMIN` | Trigger manual sync for a single ERP product |
| `POST` | `/api/admin/products` | `ADMIN` | **Admin Manual Create**: Add a new local product directly |
| `PUT` | `/api/admin/products/{id}` | `ADMIN` | **Admin Manual Edit**: Update product fields (price, stock, details) & set override flag |
| `POST` | `/api/admin/products/{id}/reset-sync` | `ADMIN` | **Admin Reset**: Clear manual override & re-sync from ERP |
| `GET` | `/api/admin/products/sync-status` | `ADMIN` | Sync health & last run info dashboard |

---

## 10. Development Roadmap

### Phase 1: Core Backend & JPA Setup (Weeks 2–3)
- Spring Data JPA entity mappings (`User`, `Address`, `Product`, `CartItem`, `Order`).
- JPA Repositories and Spring Security JWT integration.

### Phase 2: Product Sync Engine & Admin Authority (Weeks 3–4)
- Automatic `@Scheduled` sync jobs + manual ERP sync endpoints.
- Admin Direct Edit API (`PUT /api/admin/products/{id}`) with override flag preservation.

### Phase 3–8: Frontend, Cart, Checkout, Payments, & Launch Prep (Weeks 4–12)
- Complete React UI building on top of JPA REST endpoints.

---

## 11. Appendix — Consolidated Checklist

- [x] **Database Access**: Spring Data JPA with Hibernate repositories.
- [x] **Requirement #1**: Public catalog browsing, login required for cart/checkout.
- [x] **Requirement #2**: 
  - [x] Automatic scheduled syncs (full + stock).
  - [x] Manual trigger for full & single product sync.
  - [x] Admin direct manual edit/create authority with `is_manually_overridden` protection.
- [x] **Requirement #3**: Configurable payment options (COD + Online) per product & global settings.

---
*End of report v2.0.*
