# Deal Tracker — Technical Design Document

**Version:** 0.1 (Draft)
**Date:** 2026-03-29

---

## 1. Overview

Deal Tracker is a system that lets users monitor websites and e-commerce stores for offers, deals, and discounts. Users register URLs they want to watch; the system periodically harvests and parses those pages, detects active promotions, and notifies users via an in-app dashboard and email.

---

## 2. User Stories

### US-1 — Track a website for deals
*As a user, I want to provide a URL so that the system monitors it and notifies me (both in-app and by email) whenever an offer or discount is detected.*

**Acceptance criteria:**
- User submits a URL and an optional display name via the dashboard.
- The system begins harvesting the page at the configured interval.
- When a new deal is detected, the user receives an in-app notification and an email.
- The notification includes the site name, deal type, and a summary of the offer.

### US-2 — Dashboard overview of monitored sites
*As a user, I want to see all the websites I am currently monitoring and their current status (active offer or no offer) so that I have a quick overview at a glance.*

**Acceptance criteria:**
- The dashboard lists all tracked sites with their name, URL, and current deal status.
- Sites with an active offer are visually distinguished (e.g. badge, colour, icon).
- The list shows when each site was last checked and when the next check is scheduled.
- Users can activate, deactivate, or remove a tracked site from the dashboard.

### US-3 — Deal history per site
*As a user, I want to view the history of a tracked site to see when it had offers in the past, including metadata describing each offer (type, discount value, dates), so that I can spot patterns and trends.*

**Acceptance criteria:**
- Each tracked site has a detail/history view.
- The history lists all previously detected deals in reverse chronological order.
- Each entry shows: deal type, title/description, discount value, date detected, and expiry date (if available).
- The history persists even after a deal is no longer active.

---

## 3. Architecture

The system is composed of three independently deployable modules that share a single PostgreSQL database.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐
│  Harvester   │     │    Parser    │     │       WebApp          │
│              │     │              │     │  (API + React SPA)    │
│ Scheduled    │────▶│ Reads raw    │────▶│  Dashboard, alerts,   │
│ page fetches │     │ snapshots,   │     │  site management,     │
│              │     │ detects      │     │  notifications        │
│ Stores raw   │     │ deals        │     │                       │
│ snapshots    │     │              │     │  REST API (OpenAPI)   │
└──────┬───────┘     └──────┬───────┘     └──────────┬────────────┘
       │                    │                        │
       └────────────────────┴────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │  PostgreSQL   │
                    │  (shared DB)  │
                    └───────────────┘
```

Each module is packaged as its own Docker image. They coordinate through the shared database — no direct inter-service calls are required for v1.

---

## 4. Shared Tech Stack

| Concern              | Choice                                       |
|----------------------|----------------------------------------------|
| Language             | Java 21                                      |
| Framework            | Spring Boot 3.x                              |
| Build                | Maven (multi-module parent POM)              |
| Database             | PostgreSQL 16                                |
| API contract         | OpenAPI 3.0 → generated interfaces & DTOs    |
| Frontend             | React 18, TypeScript, MUI component library, SCSS modules |
| Containerisation     | Docker (one image per module)                |
| DB migrations        | Flyway                                       |

---

## 5. Maven Project Structure

```
deal-tracker/
├── pom.xml                          # parent POM, dependency management
├── deal-tracker-common/             # shared entities, enums, utils
│   └── pom.xml
├── deal-tracker-harvester/
│   └── pom.xml
├── deal-tracker-parser/
│   └── pom.xml
├── deal-tracker-webapp/
│   ├── pom.xml                      # Spring Boot app + OpenAPI codegen
│   └── frontend/                    # React SPA (built via frontend-maven-plugin)
│       ├── package.json
│       ├── src/
│       └── openapi/                 # generated TypeScript client
└── docker-compose.yml
```

The `common` module holds JPA entities, shared enums (e.g. `SnapshotStatus`, `DealType`), and utility classes so all three services use identical domain objects against the shared database.

---

## 6. Module Summaries

### 6.1 Harvester

**Responsibility:** Fetch web pages on a schedule and persist raw snapshots.

| Aspect            | Detail                                                                 |
|-------------------|------------------------------------------------------------------------|
| Trigger           | Spring `@Scheduled` cron (configurable per tracked site, max ~1/hour)  |
| HTTP client       | Java `HttpClient` or Jsoup for HTML retrieval                          |
| Robots.txt        | Checked and respected before every fetch; cached per domain            |
| Content hashing   | SHA-256 of fetched HTML; compared to previous hash on `tracked_sites`  |
| Storage           | Raw HTML stored on disk (volume mount); metadata row in `snapshot` table|
| Skip unchanged    | If hash matches previous fetch, no new snapshot is created — only a `fetch_log` entry |
| Headless browser  | Playwright for JS-rendered pages (v2)                                  |
| Output            | A new `snapshot` row with status `PENDING_PARSE` (only when content changed) |
| Fetch logging     | Every fetch attempt is logged in `fetch_log` table (success, unchanged, or failed) |
| Failure handling  | Retries with back-off; logs `FETCH_FAILED` after exhaustion            |

### 6.2 Parser

**Responsibility:** Analyse raw snapshots and detect site-wide deals and offers.

**Scope:** The parser targets site-wide promotions (e.g. "Spring Sale — 20% off everything", "Free shipping this weekend") rather than individual product-level price tracking. The goal is to detect when a site is running a campaign or promotion.

| Aspect            | Detail                                                                  |
|-------------------|-------------------------------------------------------------------------|
| Trigger           | Polls for `PENDING_PARSE` snapshots (or listens on pg `NOTIFY`)         |
| Pipeline          | 3-layer detection: structured data → DOM patterns → text/regex          |
| Confidence        | Each detection gets a confidence score (HIGH / MEDIUM / LOW)            |
| Expiry extraction | Best-effort extraction of deal end dates from surrounding text          |
| Languages         | English and Norwegian for v1; keyword files are locale-separated        |
| Output            | `deal` rows linked to the snapshot; snapshot marked `PARSED`            |

#### 6.2.1 Detection Pipeline

Each snapshot is run through three layers in order. All layers contribute detections independently — they are additive, not short-circuiting. Duplicate detections across layers are merged by similarity before persisting.

**Layer 1 — Structured data extraction (confidence: HIGH)**

Extracts machine-readable offer data that sites embed for search engines and social platforms.

| Source                  | What to look for                                                    |
|-------------------------|---------------------------------------------------------------------|
| JSON-LD (`<script type="application/ld+json">`) | Schema.org types: `Offer`, `AggregateOffer`, `Sale`, `Discount`, `Event` (with offer sub-objects). Fields: `price`, `priceCurrency`, `discount`, `validThrough`, `description`. |
| Open Graph `<meta>` tags | `og:price:amount`, `og:price:currency`, `product:sale_price`, `og:description` containing deal keywords. |
| Microdata (`itemscope`) | Elements with `itemtype` matching schema.org offer types; `itemprop` for `price`, `discount`, `availability`. |

Detections from structured data get HIGH confidence because the site has explicitly declared this information.

**Layer 2 — DOM pattern matching (confidence: MEDIUM)**

Scans the HTML DOM for elements whose CSS classes, IDs, or `data-*` attributes suggest promotional content.

Target attribute patterns (case-insensitive substring match):
`sale`, `promo`, `promotion`, `discount`, `offer`, `deal`, `banner`, `coupon`, `campaign`, `clearance`, `special-offer`, `hero-offer`, `site-wide`, `sitewide`

The parser extracts visible text content from matching elements. To focus on site-wide banners rather than product cards, the parser prioritises elements that are: direct children of `<header>`, `<nav>`, or `<body>`; positioned early in the DOM (above the fold heuristic); or large/full-width containers (banner-like).

**Layer 3 — Text pattern scanning (confidence: LOW)**

Scans all visible text on the page for regex patterns and keyword phrases that indicate promotions. Patterns are loaded from a locale-keyed keyword file (`deal-keywords.yml`).

Pattern categories:

| Category            | Example patterns (EN)                                                |
|---------------------|----------------------------------------------------------------------|
| Percentage discounts| `\d{1,2}%\s*(off\|rabatt\|discount)`, `save \d{1,2}%`               |
| Fixed amount off    | `(save\|get)\s*\$?\d+\s*off`, `\$\d+\s*off`                         |
| Promotional phrases | `free shipping`, `buy one get one`, `BOGO`, `limited time`          |
| Sale events         | `spring sale`, `summer sale`, `black friday`, `cyber monday`         |
| Coupon codes        | `(use\|enter\|apply)\s*(code\|coupon\|promo)\s*:?\s*[A-Z0-9]+`      |
| Urgency markers     | `ends (today\|tonight\|soon\|sunday)`, `last chance`, `while supplies last` |
| Norwegian equiv.    | `tilbud`, `rabatt`, `salg`, `gratis frakt`, `kampanje`, `vårslipp`  |

These patterns live in a YAML keyword file (`deal-keywords.yml`) organised by locale and category, making it straightforward to add new languages or patterns without code changes.

#### 6.2.2 Keyword File Structure

```yaml
# deal-keywords.yml
locales:
  en:
    percentage_discount:
      patterns:
        - '\d{1,2}%\s*(off|discount|savings)'
        - 'save\s+\d{1,2}%'
        - 'up\s+to\s+\d{1,2}%\s+off'
      keywords:
        - "percent off"
        - "half price"
        - "half off"
    fixed_amount_discount:
      patterns:
        - '(save|get)\s+[\$£€]\s*\d+'
        - '[\$£€]\s*\d+\s+off'
      keywords:
        - "dollars off"
        - "money off"
    sale_event:
      keywords:
        - "spring sale"
        - "summer sale"
        - "winter sale"
        - "autumn sale"
        - "flash sale"
        - "clearance sale"
        - "black friday"
        - "cyber monday"
        - "end of season"
        - "site-wide sale"
        - "sitewide sale"
        - "store-wide sale"
        - "grand opening sale"
        - "anniversary sale"
        - "holiday sale"
        - "warehouse sale"
        - "everything must go"
    promotional:
      keywords:
        - "free shipping"
        - "free delivery"
        - "buy one get one"
        - "BOGO"
        - "gift with purchase"
        - "limited time offer"
        - "special offer"
        - "exclusive offer"
        - "members only"
        - "today only"
        - "this weekend only"
    coupon:
      patterns:
        - '(use|enter|apply|code|coupon|promo)\s*:?\s*[A-Z0-9]{3,}'
      keywords:
        - "promo code"
        - "coupon code"
        - "discount code"
        - "voucher code"
        - "use code"
    urgency:
      keywords:
        - "ends today"
        - "ends tonight"
        - "ends soon"
        - "last chance"
        - "while supplies last"
        - "limited stock"
        - "don't miss out"
        - "hurry"
        - "final hours"
        - "selling fast"

  no:
    percentage_discount:
      patterns:
        - '\d{1,2}%\s*(rabatt|avslag)'
        - 'spar\s+\d{1,2}%'
        - 'opptil\s+\d{1,2}%'
      keywords:
        - "prosent rabatt"
        - "halv pris"
    fixed_amount_discount:
      patterns:
        - 'spar\s+\d+\s*(kr|NOK)'
        - '\d+\s*(kr|NOK)\s+(rabatt|avslag)'
      keywords:
        - "kroner rabatt"
        - "kroner avslag"
    sale_event:
      keywords:
        - "vårsalg"
        - "sommersalg"
        - "vintersalg"
        - "høstsalg"
        - "black friday"
        - "cyber monday"
        - "sesongslutt"
        - "lageruttømming"
        - "lagersalg"
        - "alt må ut"
        - "storsalg"
        - "supersalg"
        - "kampanje"
        - "vårslipp"
        - "romjulssalg"
    promotional:
      keywords:
        - "gratis frakt"
        - "gratis levering"
        - "fri frakt"
        - "kjøp 2 betal for 1"
        - "gavekort inkludert"
        - "begrenset tilbud"
        - "spesialtilbud"
        - "eksklusivt tilbud"
        - "kun i dag"
        - "kun denne helgen"
        - "medlemstilbud"
    coupon:
      patterns:
        - '(bruk|skriv|kode|kupong|rabattkode)\s*:?\s*[A-Z0-9]{3,}'
      keywords:
        - "rabattkode"
        - "kupongkode"
        - "kampanjekode"
        - "bruk kode"
    urgency:
      keywords:
        - "slutter i dag"
        - "siste sjanse"
        - "begrenset antall"
        - "snart slutt"
        - "går fort"
        - "skynd deg"
        - "siste dag"
```

#### 6.2.3 Expiry Date Extraction

When a deal is detected, the parser makes a best-effort attempt to extract an end date from nearby text. Strategies:

- **Structured data:** `validThrough` or `endDate` fields in JSON-LD / microdata.
- **Text patterns:** regex for phrases like `ends March 31`, `valid until 04/15`, `through Sunday`, `t.o.m. 31. mars`, `gjelder til søndag`.
- **Relative dates:** "ends today", "ends this weekend", "slutter i dag" resolved to absolute dates based on the fetch timestamp.

If no expiry is found, the field is left null.

#### 6.2.4 Confidence Scoring

| Layer               | Base confidence | Boosted to HIGH if…                                    |
|---------------------|-----------------|--------------------------------------------------------|
| Layer 1 (structured)| HIGH            | —                                                       |
| Layer 2 (DOM)       | MEDIUM          | Multiple matching elements, or element contains Layer 3 keyword |
| Layer 3 (text)      | LOW             | Multiple distinct patterns match, or co-occurs with urgency marker |

All detections are stored regardless of confidence. The WebApp UI displays the confidence level so the user can judge relevance.

### 6.3 WebApp

**Responsibility:** User-facing API and frontend dashboard, plus notification dispatch.

| Aspect            | Detail                                                                  |
|-------------------|-------------------------------------------------------------------------|
| API               | REST, contract-first via OpenAPI spec                                   |
| Auth              | None for v1 (single-user / trusted network); Spring Security in v2     |
| Serving model     | React SPA built at compile time and served by Spring Boot from `/`     |
| Core features     | Register/manage tracked sites, dashboard of active deals, history       |
| Notifications     | In-app (persisted in `notification` table, polled or SSE) + email       |
| Email             | Spring Mail with SMTP; templated via Thymeleaf                          |
| Frontend          | React 18, TypeScript, MUI component library, SCSS modules              |

#### 6.3.1 Serving Architecture

The React SPA is served directly by the Spring Boot application to avoid CORS issues entirely. No separate dev server is needed in production.

```
Build pipeline:
  frontend-maven-plugin
    ├── npm install
    └── npm run build
          └── outputs to src/main/resources/static/

Spring Boot serves:
  /              → index.html (React SPA entry point)
  /assets/**     → JS/CSS bundles, images
  /api/**        → REST API endpoints

SPA routing:
  Spring Boot forwards all non-API, non-static paths to index.html
  so that React Router handles client-side navigation.
```

Spring Boot resource handler config:
- All `/api/**` requests are handled by REST controllers.
- All other requests that don't match a static file are forwarded to `index.html`.
- This is achieved with a simple catch-all controller or `WebMvcConfigurer` that forwards unknown paths.

#### 6.3.2 API Design

All endpoints live under `/api/v1`. The OpenAPI spec generates both server interfaces and TypeScript client code.

**Tracked Sites**

| Method | Path                              | Description                          |
|--------|-----------------------------------|--------------------------------------|
| GET    | `/api/v1/sites`                   | List all tracked sites with current deal status |
| POST   | `/api/v1/sites`                   | Add a new site to track              |
| GET    | `/api/v1/sites/{id}`              | Get site detail including active deals |
| PUT    | `/api/v1/sites/{id}`              | Update site (name, interval, active) |
| DELETE | `/api/v1/sites/{id}`              | Remove a tracked site                |

**Deals**

| Method | Path                              | Description                          |
|--------|-----------------------------------|--------------------------------------|
| GET    | `/api/v1/sites/{id}/deals`        | Deal history for a site (paginated, newest first) |
| GET    | `/api/v1/deals`                   | All deals across all sites (filterable by active, confidence, type) |
| GET    | `/api/v1/deals/active`            | All currently active deals (dashboard feed) |

**Notifications**

| Method | Path                              | Description                          |
|--------|-----------------------------------|--------------------------------------|
| GET    | `/api/v1/notifications`           | List notifications (paginated, unread first) |
| PUT    | `/api/v1/notifications/{id}/read` | Mark a notification as read          |
| PUT    | `/api/v1/notifications/read-all`  | Mark all notifications as read       |
| GET    | `/api/v1/notifications/unread-count` | Unread count (polled by header badge) |

**User Preferences**

| Method | Path                              | Description                          |
|--------|-----------------------------------|--------------------------------------|
| GET    | `/api/v1/preferences`             | Get notification preferences         |
| PUT    | `/api/v1/preferences`             | Update notification preferences      |

#### 6.3.3 Frontend Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── api/                        # generated TypeScript client from OpenAPI
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # sidebar + topbar + main content area
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── StatsCards.tsx       # summary cards (total sites, active deals, etc.)
│   │   │   ├── ActiveDealsFeed.tsx  # live feed of current deals
│   │   │   └── SiteStatusGrid.tsx   # grid of monitored sites with status
│   │   ├── sites/
│   │   │   ├── SitesListPage.tsx    # all tracked sites
│   │   │   ├── SiteDetailPage.tsx   # single site with deal history
│   │   │   ├── AddSiteDialog.tsx    # modal to add a new URL
│   │   │   └── SiteCard.tsx         # card component per site
│   │   ├── notifications/
│   │   │   ├── NotificationBell.tsx # topbar icon with unread badge
│   │   │   └── NotificationPanel.tsx# dropdown/drawer with notification list
│   │   └── common/
│   │       ├── ConfidenceBadge.tsx  # HIGH/MEDIUM/LOW visual indicator
│   │       ├── DealTypeBadge.tsx    # colour-coded deal type chip
│   │       └── TimeAgo.tsx          # relative time display
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Sites.tsx
│   │   ├── SiteDetail.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── usePolling.ts           # generic polling hook for notifications
│   │   └── useSites.ts             # site data fetching + caching
│   ├── styles/
│   │   ├── _variables.scss          # colour palette, spacing, breakpoints
│   │   ├── _mixins.scss
│   │   └── global.scss
│   ├── App.tsx                      # React Router setup
│   └── main.tsx
├── package.json
└── tsconfig.json
```

#### 6.3.4 Dashboard UI

The dashboard follows a modern analytics-style layout using MUI components with SCSS modules for custom styling.

```
┌─────────────────────────────────────────────────────────┐
│ TopBar                          🔔 3  ⚙️               │
├────────┬────────────────────────────────────────────────┤
│        │                                                │
│  Side  │  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  bar   │  │ Sites   │ │ Active  │ │ Deals   │          │
│        │  │ tracked │ │ deals   │ │ today   │          │
│  📊    │  │   12    │ │    4    │ │    2    │          │
│  Dash  │  └─────────┘ └─────────┘ └─────────┘          │
│        │                                                │
│  🌐    │  Active Deals Feed                             │
│  Sites │  ┌────────────────────────────────────────┐    │
│        │  │ 🟢 HIGH  store.no — Spring Sale 20%    │    │
│  ⚙️    │  │         Detected 2h ago · Ends Apr 5   │    │
│  Sett. │  ├────────────────────────────────────────┤    │
│        │  │ 🟡 MED  shop.com — Free Shipping       │    │
│        │  │         Detected 5h ago                 │    │
│        │  ├────────────────────────────────────────┤    │
│        │  │ 🔴 LOW  example.com — Possible coupon  │    │
│        │  │         Detected 1d ago                 │    │
│        │  └────────────────────────────────────────┘    │
│        │                                                │
│        │  Monitored Sites                               │
│        │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│        │  │ store.no │ │ shop.com │ │ ex.com   │       │
│        │  │ 🟢 Offer │ │ 🟢 Offer│ │ ⚪ None  │       │
│        │  │ Last: 1h │ │ Last: 3h│ │ Last: 2h │       │
│        │  └──────────┘ └──────────┘ └──────────┘       │
│        │                                                │
├────────┴────────────────────────────────────────────────┤
```

**Key UI patterns:**

- **Stats cards:** MUI `Card` components at the top showing aggregate counts (sites tracked, active deals, deals detected today). Quick visual pulse of the system.
- **Active deals feed:** Reverse-chronological list of current deals. Each entry shows the confidence badge (colour-coded), site name, deal summary, time detected, and expiry if known. Clicking navigates to the site detail page.
- **Site status grid:** MUI `Card` grid showing each tracked site with a status indicator (green = active offer, grey = no offer), last checked time, and next check time. Clicking opens the site detail with full deal history.
- **Notification bell:** TopBar icon with unread count badge. Opens a dropdown panel listing recent notifications. Polling every 30 seconds for unread count.
- **Site detail page:** Header with site info and controls (edit, pause, delete). Below that, a timeline/table of all historical deals for the site, each with type badge, confidence, description, and dates.

**MUI + SCSS module approach:**

- MUI provides the component library (Card, DataGrid, Chip, Badge, Dialog, AppBar, Drawer, etc.).
- SCSS modules (e.g. `DashboardPage.module.scss`) handle layout, custom spacing, and any styling beyond what MUI's `sx` prop covers.
- A shared `_variables.scss` defines the colour palette and spacing scale, keeping the design consistent.
- Dark mode support via MUI's `ThemeProvider` with a custom theme (stretch goal for v1).

#### 6.3.5 Notification Dispatch

Notifications live in the WebApp because they depend on user preferences and the user-facing API.

```
Scheduled job (every 30s):
  1. Query deals WHERE detected_at > last_processed_timestamp
  2. For each new deal:
     a. Find all users tracking that site
     b. Create IN_APP notification row (status: PENDING)
     c. If user.notify_email = true AND email_frequency = INSTANT:
        → Send email via Spring Mail (Thymeleaf template)
        → Mark email notification SENT
     d. Mark in-app notification SENT (visible in dashboard)
  3. Update last_processed_timestamp

Daily digest job (configurable time, e.g. 08:00):
  1. Query users WHERE email_frequency = DAILY_DIGEST
  2. For each user, collect all deals from last 24h across their tracked sites
  3. Send single digest email with summary table
  4. Mark digest notifications SENT
```

**Email templates (Thymeleaf):**

- `deal-alert.html` — instant notification: site name, deal type, description, confidence, link to dashboard.
- `daily-digest.html` — summary table of all deals detected in the last 24 hours, grouped by site.

#### 6.3.6 Frontend Build Integration

The React app is compiled during the Maven build and bundled into the Spring Boot JAR.

```xml
<!-- In deal-tracker-webapp/pom.xml -->
<plugin>
  <groupId>com.github.eirslett</groupId>
  <artifactId>frontend-maven-plugin</artifactId>
  <configuration>
    <workingDirectory>frontend</workingDirectory>
    <nodeVersion>v20.x.x</nodeVersion>
  </configuration>
  <executions>
    <!-- 1. Install Node/npm -->
    <!-- 2. npm install -->
    <!-- 3. npm run generate-api (OpenAPI client codegen) -->
    <!-- 4. npm run build (Vite → outputs to src/main/resources/static/) -->
  </executions>
</plugin>
```

The build chain: `openapi.yaml` → `openapi-generator-cli` → TypeScript client in `src/api/` → Vite build → static assets copied to Spring Boot's `resources/static/` → single JAR serves everything.

---

## 7. Data Model (high-level)

```
users
  id              UUID PK
  email           VARCHAR UNIQUE
  created_at      TIMESTAMPTZ

tracked_sites
  id              UUID PK
  user_id         UUID FK → users
  url             VARCHAR
  name            VARCHAR
  check_interval  INTERVAL          -- e.g. '1 hour', '6 hours'
  active          BOOLEAN
  last_content_hash VARCHAR         -- SHA-256 of most recent HTML; used to skip unchanged pages
  created_at      TIMESTAMPTZ

fetch_log
  id              UUID PK
  tracked_site_id UUID FK → tracked_sites
  status          VARCHAR            -- SUCCESS | UNCHANGED | FAILED
  content_hash    VARCHAR            -- SHA-256 of fetched HTML (null if FAILED)
  http_status     INTEGER            -- HTTP response code
  error_message   TEXT               -- populated on FAILED
  fetched_at      TIMESTAMPTZ

snapshots
  id              UUID PK
  tracked_site_id UUID FK → tracked_sites
  fetch_log_id    UUID FK → fetch_log
  status          VARCHAR            -- PENDING_PARSE | PARSED | PARSE_FAILED
  content_hash    VARCHAR            -- SHA-256 (matches fetch_log)
  file_path       VARCHAR            -- on-disk path to raw HTML
  fetched_at      TIMESTAMPTZ

deals
  id              UUID PK
  snapshot_id     UUID FK → snapshots
  tracked_site_id UUID FK → tracked_sites
  type            VARCHAR            -- PERCENTAGE_OFF | COUPON | SALE_EVENT | FREE_SHIPPING | BOGO | OTHER
  title           VARCHAR
  description     TEXT
  discount_value  VARCHAR            -- e.g. "20%", "$15 off"
  confidence      VARCHAR            -- HIGH | MEDIUM | LOW
  detection_layer VARCHAR            -- STRUCTURED_DATA | DOM_PATTERN | TEXT_PATTERN
  detected_at     TIMESTAMPTZ
  expires_at      TIMESTAMPTZ        -- best-effort; null if not found
  active          BOOLEAN

notifications
  id              UUID PK
  user_id         UUID FK → users
  deal_id         UUID FK → deals
  channel         VARCHAR            -- IN_APP | EMAIL
  status          VARCHAR            -- PENDING | SENT | READ
  created_at      TIMESTAMPTZ

user_preferences
  user_id         UUID PK FK → users
  notify_email    BOOLEAN
  notify_in_app   BOOLEAN
  email_frequency VARCHAR            -- INSTANT | DAILY_DIGEST
```

---

## 8. OpenAPI Contract

A single `openapi.yaml` spec lives in the WebApp module. The Maven build generates:

- **Server side:** Java interfaces + DTO classes (via `openapi-generator-maven-plugin`, `spring` generator). Controllers implement the generated interfaces.
- **Client side:** TypeScript Axios client (via `openapi-generator-cli` in the frontend build). React code imports generated types and API functions.

This guarantees type-safe alignment between backend and frontend with zero manual DTO duplication.

---

## 9. Notification Flow

```
Parser writes new deal row
        │
        ▼
WebApp scheduled job (e.g. every 30 s) picks up unprocessed deals
        │
        ├──▶ Creates IN_APP notification row (visible in dashboard)
        │
        └──▶ If user prefers INSTANT email → sends email via SMTP
             If user prefers DAILY_DIGEST → batched by a daily job
```

---

## 10. Docker & Deployment

```yaml
# docker-compose.yml (development)
services:
  postgres:
    image: postgres:16
    environment: ...
    volumes:
      - pg-data:/var/lib/postgresql/data

  harvester:
    build: ./deal-tracker-harvester
    depends_on: [postgres]
    volumes:
      - snapshots:/data/snapshots

  parser:
    build: ./deal-tracker-parser
    depends_on: [postgres]
    volumes:
      - snapshots:/data/snapshots      # reads what harvester wrote

  webapp:
    build: ./deal-tracker-webapp
    depends_on: [postgres]
    ports:
      - "8080:8080"

volumes:
  pg-data:
  snapshots:
```

All three services share the `snapshots` volume so the parser can read files the harvester wrote. Flyway migrations run on startup of whichever service starts first (or from a dedicated init container in production).

---

## 11. Phase Plan

| Phase | Scope                                                                     |
|-------|---------------------------------------------------------------------------|
| 1     | Project scaffolding: parent POM, common module, DB migrations, Docker     |
| 2     | Harvester: scheduled fetching, snapshot persistence                       |
| 3     | Parser: rule-based HTML parsing, deal detection                           |
| 4     | WebApp API: tracked-site CRUD, deal listing, OpenAPI codegen             |
| 5     | WebApp Frontend: React dashboard, tracked-site management, deal feed      |
| 6     | Notifications: in-app + email, user preferences                           |
| 7     | Polish: error handling, rate limiting, monitoring, headless browser support|

---

## 12. Implementation Guide (for Claude Code)

This section provides step-by-step implementation instructions for each module. Each step is scoped to be a single Claude Code task. Feed the relevant section of this design doc as context when starting each step.

### Step 1 — Common Module & Database Migrations

**Goal:** Establish the shared data model that all modules depend on.

**Tasks:**
1. Create the `deal-tracker-common` Maven module under the parent POM.
2. Add shared dependencies: Spring Data JPA, PostgreSQL driver, Flyway.
3. Create Flyway migration scripts in `deal-tracker-common/src/main/resources/db/migration/`:
   - `V1__create_users.sql`
   - `V2__create_tracked_sites.sql`
   - `V3__create_fetch_log.sql`
   - `V4__create_snapshots.sql`
   - `V5__create_deals.sql`
   - `V6__create_notifications.sql`
   - `V7__create_user_preferences.sql`
4. Create JPA entity classes matching the data model in section 7: `User`, `TrackedSite`, `FetchLog`, `Snapshot`, `Deal`, `Notification`, `UserPreference`.
5. Create enums: `FetchStatus` (SUCCESS, UNCHANGED, FAILED), `SnapshotStatus` (PENDING_PARSE, PARSED, PARSE_FAILED), `DealType` (PERCENTAGE_OFF, COUPON, SALE_EVENT, FREE_SHIPPING, BOGO, OTHER), `Confidence` (HIGH, MEDIUM, LOW), `DetectionLayer` (STRUCTURED_DATA, DOM_PATTERN, TEXT_PATTERN), `NotificationChannel` (IN_APP, EMAIL), `NotificationStatus` (PENDING, SENT, READ), `EmailFrequency` (INSTANT, DAILY_DIGEST).
6. Create Spring Data JPA repositories for each entity.
7. Verify migrations run successfully against a local PostgreSQL instance.

**Key files to reference:** Section 7 (Data Model), Section 5 (Maven Project Structure).

### Step 2 — Harvester Module

**Goal:** Scheduled fetching of tracked sites with content hashing and fetch logging.

**Tasks:**
1. Create the `deal-tracker-harvester` Spring Boot module. Add dependency on `deal-tracker-common`.
2. Create `HarvestScheduler` — a `@Scheduled` component that:
   - Queries all active `TrackedSite` entities where the next fetch is due (based on `check_interval` and the last `FetchLog` timestamp).
   - Delegates each site to `HarvestService`.
3. Create `HarvestService`:
   - Fetch HTML via Java `HttpClient` (follow redirects, set a sensible User-Agent, configurable timeout).
   - Compute SHA-256 hash of the response body.
   - Compare hash to `tracked_site.last_content_hash`.
   - If **unchanged**: write a `FetchLog` entry with status `UNCHANGED`, do not create a snapshot.
   - If **changed**: write raw HTML to disk at `{snapshot-dir}/{site-id}/{timestamp}.html`, create a `FetchLog` entry with status `SUCCESS`, create a `Snapshot` entry with status `PENDING_PARSE`, update `tracked_site.last_content_hash`.
   - If **failed**: write a `FetchLog` entry with status `FAILED`, populate `error_message` and `http_status`.
4. Create `RobotsTxtService`:
   - Fetch and cache `robots.txt` per domain (cache TTL: 24 hours).
   - Expose a method `boolean isAllowed(String url)` checked before every fetch.
   - If `robots.txt` cannot be fetched, default to allowing (but log a warning).
5. Configure `application.yml`: database connection, snapshot storage directory, scheduler cron expression, HTTP client timeouts.
6. Create a Dockerfile for the harvester.
7. Write integration tests: mock HTTP responses, verify fetch log entries, verify snapshot creation on changed content, verify skip on unchanged content.

**Key files to reference:** Section 6.1 (Harvester), Section 7 (Data Model — `tracked_sites`, `fetch_log`, `snapshots`).

### Step 3 — Parser Module

**Goal:** 3-layer detection pipeline that reads pending snapshots and produces deal records.

**Tasks:**
1. Create the `deal-tracker-parser` Spring Boot module. Add dependency on `deal-tracker-common`. Add Jsoup for HTML parsing.
2. Create `ParseScheduler` — polls for `Snapshot` entities with status `PENDING_PARSE`.
3. Create the detection pipeline interface:
   ```java
   public interface DetectionLayer {
       List<DealDetection> detect(Document htmlDoc, Locale locale);
   }
   ```
   Where `DealDetection` is a record holding: type, title, description, discountValue, confidence, detectionLayer, expiresAt (nullable).
4. Implement **Layer 1 — `StructuredDataDetector`**:
   - Extract all `<script type="application/ld+json">` blocks, parse as JSON.
   - Look for Schema.org types: `Offer`, `AggregateOffer`, `Sale`, `Discount`.
   - Extract `og:price:amount`, `product:sale_price` from `<meta>` tags.
   - Extract microdata (`itemscope`/`itemprop`).
   - Confidence: HIGH.
5. Implement **Layer 2 — `DomPatternDetector`**:
   - Scan all elements for class/id/data attributes containing target patterns (`sale`, `promo`, `discount`, `offer`, `deal`, `banner`, `coupon`, `campaign`, `clearance`, `special-offer`, `site-wide`, `sitewide`).
   - Prioritise elements in `<header>`, `<nav>`, or early in DOM.
   - Extract visible text content from matching elements.
   - Confidence: MEDIUM (boost to HIGH if element also contains Layer 3 keywords).
6. Implement **Layer 3 — `TextPatternDetector`**:
   - Load patterns from `deal-keywords.yml` (see section 6.2.2 for full file structure).
   - Scan all visible text nodes in the document.
   - Match regex patterns and keyword phrases per locale.
   - Confidence: LOW (boost if multiple distinct patterns match or urgency markers co-occur).
7. Create `ExpiryExtractor`:
   - Check `validThrough`/`endDate` from structured data (Layer 1 output).
   - Regex for date patterns in surrounding text: `ends March 31`, `valid until 04/15`, `t.o.m. 31. mars`, `gjelder til søndag`.
   - Resolve relative dates (`ends today`, `ends this weekend`, `slutter i dag`) using the snapshot's `fetched_at` timestamp.
8. Create `ParseService` that orchestrates:
   - Read HTML from disk using `snapshot.file_path`.
   - Parse with Jsoup.
   - Detect locale (heuristic: `<html lang="...">` attribute, or fallback to configured default).
   - Run all three layers.
   - Merge/deduplicate detections by similarity (e.g. same discount value + overlapping text).
   - Persist `Deal` entities.
   - Update snapshot status to `PARSED` (or `PARSE_FAILED` on error).
9. Create `deal-keywords.yml` in `src/main/resources/` with the full keyword structure from section 6.2.2.
10. Create a Dockerfile for the parser.
11. Write tests: provide sample HTML files with known deals, verify each layer detects them correctly, verify confidence scoring and boosting, verify expiry extraction.

**Key files to reference:** Section 6.2 (Parser — all subsections), Section 7 (Data Model — `snapshots`, `deals`).

### Step 4 — WebApp API (Backend)

**Goal:** REST API with OpenAPI codegen, notification dispatch, and SPA serving.

**Tasks:**
1. Create the `deal-tracker-webapp` Spring Boot module. Add dependency on `deal-tracker-common`.
2. Create the OpenAPI spec at `src/main/resources/openapi/openapi.yaml`:
   - Define all endpoints from section 6.3.2 (sites CRUD, deals, notifications, preferences).
   - Define all request/response DTOs.
   - Use proper pagination schemas for list endpoints.
3. Configure `openapi-generator-maven-plugin` in `pom.xml`:
   - Generator: `spring`
   - Generate interfaces only (`interfaceOnly: true`) — controllers implement them.
   - Output to `target/generated-sources/openapi/`.
4. Implement controllers:
   - `SiteController implements SitesApi` — CRUD for tracked sites, include current deal status in list/detail responses.
   - `DealController implements DealsApi` — deal listing with filters (active, confidence, type), pagination, per-site history.
   - `NotificationController implements NotificationsApi` — list, mark read, unread count.
   - `PreferenceController implements PreferencesApi` — get/update notification preferences.
5. Implement service layer:
   - `SiteService` — business logic for site management.
   - `DealService` — query deals with filtering and aggregation.
   - `NotificationDispatchService` — scheduled job (every 30s) that picks up new deals and creates notification rows + sends emails.
   - `EmailService` — Spring Mail + Thymeleaf templates for deal alerts and daily digest.
6. Create email templates in `src/main/resources/templates/`:
   - `deal-alert.html` — instant notification email.
   - `daily-digest.html` — daily summary email.
7. Configure SPA forwarding:
   - Create a `WebConfig` that forwards all non-`/api/**`, non-static-resource paths to `index.html`.
   - Ensure `/api/**` is handled by controllers and everything else falls through to the React app.
8. Configure `application.yml`: database, SMTP settings, notification poll interval, snapshot directory path.
9. Create a Dockerfile for the webapp.
10. Write tests: controller integration tests with MockMvc, service unit tests, notification dispatch tests.

**Key files to reference:** Section 6.3 (WebApp — subsections 6.3.1, 6.3.2, 6.3.5), Section 8 (OpenAPI Contract), Section 9 (Notification Flow).

### Step 5 — WebApp Frontend

**Goal:** React + TypeScript dashboard served from the Spring Boot app.

**Tasks:**
1. Scaffold the React app inside `deal-tracker-webapp/frontend/` using Vite with TypeScript template.
2. Install dependencies: `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `react-router-dom`, `axios`, `sass`.
3. Configure `frontend-maven-plugin` in the webapp `pom.xml`:
   - Install Node/npm.
   - `npm install`.
   - `npm run generate-api` (OpenAPI TypeScript client generation).
   - `npm run build` (Vite build outputting to `../src/main/resources/static/`).
4. Set up OpenAPI client codegen:
   - Add `@openapitools/openapi-generator-cli` as a dev dependency.
   - Create an npm script `generate-api` that generates a TypeScript Axios client from `../src/main/resources/openapi/openapi.yaml` into `src/api/`.
5. Build the layout shell:
   - `AppShell.tsx` — MUI `Drawer` (sidebar) + `AppBar` (topbar) + main content area.
   - `Sidebar.tsx` — navigation links: Dashboard, Sites, Settings.
   - `TopBar.tsx` — app title, `NotificationBell` component with unread badge.
6. Build the Dashboard page:
   - `StatsCards.tsx` — row of MUI `Card` components showing: total sites tracked, active deals count, deals detected today.
   - `ActiveDealsFeed.tsx` — list of active deals with `ConfidenceBadge`, site name, deal summary, time ago, expiry date. Each item links to site detail.
   - `SiteStatusGrid.tsx` — responsive MUI `Grid` of `SiteCard` components showing site name, URL, deal status indicator (green/grey), last checked time.
7. Build the Sites pages:
   - `SitesListPage.tsx` — full list of tracked sites with status, sortable/filterable.
   - `AddSiteDialog.tsx` — MUI `Dialog` with form: URL input, optional name, check interval selector.
   - `SiteDetailPage.tsx` — site info header (name, URL, status, controls: edit/pause/delete) + deal history table using MUI `DataGrid` (columns: type, title, confidence, discount value, detected date, expiry date).
8. Build the notification components:
   - `NotificationBell.tsx` — MUI `Badge` + `IconButton`, polls `/api/v1/notifications/unread-count` every 30 seconds via `usePolling` hook.
   - `NotificationPanel.tsx` — MUI `Popover` or `Drawer` listing recent notifications, mark-as-read on click, "mark all read" button.
9. Build the Settings page:
   - Form for notification preferences: email on/off, in-app on/off, email frequency (instant/daily digest), email address display.
10. Build shared components:
    - `ConfidenceBadge.tsx` — MUI `Chip` colour-coded: green (HIGH), amber (MEDIUM), red (LOW).
    - `DealTypeBadge.tsx` — MUI `Chip` with deal type label and distinct colour per type.
    - `TimeAgo.tsx` — relative time display (e.g. "2h ago", "yesterday").
11. Set up SCSS modules:
    - `_variables.scss` — colour palette, spacing scale, breakpoints.
    - `_mixins.scss` — reusable patterns.
    - `global.scss` — base resets and typography.
    - Per-component `.module.scss` files for layout and custom styling.
12. Set up React Router in `App.tsx`: `/` → Dashboard, `/sites` → Sites list, `/sites/:id` → Site detail, `/settings` → Settings.
13. Create `usePolling.ts` hook — generic interval-based data fetcher for notification count and dashboard refresh.
14. Verify the full build chain: `mvn package` builds the frontend, outputs static assets, and produces a single JAR that serves the SPA and API on one port.

**Key files to reference:** Section 6.3 (WebApp — subsections 6.3.3, 6.3.4, 6.3.6), Section 4 (Shared Tech Stack).

### Step 6 — Docker Compose & Integration

**Goal:** All three modules running together in Docker.

**Tasks:**
1. Create `docker-compose.yml` at project root (see section 10 for structure).
2. Ensure shared volume for snapshots is mounted on both harvester and parser containers.
3. Ensure Flyway migrations run cleanly on first startup (from whichever service starts first).
4. Add a healthcheck for PostgreSQL readiness before services start.
5. Test end-to-end: add a tracked site via the webapp → harvester fetches it → parser detects deals → notification appears in dashboard + email is sent.

**Key files to reference:** Section 10 (Docker & Deployment).

---

## 13. Resolved Decisions

1. **Shared DB vs messaging:** v1 uses a shared database for simplicity. Revisit if throughput demands grow.
2. **Headless rendering:** v1 uses static HTML fetching only. Playwright support planned for v2.
3. **Rate limiting & politeness:** Harvester respects `robots.txt` (cached per domain). Max poll frequency is ~1/hour. Configurable per tracked site.
4. **Deal deduplication:** Content hashing (SHA-256) on the harvester side means the parser only runs when page content has actually changed, which largely eliminates duplicate deal alerts. The parser can further deduplicate by comparing deal signatures within a site.

## 14. Open Questions

1. **Multi-tenancy isolation:** All users share one DB. Row-level security or tenant scoping may be needed if this grows beyond a personal tool.
2. **Hash stability:** Dynamic page elements (timestamps, session tokens, ads) may cause hash changes even when deal content hasn't changed. May need a content normalisation step before hashing.
3. **Authentication:** No auth in v1. Needs to be added before any public-facing deployment.
