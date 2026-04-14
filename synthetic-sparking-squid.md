# Invoice Management App — Furniture/Carpentry Business

## Context

Build a full-stack invoice management application for a carpentry/furniture business (see `sample_invoice.pdf`). The PDF shows a warm peach-colored bill format with:
- Business owner header (name, phone, email) | "Bill" title
- Due Balance banner (peach background) with date
- Items table with complex rate formulas (e.g., "28 x 2 x 190 = 10,640", "rupees/sq.ft", "rupees/lock")
- Footer: Total / Paid / Due rows with peach cell backgrounds
- Flat-amount items (no rate/qty) and formula-based items coexist

Target directory: `/home/ramlal/mycode/claude/` (currently empty)

---

## Folder Structure

```
/home/ramlal/mycode/claude/
├── backend/
│   ├── main.go
│   ├── go.mod
│   ├── .env / .env.example
│   ├── Dockerfile
│   ├── config/
│   │   ├── config.go           # Typed config struct from env
│   │   └── database.go         # MongoDB connection + retry logic
│   ├── models/
│   │   ├── user.go
│   │   ├── invoice.go          # Invoice + InvoiceItem structs with BSON tags
│   │   └── token.go            # RefreshToken struct
│   ├── handlers/
│   │   ├── auth.go             # Register, Login, Refresh, Logout, Me
│   │   ├── invoice.go          # CRUD + search + filter
│   │   ├── pdf.go              # Generate + Download PDF
│   │   ├── share.go            # Email + WhatsApp
│   │   └── user.go             # Admin user management
│   ├── middleware/
│   │   ├── auth.go             # JWT Bearer validation, attaches user to ctx
│   │   ├── role.go             # AdminOnly()
│   │   ├── cors.go
│   │   └── ratelimit.go        # 10 req/min on auth endpoints
│   ├── services/
│   │   ├── auth_service.go     # bcrypt + JWT sign/verify + token rotation
│   │   ├── invoice_service.go  # Business logic, due calculation, status
│   │   ├── pdf_service.go      # fpdf layout engine (peach color scheme)
│   │   └── share_service.go    # SMTP email + Twilio/WATI WhatsApp
│   ├── repository/
│   │   ├── user_repo.go
│   │   ├── invoice_repo.go     # Queries + atomic invoice number counter
│   │   └── token_repo.go       # Refresh token storage/rotation
│   ├── routes/
│   │   └── routes.go
│   ├── utils/
│   │   ├── response.go         # Standardized JSON helpers
│   │   ├── validator.go
│   │   └── invoice_number.go   # INV-{YEAR}-{SEQ} generation
│   └── storage/pdfs/           # Generated PDFs (gitignored)
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts          # Proxy /api → localhost:8080
│   ├── tailwind.config.js      # Custom peach palette
│   └── src/
│       ├── api/
│       │   ├── axiosInstance.ts  # Interceptors: inject token, 401 refresh retry
│       │   ├── authApi.ts
│       │   ├── invoiceApi.ts
│       │   └── shareApi.ts
│       ├── components/
│       │   ├── layout/           # AppShell, Sidebar, TopBar, ProtectedRoute
│       │   ├── auth/             # LoginForm, RegisterForm
│       │   ├── invoice/
│       │   │   ├── InvoiceForm.tsx     # Create/Edit (dynamic rows, live calc)
│       │   │   ├── ItemRow.tsx         # Single editable item row
│       │   │   ├── InvoiceList.tsx
│       │   │   ├── InvoiceCard.tsx
│       │   │   ├── InvoicePreview.tsx  # HTML replica of PDF layout
│       │   │   └── InvoiceSearch.tsx   # q + date range + status filter
│       │   ├── share/            # ShareModal, EmailForm, WhatsAppButton
│       │   └── ui/               # Button, Input, Modal, Table, Badge, Spinner
│       ├── pages/                # LoginPage, DashboardPage, InvoiceListPage,
│       │                         # InvoiceCreatePage, InvoiceEditPage,
│       │                         # InvoiceDetailPage, AdminUsersPage
│       ├── store/
│       │   ├── authStore.ts      # Zustand: user, accessToken (memory only)
│       │   ├── invoiceStore.ts   # Zustand: list, current invoice, filters
│       │   └── uiStore.ts        # Zustand: modal state, toasts
│       ├── hooks/                # useAuth, useInvoices, useInvoiceForm, useDebounce
│       ├── types/                # auth.types.ts, invoice.types.ts, api.types.ts
│       └── utils/
│           ├── calculateItem.ts  # Safe formula parser ("28 x 2 x 190" → number)
│           ├── formatCurrency.ts # INR with ₹ symbol
│           └── dateHelpers.ts
│
├── docker-compose.yml
└── README.md
```

---

## MongoDB Schemas

### `users`
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique indexed)",
  "password_hash": "string (bcrypt, never returned)",
  "role": "'admin' | 'user' (default: user)",
  "is_active": "bool (default: true)",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

### `refresh_tokens`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "token_hash": "string (SHA-256, unique indexed)",
  "expires_at": "ISODate (TTL index for auto-cleanup)",
  "revoked": "bool (default: false)"
}
```

### `invoices`
```json
{
  "_id": "ObjectId",
  "invoice_number": "string (e.g. INV-2025-0042, unique indexed)",
  "created_by": "ObjectId",
  "business": { "name": "", "phone": "", "email": "" },
  "bill_to": { "name": "", "phone": "", "address": "" },
  "date": "ISODate",
  "items": [
    {
      "description": "string",
      "rate": "number | null",
      "rate_unit": "string (e.g. rupees/ft)",
      "quantity": "number | null",
      "dimensions": { "length": "number | null", "width": "number | null" },
      "formula": "string (e.g. '28 x 2 x 190')",
      "amount": "number"
    }
  ],
  "total": "number",
  "paid": "number (default: 0)",
  "due": "number (= total - paid)",
  "status": "'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue'",
  "pdf_path": "string (cleared on edit → signals stale)",
  "notes": "string",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

### `counters` (atomic invoice numbering)
```json
{ "_id": "invoice_seq_2025", "seq": 42 }
```
Use `findOneAndUpdate` with `$inc` + `upsert: true` — race-condition-safe.

---

## API Endpoints

### Auth `/api/v1/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | None | Register new user |
| POST | `/login` | None | Returns access token + sets refresh cookie |
| POST | `/refresh` | Cookie | Issue new access token (rotate refresh) |
| POST | `/logout` | Bearer | Revoke refresh token |
| GET | `/me` | Bearer | Current user profile |

### Users `/api/v1/users` (admin only)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all users |
| PATCH | `/:id` | Update role / is_active |
| DELETE | `/:id` | Delete user |

### Invoices `/api/v1/invoices`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Bearer | List with `?q=&status=&from=&to=&page=&limit=` |
| POST | `/` | Bearer | Create |
| GET | `/:id` | Bearer | Get single |
| PUT | `/:id` | Bearer (owner\|admin) | Full update |
| PATCH | `/:id/payment` | Bearer (owner\|admin) | Update paid amount |
| DELETE | `/:id` | Bearer (admin) | Delete |
| POST | `/:id/pdf/generate` | Bearer | Generate/regenerate PDF file |
| GET | `/:id/pdf/download` | Bearer | Stream PDF as attachment |
| POST | `/:id/share/email` | Bearer | Send PDF via email |
| POST | `/:id/share/whatsapp` | Bearer | Send via Twilio/WATI |
| GET | `/stats` | Bearer (admin) | Dashboard aggregates |
| GET | `/health` | None | DB ping |

---

## Key Libraries

### Backend (Go)
| Package | Purpose |
|---------|---------|
| `github.com/gin-gonic/gin` | HTTP router |
| `go.mongodb.org/mongo-driver/mongo` | MongoDB driver |
| `github.com/golang-jwt/jwt/v5` | JWT (HS256, 15m access / 7d refresh) |
| `golang.org/x/crypto/bcrypt` | Password hashing (cost 12) |
| `github.com/go-pdf/fpdf` | PDF generation — direct `SetFillColor` control for peach layout |
| `gopkg.in/gomail.v2` | SMTP email with PDF attachment |
| `github.com/joho/godotenv` | Load `.env` |
| `go.uber.org/zap` | Structured logging |
| `github.com/ulule/limiter/v3` | Rate limiting |

### Frontend (React)
| Package | Purpose |
|---------|---------|
| `vite` + TypeScript | Build tooling |
| `tailwindcss` | Styling (custom peach palette: `#f5c6a0`) |
| `zustand` | Auth/UI state |
| `@tanstack/react-query` | Server state (invoices list, caching) |
| `react-router-dom v6` | Routing |
| `axios` | HTTP client with interceptors |
| `react-hook-form` + `zod` | Form validation |
| `react-datepicker` | Date range filter |

---

## Security Architecture

- **Access tokens**: HS256 JWT, 15-min expiry, stored **in memory only** (never localStorage)
- **Refresh tokens**: SHA-256 hashed in DB, delivered as `httpOnly; Secure; SameSite=Strict` cookie
- **Token rotation**: Each refresh revokes old token, issues new one
- **Role enforcement**: `AdminOnly` middleware at route level, not in handlers
- **bcrypt**: Cost factor 12 (~300ms)
- **Rate limiting**: 10 req/min per IP on `/auth/login` and `/auth/register`
- **PDF access**: Requires valid JWT — no public URLs for generated files

---

## PDF Generation Detail (`pdf_service.go`)

Using `go-pdf/fpdf` to exactly replicate sample invoice layout:

1. A4 page, 15mm margins
2. **Header**: `CellFormat` — business name/phone/email (left), bold "Bill" large text (right)
3. **Due Banner**: `SetFillColor(245, 198, 160)` peach fill — "Due Balance ₹ X" bold (left), "Date:" (right)
4. **Bill To**: Simple label + customer name
5. **Items Table**:
   - Header row: peach fill, columns: Description | Rate | Quantity | Amount(INR)
   - Body rows: white, alternating cells with formula text in description if present
   - Multi-line cells for long descriptions with `MultiCell`
6. **Footer rows**: Total / Paid / Due — peach fill on amount column cells
7. Save to `PDF_STORAGE_PATH/{invoice_number}.pdf`
8. Set `pdf_path` + `pdf_generated_at` in invoice document

---

## Formula Parser (`calculateItem.ts`)

Safe client-side evaluator (no `eval`) for expressions like `"28 x 2 x 190"`:
- Tokenize on `x` separator
- Parse each token as float
- Multiply all values
- Return result (or NaN on invalid input, shown as error in ItemRow)

---

## Implementation Phases

| Phase | Scope | Output |
|-------|-------|--------|
| 1 | Backend auth (JWT, bcrypt, token rotation, rate limiting) + Frontend login/register/protected routes | Full auth flow |
| 2 | Invoice CRUD (backend repo + handlers + routes) + Frontend form with dynamic rows + live formula calculation | Create, edit, list, delete |
| 3 | PDF generation (fpdf, peach layout matching sample) + Download endpoint | PDF generation |
| 4 | Email sharing (gomail SMTP) + WhatsApp (Twilio/WATI) + ShareModal UI | Invoice sharing |
| 5 | Admin users page + Dashboard stats + Polish (toasts, skeletons, error boundaries, mobile) | Production-ready UI |
| 6 | Dockerfiles + docker-compose + MongoDB index setup + README | Deployment-ready |

---

## docker-compose.yml (Local Dev)

```yaml
version: "3.9"
services:
  mongo:
    image: mongo:7.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: changeme
      MONGO_INITDB_DATABASE: invoice_app
    volumes: [mongo_data:/data/db]
    ports: ["27017:27017"]
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s; retries: 5

  backend:
    build: ./backend
    env_file: ./backend/.env
    environment:
      MONGO_URI: mongodb://admin:changeme@mongo:27017/invoice_app?authSource=admin
    ports: ["8080:8080"]
    volumes: [pdf_storage:/app/storage/pdfs]
    depends_on: {mongo: {condition: service_healthy}}

  frontend:
    build: ./frontend
    ports: ["5173:80"]
    depends_on: [backend]

volumes:
  mongo_data:
  pdf_storage:
```

---

## Verification Plan

1. `docker-compose up` — all 3 services start, backend logs "Connected to MongoDB"
2. Register user → Login → receive access token + refresh cookie
3. Create invoice with mixed items (formula-based + flat-amount) → verify `due = total - paid`
4. Generate PDF → download → confirm peach layout matches `sample_invoice.pdf`
5. Filter invoices by date range and invoice ID
6. Share via email → verify attachment received
7. Admin: change user role → verify regular user cannot delete invoices
8. Logout → refresh token rejected → re-login required
