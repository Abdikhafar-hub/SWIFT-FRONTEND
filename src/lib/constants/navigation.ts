/**
 * Swift Doc Role-Aware Navigation Configurations
 * Strictly separated navigation definitions for CLIENT and ADMIN portals.
 */

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string | number;
  description?: string;
  exact?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const CLIENT_NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/client",
        iconName: "LayoutDashboard",
        exact: true,
        description: "Your active filings and pending actions",
      },
    ],
  },
  {
    title: "My Statutory Work",
    items: [
      {
        title: "My Applications",
        href: "/client/applications",
        iconName: "FileText",
        description: "Track status and history of all registrations",
      },
      {
        title: "Action Center",
        href: "/client/actions",
        iconName: "ListTodo",
        description: "Urgent items requiring your attention",
      },
      {
        title: "Service Catalog",
        href: "/client/services",
        iconName: "Grid",
        description: "Explore and start new statutory filings",
      },
    ],
  },
  {
    title: "Documents",
    items: [
      {
        title: "Document Vault",
        href: "/client/documents",
        iconName: "FolderLock",
        description: "Secure storage for verified compliance records",
      },
    ],
  },
  {
    title: "Financials",
    items: [
      {
        title: "Invoices & Payments",
        href: "/client/payments",
        iconName: "CreditCard",
        description: "M-Pesa receipts, balances and issued invoices",
      },
    ],
  },
  {
    title: "Communications",
    items: [
      {
        title: "Notifications",
        href: "/client/notifications",
        iconName: "Bell",
        description: "System updates and SLA milestones",
      },
      {
        title: "Officer Messages",
        href: "/client/messages",
        iconName: "MessageSquare",
        description: "Direct communication with compliance officers",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Profile & Business",
        href: "/client/profile",
        iconName: "User",
        description: "KYC credentials, KRA PIN and contact details",
      },
    ],
  },
];

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    title: "Command Center",
    items: [
      {
        title: "Executive Dashboard",
        href: "/admin",
        iconName: "LayoutDashboard",
        exact: true,
        description: "Operational command center and real-time telemetry",
      },
    ],
  },
  {
    title: "Case Operations",
    items: [
      {
        title: "Work Queue",
        href: "/admin/applications",
        iconName: "FileStack",
        description: "Master statutory application lifecycle and assignment",
      },
      {
        title: "Action Center",
        href: "/admin/actions",
        iconName: "ListTodo",
        description: "Urgent client action directives and blockers",
      },
      {
        title: "SLA Monitor",
        href: "/admin/sla",
        iconName: "Clock",
        description: "Statutory SLA countdowns, health metrics & pause controls",
      },
      {
        title: "Government Registry",
        href: "/admin/government",
        iconName: "Landmark",
        description: "eCitizen, BRS, Ardhi & agency filings tracker",
      },
      {
        title: "Quality Control",
        href: "/admin/qc",
        iconName: "CheckSquare",
        description: "Formal statutory inspection and compliance grading",
      },
      {
        title: "Deliveries",
        href: "/admin/deliveries",
        iconName: "Truck",
        description: "Courier dispatch, tracking numbers & delivery fulfillment",
      },
    ],
  },
  {
    title: "Client Operations",
    items: [
      {
        title: "New Registrations",
        href: "/admin/registrations",
        iconName: "UserPlus",
        description: "Intake review queue for new client accounts and KYC",
      },
      {
        title: "Clients Directory",
        href: "/admin/clients",
        iconName: "Users",
        description: "Verified KYC profiles and business entity dossiers",
      },
      {
        title: "Document Vault",
        href: "/admin/documents",
        iconName: "FileCheck",
        description: "Document review queue, expiry sweeps & certificates",
      },
      {
        title: "Communications",
        href: "/admin/communications",
        iconName: "Radio",
        description: "Direct client messaging and broadcast alerts",
      },
    ],
  },
  {
    title: "Financial Operations",
    items: [
      {
        title: "Invoices Directory",
        href: "/admin/invoices",
        iconName: "DollarSign",
        description: "Commercial ledgers, fee breakdowns and draft invoices",
      },
      {
        title: "Payment Transactions",
        href: "/admin/payments",
        iconName: "CreditCard",
        description: "M-Pesa STK push and bank settlement transactions",
      },
      {
        title: "Statutory Receipts",
        href: "/admin/receipts",
        iconName: "Receipt",
        description: "Official statutory receipts and payment vouchers",
      },
      {
        title: "Refund Claims",
        href: "/admin/refunds",
        iconName: "RotateCcw",
        description: "Refund requests, audit justifications & approvals",
      },
      {
        title: "Adjustments",
        href: "/admin/adjustments",
        iconName: "Sliders",
        description: "Fee waivers, discounts, penalties and corrections",
      },
      {
        title: "Reconciliation",
        href: "/admin/reconciliation",
        iconName: "Scale",
        description: "Daraja M-Pesa statement matching and settlements",
      },
      {
        title: "Aging & Collections",
        href: "/admin/collections",
        iconName: "PieChart",
        description: "Receivables aging buckets and collections analytics",
      },
    ],
  },
  {
    title: "Configuration & Governance",
    items: [
      {
        title: "Services Catalog",
        href: "/admin/services",
        iconName: "Layers",
        description: "Statutory requirements, fees and SLA hours",
      },
      {
        title: "System Alerts",
        href: "/admin/alerts",
        iconName: "AlertTriangle",
        description: "Operational alarms, SLA breaches and failure alerts",
      },
      {
        title: "Audit Trail",
        href: "/admin/audit-trail",
        iconName: "ShieldAlert",
        description: "Immutable statutory audit and access logs",
      },
      {
        title: "Account Settings",
        href: "/admin/settings",
        iconName: "Settings",
        description: "Admin profile, security, and notification preferences",
      },
    ],
  },
];

