# Swift Doc Authentication & Authorization Architecture

## 1. Authentication Architecture

The Swift Doc frontend implements a dual-token JWT authentication flow aligned with the hardened backend security model.

### Roles
The platform supports exactly two authoritative roles:
1. `CLIENT` — External individual or business applicant submitting documents and tracking statutory applications.
2. `ADMIN` — Internal Swift Doc operations officer managing client files, performing audits, verifying documents, and recording government progress.

---

## 2. Authentication Lifecycle

```text
User Credentials
      │
      ▼
POST /api/v1/auth/login
      │
      ├──> Returns: { accessToken, refreshToken, user: { id, email, role, ... } }
      │
      ▼
AuthContext hydrates session
      │
      ├──> Role is CLIENT: Redirect to /client
      └──> Role is ADMIN: Redirect to /admin
```

---

## 3. Session Persistence & Refresh Mechanism

1. **Access Token**: Stored securely in client memory and encrypted session storage for fast API header injection.
2. **Refresh Token**: Stored in HTTP-only cookie or secure storage for rotating session renewal.
3. **Session Rehydration**:
   * On initial page load, `AuthProvider` initializes and queries `GET /api/v1/auth/me`.
   * If valid, session state is populated.
   * If expired, refresh is attempted before clearing state.

---

## 4. Protected Route Guards (`AuthGuard`)

Routes under `src/app/client/` and `src/app/admin/` are wrapped with `AuthGuard`:

* **Unauthenticated Access**: User is immediately redirected to `/login` with `returnUrl` preserved.
* **Role Mismatch (e.g. `CLIENT` trying `/admin`)**: User is blocked and redirected to `/unauthorized` (403 Forbidden).
* **Admin Accessing Client Routes**: Redirected back to `/admin` to prevent state corruption.

---

## 5. Security Principles

* **No Secret Exposure**: Frontend never accesses or bundles `JWT_SECRET`, `DATABASE_URL`, or payment provider secrets.
* **Zero Trust Client**: UI role checks are strictly for navigational routing and UX. All backend endpoints enforce database-backed authorization.
* **Token Sanitation**: Tokens and passwords are never logged to console or included in error tracking payloads.
