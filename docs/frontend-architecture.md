# Swift Doc Frontend Architecture

## 1. Overview & Architectural Philosophy

Swift Doc is an enterprise-grade document processing, compliance, and government-services platform operating in Kenya. The frontend is engineered as a high-trust, resilient, and responsive client and administrative operational portal.

The backend is the sole source of truth. The frontend does not invent business workflows, calculate backend domain state, or introduce speculative features.

---

## 2. Directory Structure

```text
Frontend/
├── .eslintrc.json           # Next.js ESLint configuration
├── next.config.ts           # Next.js production build config
├── package.json             # Core dependencies (React 19, Next 15, Tailwind v4, TanStack Query)
├── postcss.config.mjs       # Tailwind CSS PostCSS plugin
├── tsconfig.json            # Strict TypeScript configuration
├── vitest.config.ts         # Vitest unit test configuration
├── docs/                    # Architectural & system documentation
│   ├── frontend-architecture.md
│   ├── design-system.md
│   ├── api-integration.md
│   └── authentication.md
└── src/
    ├── app/                 # Next.js App Router
    │   ├── layout.tsx       # Root layout with fonts, providers, toast system
    │   ├── providers.tsx    # TanStack Query & AuthProvider wrappers
    │   ├── page.tsx         # Public portal landing redirection
    │   ├── (auth)/          # Authentication routes (login, register, forgot-pw, reset-pw)
    │   ├── client/          # Client portal routes (/client/*)
    │   ├── admin/           # Admin operations routes (/admin/*)
    │   ├── unauthorized/    # 403 Access Denied page
    │   └── not-found.tsx    # 404 Institutional error page
    ├── components/          # Design system & domain components
    │   ├── ui/              # Atom & molecule primitives (Button, Input, Card, Modal, etc.)
    │   ├── layout/          # Shells, Sidebar, Topbar, MobileDrawer
    │   └── domain/          # Reusable domain UI (StatusBadges, Timeline, ActionCard, etc.)
    ├── hooks/               # Custom React hooks (useAuth, etc.)
    ├── lib/
    │   ├── api/             # Typed API services (client, auth, applications, etc.)
    │   ├── auth/            # AuthContext, AuthGuard, token storage
    │   ├── constants/       # Status configurations, navigation definitions, env config
    │   ├── utils/           # Formatters (KES, dates, phone), cn(), error mapper
    │   └── validation/      # Zod validation schemas for forms
    ├── styles/              # Global styles and Tailwind tokens (globals.css)
    ├── test/                # Unit test suites (components, formatters, validation)
    └── types/               # Strict TypeScript definitions matching backend contracts
```

---

## 3. Role-Based Route Architecture

The platform provides strictly separated experiences for the two authoritative roles:

### Public & Authentication Routes
* `/` - Root entry / redirection
* `/login` - Credential-based authentication
* `/register` - Individual & Corporate client onboarding
* `/forgot-password` - Password reset request
* `/reset-password` - Token-verified password reset

### Client Portal (`/client/*`)
* `/client` - Operational Client Dashboard
* `/client/applications` - Application registry with search and status filters
* `/client/applications/[id]` - Comprehensive application detail with milestone timeline
* `/client/services` - Government service catalog (Registration, Tax, Immigration, Licensing)
* `/client/documents` - Repository of uploaded and verified statutory documents
* `/client/payments` - Transaction history and payment receipts (KES)
* `/client/notifications` - Multi-channel alerts and operational updates
* `/client/profile` - Company details, KRA PIN, contact records, security

### Admin Operations Portal (`/admin/*`)
* `/admin` - Operational Executive Command Dashboard
* `/admin/applications` - Operational registry & status management
* `/admin/applications/[id]` - Administrative review, document audit, government reference tracking
* `/admin/clients` - Verified institutional and individual client directory
* `/admin/services` - Catalog & fee management
* `/admin/documents` - Verification queue for uploaded statutory filings
* `/admin/payments` - Invoices, disbursements, and M-Pesa tracking
* `/admin/reconciliation` - Daily transaction and audit reconciliation
* `/admin/notifications` - System broadcast and operational communications
* `/admin/audit` - Immutable operational compliance logs

---

## 4. State Management Architecture

1. **Server State**: Managed exclusively via **TanStack React Query v5**.
   * Caching, background refetching, pagination, query invalidation on mutation.
   * Centralized retry policies (avoids infinite loops on 401, 403, 404).
2. **Session State**: Managed via `AuthContext` (`src/lib/auth/auth-context.tsx`).
   * Stores current user profile and authentication status in memory.
   * Hydrates token from secure storage.
3. **UI State**: Handled locally via standard React hooks (`useState`, `useReducer`, URL query params for table filtering).

---

## 5. Security & Boundary Enforcement

* **Backend Authoritative**: The frontend never authorizes privileged actions; all mutations and data queries are validated against the backend JWT claims.
* **Route Guards (`AuthGuard`)**: Intercepts unauthenticated users and redirects them to `/login?returnUrl=...`. Blocks unauthorized roles from accessing respective shells (e.g. `CLIENT` attempting `/admin/*` is routed to `/unauthorized`).
* **Safe Error Handling**: Internal backend stack traces and Prisma internals are intercepted by `parseApiError` and translated into clear institutional messages.
