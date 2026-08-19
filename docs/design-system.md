# Swift Doc Design System & Visual Specification

## 1. Visual Philosophy & Brand Identity

Swift Doc is an established Kenyan document processing and statutory services institution. The visual design reflects:
* **Institutional Credibility**: Precise, crisp borders and structured grids rather than floating amorphous shapes.
* **Executive Character**: Deep royal blue primary palette with rich ink/navy surfaces and warm gold accents.
* **Kenyan Context**: Clean formatting for Kenya Shillings (KES), Kenyan telephone numbers (+254), national IDs, and KRA PIN numbers.

---

## 2. Color Palette & Design Tokens

### Primary Palette
* **Deep Royal Navy**: `#0B192C` (Primary background for dark accents, header highlights, and brand badges)
* **Corporate Slate**: `#1E3E62` (Secondary brand shade for structural headers)
* **Warm Gold Accent**: `#C59B27` / `#D4AF37` (Exclusively used for active nav indicators, milestones, status accents, and badges)
* **Emerald Supporting Accent**: `#10B981` (Completed state, positive financial ledger, verified documents)
* **Warm Neutral Background**: `#FBFBFA` (Light mode background providing a warm, paper-like institutional feel)
* **Subtle Hairline Borders**: `rgba(15, 23, 42, 0.08)` (Crisp borders providing subtle structure)

---

## 3. Typography System

* **Display / Headings**: `Plus Jakarta Sans` — Used for page titles, modal headers, and metric statistics.
* **Body / Operational Data**: `Manrope` — Used for body copy, data tables, form inputs, metadata badges, and timelines.

### Scale & Hierarchy
* `h1`: 2.25rem (36px), Bold, `-0.025em` tracking
* `h2`: 1.875rem (30px), Semi-bold, `-0.02em` tracking
* `h3`: 1.5rem (24px), Semi-bold, `-0.015em` tracking
* `h4`: 1.25rem (20px), Medium
* `body-lg`: 1.125rem (18px)
* `body`: 1rem (16px)
* `body-sm`: 0.875rem (14px)
* `caption`: 0.75rem (12px), Medium uppercase tracking

---

## 4. Design System Component Catalog

### Layout & Containers
* `PageShell`: Enforces consistent page max-width, padding, and responsive margins.
* `PageHeader`: Structured page title, subtitle, breadcrumb, and primary action bar.
* `Section`: Logical content partitioning with optional header and description.
* `Card`: Clean bordered container with subtle elevation and header/body/footer divisions.
* `StatCard`: Operational metric display with trend indicators and status coloring.

### Actions
* `Button`: Variants: `primary` (navy), `gold` (accent), `secondary` (slate), `outline`, `ghost`, `danger`.
* `IconButton`: Accessible action button with tooltip support.
* `LinkButton`: Styled anchor tag integrating with Next.js navigation.

### Form Primitives
* `FormField`: Accessible wrapper binding labels, hints, error text, and required indicators.
* `Input`: Text, email, password, number inputs with prefix/suffix slot support.
* `Select`: Native and Radix-backed dropdown selects with full keyboard navigation.
* `Checkbox` / `Radio`: Accessible selection controls with custom brand styling.
* `Textarea`: Multi-line input with auto-resize and character limit options.
* `FileUpload`: Cloudinary-ready drag & drop zone with progress indicators and MIME verification.

### Feedback & Status
* `StatusBadge`: Semantic badge supporting all 16 backend application lifecycle states.
* `DocumentStatusBadge`: Distinct visual badges for `PENDING`, `VERIFIED`, `REJECTED`.
* `PaymentStatusBadge`: Formats `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`.
* `Alert`: Dismissible inline alerts (success, error, warning, info).
* `Skeleton`: Pulsing placeholders matching table, card, and text line layouts.
* `EmptyState`: Contextual illustration, explanation, and clear primary action.
* `ErrorState`: Institutional recovery card with retry trigger.

### Overlays & Navigation
* `Sidebar`: Role-aware persistent desktop navigation and collapsible drawer.
* `Topbar`: Clean header housing breadcrumbs, notification bell, and user menu.
* `MobileDrawer`: One-handed touch-optimized navigation sheet for client mobile viewports.
* `Modal`: Accessible dialog supporting focus trap, escape dismiss, and action footer.

---

## 5. Responsive Viewport Support

The design system is engineered and tested across standard device breakpoints:
* **Mobile (360px – 414px)**: Single column, bottom drawer navigation, optimized touch targets (min 44px).
* **Tablet (768px – 1024px)**: Collapsible sidebar, responsive table cards.
* **Desktop (1280px – 1920px)**: Multi-column executive operational layouts, full data tables.
