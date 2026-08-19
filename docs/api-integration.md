# Swift Doc API Integration & Data Layer

## 1. API Architecture

The frontend communicates with the Swift Doc backend via a centralized, strongly-typed HTTP layer configured in `src/lib/api/client.ts`.

### Base Configuration
* **Axios Instance**: Configured with `baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"`.
* **Headers**: `Content-Type: application/json`, `Accept: application/json`.
* **Credentials**: `withCredentials: true` (for secure HTTP-only refresh cookies when configured).

---

## 2. Standard API Response Contract

All backend responses conform to the standard API envelopes:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [
      { "field": "nationalId", "message": "National ID must be 7-8 digits" }
    ]
  }
}
```

---

## 3. Modular API Service Directory

All endpoints are organized by domain under `src/lib/api/`:

* `auth.ts`: `login`, `register`, `refreshToken`, `logout`, `getCurrentUser`, `forgotPassword`, `resetPassword`.
* `applications.ts`: `getApplications`, `getApplicationById`, `createApplication`, `updateApplicationStatus`, `getTimeline`.
* `services.ts`: `getServices`, `getServiceBySlug`, `getServiceRequirements`.
* `documents.ts`: `uploadDocument`, `getDocuments`, `verifyDocument`, `rejectDocument`.
* `payments.ts`: `getPayments`, `initiateMpesaPayment`, `getReceipt`.
* `government.ts`: `getGovernmentSubmissions`, `updateSubmissionStatus`.
* `notifications.ts`: `getNotifications`, `markAsRead`, `markAllAsRead`.
* `admin.ts`: `getAuditLogs`, `getOperationsMetrics`, `reconcilePayments`.

---

## 4. Automatic Token Refresh & Request Retry Queue

The API client implements an automatic request interceptor:
1. **Request Interceptor**: Attaches `Authorization: Bearer <accessToken>` if present in memory / local storage.
2. **Response Interceptor (401 Handling)**:
   * Catches `401 Unauthorized` responses.
   * Queues concurrent failing requests.
   * Triggers a single refresh request to `/api/v1/auth/refresh`.
   * On success: Updates the stored token, replays all queued requests with the new header.
   * On failure: Clears authentication state and routes user to `/login?session_expired=true`.

---

## 5. TanStack Query Integration Patterns

Server state is retrieved and updated via standard React Query hooks:

```typescript
// Query Pattern
export function useApplications(filters: ApplicationFilters) {
  return useQuery({
    queryKey: ["applications", filters],
    queryFn: () => applicationsApi.getApplications(filters),
    staleTime: 30 * 1000,
  });
}

// Mutation Pattern
export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applicationsApi.createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application successfully submitted");
    },
  });
}
```
