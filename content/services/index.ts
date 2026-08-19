/**
 * Swift Doc — Service SEO Data
 * Static service data for SEO pages. Complements the backend service catalog
 * with rich content that doesn't belong in the database.
 *
 * IMPORTANT: Do not invent services, government integrations, guarantees,
 * certifications, turnaround times, prices, or legal claims that are not
 * supported by the existing system.
 */

export interface ServiceSeoData {
  slug: string;
  name: string;
  seoTitle: string;
  seoDescription: string;
  icon: string; // Lucide icon name
  introduction: string;
  whoIsItFor: string[];
  whatItInvolves: string;
  requirements: string[];
  process: { step: number; title: string; description: string }[];
  governmentBody: string;
  governmentPlatform?: string;
  fees?: { description: string; note?: string }[];
  commonMistakes: string[];
  faqs: { question: string; answer: string }[];
  relatedServices: string[];
  relatedArticles: string[];
}

/* ────────────────────────────────────────────── */

const companyRegistration: ServiceSeoData = {
  slug: "company-registration",
  name: "Company Registration",
  seoTitle: "Company Registration in Kenya | Swift Doc",
  seoDescription:
    "Learn how company registration in Kenya works, the documents required, the BRS registration process, and how Swift Doc helps clients prepare and manage statutory filings.",
  icon: "Building2",
  introduction:
    "Registering a company in Kenya is a statutory requirement for any business operating as a private limited company, public company, or partnership. The process is administered by the Business Registration Service (BRS) through the eCitizen platform. Swift Doc assists clients with preparing the required documentation, conducting name searches, and managing the filing process through to issuance of the Certificate of Incorporation and CR12.",
  whoIsItFor: [
    "Entrepreneurs starting a new limited company in Kenya",
    "Business owners formalizing an existing business",
    "Foreign investors incorporating a Kenyan entity",
    "Professionals forming partnerships or LLPs",
  ],
  whatItInvolves:
    "Company registration involves conducting a name search and reservation on the BRS platform, preparing the memorandum and articles of association, compiling director and shareholder details, and submitting the application through eCitizen. Upon approval, BRS issues a Certificate of Incorporation and a CR12 (company details extract).",
  requirements: [
    "National ID or passport copies for all directors and shareholders",
    "KRA PIN certificates for all directors",
    "Passport-size photos for all directors",
    "Proposed company name (at least 3 options for name search)",
    "Registered office address details",
    "Memorandum and Articles of Association",
    "Share capital structure details",
  ],
  process: [
    { step: 1, title: "Name Search & Reservation", description: "Conduct a company name search on BRS to confirm availability. Reserve the approved name." },
    { step: 2, title: "Document Preparation", description: "Prepare incorporation documents including the memorandum, articles of association, and statutory declarations." },
    { step: 3, title: "Director & Shareholder Details", description: "Collect and verify identification, KRA PINs, and passport photos for all directors and shareholders." },
    { step: 4, title: "eCitizen Application", description: "Submit the incorporation application through the eCitizen portal with all supporting documents." },
    { step: 5, title: "BRS Processing", description: "The Business Registration Service reviews the application. This typically takes several working days." },
    { step: 6, title: "Certificate of Incorporation", description: "Upon approval, BRS issues the Certificate of Incorporation and CR12. Swift Doc delivers these to the client." },
  ],
  governmentBody: "Business Registration Service (BRS)",
  governmentPlatform: "eCitizen",
  fees: [
    { description: "BRS name search fee is payable through eCitizen." },
    { description: "Government incorporation stamp duty and filing fees apply." },
    { description: "Swift Doc charges a professional service fee for preparation and filing assistance.", note: "Contact Swift Doc for current service fee information." },
  ],
  commonMistakes: [
    "Submitting a company name that is already registered or too similar to existing names",
    "Providing inconsistent director details across documents",
    "Missing KRA PIN certificates for directors",
    "Incorrect share capital declarations",
    "Using a residential address without proper authorization for registered office",
  ],
  faqs: [
    { question: "What documents are required for company registration in Kenya?", answer: "You need national IDs or passports for all directors, KRA PINs, passport photos, a proposed company name, registered office address, and details of share capital. Swift Doc assists with preparing all required statutory documents." },
    { question: "How long does company registration take in Kenya?", answer: "Processing times depend on BRS workload and the completeness of your application. Swift Doc monitors the application status and provides updates throughout the process." },
    { question: "What is the difference between a private limited company and a business name?", answer: "A private limited company is a separate legal entity with limited liability for its shareholders, while a business name registration does not create a separate legal entity. Companies require more documentation and have ongoing compliance obligations." },
    { question: "Can foreigners register a company in Kenya?", answer: "Yes. Foreign nationals can incorporate companies in Kenya. Additional documentation such as passports and work permits may be required depending on the nature of involvement." },
    { question: "What happens after company registration?", answer: "After registration, you receive a Certificate of Incorporation and CR12. You will typically need to register for KRA obligations, and depending on your business, register with NSSF and SHA for employee statutory requirements." },
  ],
  relatedServices: [
    "business-name-registration",
    "kra-services",
    "nssf-services",
    "sha-services",
  ],
  relatedArticles: [
    "how-to-register-company-in-kenya",
    "company-registration-requirements-kenya",
  ],
};

const businessNameRegistration: ServiceSeoData = {
  slug: "business-name-registration",
  name: "Business Name Registration",
  seoTitle: "Business Name Registration in Kenya | Swift Doc",
  seoDescription:
    "Register a business name in Kenya through BRS. Learn the requirements, process, costs, and how Swift Doc manages your business name application.",
  icon: "FileText",
  introduction:
    "Business name registration in Kenya is required for sole proprietors and partnerships operating under a trade name. The registration is processed through the Business Registration Service (BRS) via the eCitizen portal. Swift Doc assists with name searches, document preparation, and application filing.",
  whoIsItFor: [
    "Sole proprietors starting a business under a trade name",
    "Partnerships seeking formal registration",
    "Existing informal businesses formalizing their operations",
    "Freelancers and consultants operating under a business name",
  ],
  whatItInvolves:
    "Business name registration involves conducting a name search on the BRS platform, submitting an application with the owner's identification and KRA PIN, and receiving a Business Name Certificate upon approval.",
  requirements: [
    "National ID or passport copy of the owner(s)",
    "KRA PIN certificate of the owner(s)",
    "Passport-size photos",
    "Proposed business name (multiple options recommended)",
    "Business description and nature of activity",
    "Physical business address",
  ],
  process: [
    { step: 1, title: "Name Search", description: "Search and reserve the proposed business name through BRS." },
    { step: 2, title: "Application Preparation", description: "Prepare and compile all required identification and business details." },
    { step: 3, title: "eCitizen Filing", description: "Submit the business name registration application through the eCitizen portal." },
    { step: 4, title: "BRS Review & Approval", description: "BRS reviews the application and issues the Business Name Certificate upon approval." },
  ],
  governmentBody: "Business Registration Service (BRS)",
  governmentPlatform: "eCitizen",
  fees: [
    { description: "BRS name search fee is payable through eCitizen." },
    { description: "Government registration fees apply." },
    { description: "Swift Doc professional service fee for filing assistance.", note: "Contact Swift Doc for current pricing." },
  ],
  commonMistakes: [
    "Choosing a name that is too generic or already in use",
    "Not providing matching details across all documents",
    "Forgetting to renew the business name registration (required periodically)",
  ],
  faqs: [
    { question: "What is the difference between a business name and a company?", answer: "A business name registration does not create a separate legal entity. The owner is personally liable for the business debts. A company registration creates a separate legal entity with limited liability." },
    { question: "How long is a business name registration valid?", answer: "Business name registrations in Kenya are subject to renewal requirements. Check with BRS for current validity periods." },
    { question: "Can I convert a business name to a company later?", answer: "Yes, you can incorporate a company and transfer the business operations. However, this is a separate registration process." },
  ],
  relatedServices: [
    "company-registration",
    "kra-services",
    "business-compliance",
  ],
  relatedArticles: [
    "how-to-register-company-in-kenya",
  ],
};

const kraServices: ServiceSeoData = {
  slug: "kra-services",
  name: "KRA PIN Registration & Services",
  seoTitle: "KRA PIN Registration in Kenya | Swift Doc",
  seoDescription:
    "Get your KRA PIN registered for individuals and businesses. Swift Doc assists with KRA PIN applications, tax obligations setup, and filing requirements.",
  icon: "Award",
  introduction:
    "A KRA PIN (Personal Identification Number) is a mandatory requirement for any individual or entity engaging in taxable activities in Kenya. It is required for employment, business operations, property transactions, and accessing various government services. Swift Doc assists with KRA PIN registration for both individuals and businesses through the iTax platform.",
  whoIsItFor: [
    "Individuals seeking employment or starting a business",
    "Newly registered companies requiring a business KRA PIN",
    "Foreign nationals working or investing in Kenya",
    "Property buyers or sellers",
  ],
  whatItInvolves:
    "KRA PIN registration involves creating an account on the iTax platform, completing the registration application with personal or business details, and submitting the required identification documents. Upon approval, KRA issues the PIN certificate.",
  requirements: [
    "National ID or passport",
    "Passport-size photo",
    "Valid email address and phone number",
    "For business PINs: Certificate of Incorporation or Business Name Certificate",
    "For business PINs: Director details and identification",
  ],
  process: [
    { step: 1, title: "iTax Account Creation", description: "Create an account on the KRA iTax platform." },
    { step: 2, title: "PIN Application", description: "Complete the KRA PIN registration application with all required details." },
    { step: 3, title: "Document Upload", description: "Upload identification and supporting documents as required." },
    { step: 4, title: "PIN Issuance", description: "KRA processes the application and issues the KRA PIN certificate." },
  ],
  governmentBody: "Kenya Revenue Authority (KRA)",
  governmentPlatform: "iTax",
  commonMistakes: [
    "Providing incorrect personal details that don't match identification documents",
    "Not updating KRA registration when business details change",
    "Confusing individual PIN requirements with business PIN requirements",
  ],
  faqs: [
    { question: "What is a KRA PIN used for?", answer: "A KRA PIN is required for tax compliance, employment, business registration, property transactions, customs clearance, and accessing various government services in Kenya." },
    { question: "Can I have more than one KRA PIN?", answer: "No. Each individual or entity should have only one KRA PIN. Duplicate PINs can cause compliance issues." },
    { question: "How do I get a KRA PIN for my company?", answer: "After company registration, you apply for a separate business KRA PIN through iTax using the Certificate of Incorporation and director details." },
  ],
  relatedServices: [
    "tax-compliance",
    "company-registration",
    "business-compliance",
  ],
  relatedArticles: [
    "kra-pin-registration-guide",
    "tax-compliance-certificate-guide",
  ],
};

const taxCompliance: ServiceSeoData = {
  slug: "tax-compliance",
  name: "Tax Compliance Certificate",
  seoTitle: "Tax Compliance Certificate (TCC) in Kenya | Swift Doc",
  seoDescription:
    "Apply for a KRA Tax Compliance Certificate. Learn the requirements, application process, and how Swift Doc assists with TCC applications in Kenya.",
  icon: "CheckCircle",
  introduction:
    "A Tax Compliance Certificate (TCC) is an official document issued by the Kenya Revenue Authority confirming that a taxpayer is compliant with their tax obligations. It is required for government tenders, professional licensing, and various regulatory approvals. Swift Doc assists clients with TCC applications through the KRA iTax platform.",
  whoIsItFor: [
    "Businesses bidding for government tenders and contracts",
    "Professionals applying for or renewing licenses",
    "Individuals and businesses requiring proof of tax compliance",
    "Organizations applying for regulatory approvals",
  ],
  whatItInvolves:
    "Obtaining a TCC requires filing all outstanding tax returns, settling any pending tax liabilities, and submitting an application through the iTax platform. KRA reviews the taxpayer's compliance status before issuing the certificate.",
  requirements: [
    "KRA PIN",
    "All tax returns up to date (income tax, VAT, PAYE as applicable)",
    "No outstanding tax liabilities or payment arrangements in place",
    "Valid contact information registered with KRA",
  ],
  process: [
    { step: 1, title: "Compliance Review", description: "Review and ensure all tax returns are filed and obligations are met." },
    { step: 2, title: "Outstanding Obligations", description: "Address any pending tax returns or liabilities." },
    { step: 3, title: "iTax Application", description: "Submit the TCC application through the iTax portal." },
    { step: 4, title: "KRA Processing", description: "KRA verifies compliance status and processes the certificate." },
    { step: 5, title: "Certificate Issuance", description: "Upon confirmation of compliance, KRA issues the TCC electronically." },
  ],
  governmentBody: "Kenya Revenue Authority (KRA)",
  governmentPlatform: "iTax",
  commonMistakes: [
    "Applying for a TCC before filing all outstanding returns",
    "Having unresolved tax disputes or assessments",
    "Not checking the validity period of a previously issued TCC",
  ],
  faqs: [
    { question: "What is a Tax Compliance Certificate?", answer: "A TCC is a document from KRA confirming that a taxpayer has met their tax obligations. It is commonly required for government tenders, licensing, and regulatory processes." },
    { question: "How long is a TCC valid?", answer: "TCC validity periods are determined by KRA. Check the certificate or contact KRA for current validity information." },
    { question: "What if I have outstanding tax returns?", answer: "You must file all outstanding returns before applying. Swift Doc can assist with the compliance review and filing process." },
  ],
  relatedServices: [
    "kra-services",
    "business-compliance",
    "company-registration",
  ],
  relatedArticles: [
    "tax-compliance-certificate-guide",
    "kra-pin-registration-guide",
  ],
};

const nssfServices: ServiceSeoData = {
  slug: "nssf-services",
  name: "NSSF Employer Registration & Compliance",
  seoTitle: "NSSF Registration for Employers in Kenya | Swift Doc",
  seoDescription:
    "Register as an employer with NSSF Kenya. Learn about employer obligations, monthly contributions, and how Swift Doc manages NSSF compliance.",
  icon: "Shield",
  introduction:
    "The National Social Security Fund (NSSF) requires all employers in Kenya to register and make monthly contributions for their employees. Compliance with NSSF obligations is a statutory requirement. Swift Doc assists employers with NSSF registration, monthly return filing, and compliance management.",
  whoIsItFor: [
    "Employers with one or more employees in Kenya",
    "Newly registered companies hiring staff",
    "Business owners needing NSSF compliance support",
    "HR departments managing statutory returns",
  ],
  whatItInvolves:
    "NSSF employer registration involves creating an employer account with NSSF, registering employees, and setting up monthly contribution remittance. Employers are required to deduct and remit NSSF contributions monthly.",
  requirements: [
    "Certificate of Incorporation or Business Name Certificate",
    "KRA PIN certificate (business)",
    "Directors' identification documents",
    "Employee details for registration",
    "Payroll information for contribution calculation",
  ],
  process: [
    { step: 1, title: "Employer Registration", description: "Register the business as an employer with NSSF." },
    { step: 2, title: "Employee Registration", description: "Register employees under the employer's NSSF account." },
    { step: 3, title: "Contribution Setup", description: "Configure monthly contribution calculations based on current rates." },
    { step: 4, title: "Monthly Remittance", description: "Submit monthly returns and remit contributions by the statutory deadline." },
  ],
  governmentBody: "National Social Security Fund (NSSF)",
  commonMistakes: [
    "Late registration after hiring employees",
    "Incorrect employee details leading to contribution mismatches",
    "Missing monthly remittance deadlines",
    "Not updating employee records when staff changes occur",
  ],
  faqs: [
    { question: "When must an employer register with NSSF?", answer: "Employers are required to register with NSSF when they hire employees. Registration should be completed before the first payroll cycle." },
    { question: "What are the current NSSF contribution rates?", answer: "NSSF contribution rates are set by statute and may change. Contact Swift Doc or check the NSSF website for current rates." },
    { question: "What happens if I miss a monthly NSSF remittance?", answer: "Late remittances may attract penalties and interest as prescribed by NSSF regulations." },
  ],
  relatedServices: [
    "sha-services",
    "business-compliance",
    "kra-services",
  ],
  relatedArticles: [
    "nssf-employer-registration-guide",
    "statutory-compliance-checklist-kenya",
  ],
};

const shaServices: ServiceSeoData = {
  slug: "sha-services",
  name: "SHA Employer Registration & Compliance",
  seoTitle: "SHA Registration for Employers in Kenya | Swift Doc",
  seoDescription:
    "Register as an employer with the Social Health Authority (SHA) in Kenya. Learn about employer health insurance obligations and how Swift Doc assists.",
  icon: "Heart",
  introduction:
    "The Social Health Authority (SHA) manages mandatory health insurance for employees in Kenya. Employers are required to register and make monthly contributions for their employees. Swift Doc assists with SHA employer registration, employee enrollment, and ongoing compliance management.",
  whoIsItFor: [
    "Employers with employees in Kenya",
    "Newly registered businesses setting up payroll",
    "Companies transitioning to SHA compliance",
    "HR departments managing statutory health contributions",
  ],
  whatItInvolves:
    "SHA employer registration involves creating an employer account, registering employees and their dependants, and setting up monthly contribution remittance. Employers must deduct and remit SHA contributions for all eligible employees.",
  requirements: [
    "Certificate of Incorporation or Business Name Certificate",
    "KRA PIN certificate (business)",
    "Directors' identification documents",
    "Employee details including identification and dependant information",
    "Payroll details for contribution calculation",
  ],
  process: [
    { step: 1, title: "Employer Registration", description: "Register the business with SHA as an employer." },
    { step: 2, title: "Employee Enrollment", description: "Register employees and their dependants under the employer account." },
    { step: 3, title: "Contribution Configuration", description: "Set up monthly contribution calculations as per current rates." },
    { step: 4, title: "Monthly Remittance", description: "File monthly returns and remit contributions by the statutory deadline." },
  ],
  governmentBody: "Social Health Authority (SHA)",
  commonMistakes: [
    "Delaying registration after hiring employees",
    "Not registering employee dependants",
    "Inconsistent employee details between SHA and NSSF records",
    "Missing monthly remittance deadlines",
  ],
  faqs: [
    { question: "What is SHA?", answer: "The Social Health Authority (SHA) is the body responsible for managing mandatory health insurance contributions in Kenya, replacing the previous NHIF system." },
    { question: "Are all employers required to register with SHA?", answer: "Employers with eligible employees are required to register and make contributions as mandated by the applicable legislation." },
    { question: "How are SHA contributions calculated?", answer: "Contribution rates are set by statute. Contact Swift Doc or check the SHA guidelines for current rates and calculation methods." },
  ],
  relatedServices: [
    "nssf-services",
    "business-compliance",
    "kra-services",
  ],
  relatedArticles: [
    "statutory-compliance-checklist-kenya",
    "nssf-employer-registration-guide",
  ],
};

const businessCompliance: ServiceSeoData = {
  slug: "business-compliance",
  name: "Business Compliance Services",
  seoTitle: "Business Compliance Services in Kenya | Swift Doc",
  seoDescription:
    "Manage your Kenyan business statutory compliance requirements. Swift Doc handles annual returns, licence renewals, and regulatory filings.",
  icon: "ClipboardCheck",
  introduction:
    "Kenyan businesses are subject to ongoing statutory compliance obligations including annual returns, tax filings, statutory remittances, and licence renewals. Non-compliance can result in penalties, fines, and legal issues. Swift Doc provides comprehensive compliance management to help businesses stay current with their obligations.",
  whoIsItFor: [
    "Registered companies needing annual compliance management",
    "Businesses with multiple statutory obligations",
    "Companies seeking compliance audit and remediation",
    "Startups setting up their compliance framework",
  ],
  whatItInvolves:
    "Business compliance services include reviewing current compliance status, identifying outstanding obligations, filing annual returns with BRS, ensuring tax compliance with KRA, managing NSSF and SHA obligations, and assisting with various regulatory renewals.",
  requirements: [
    "Certificate of Incorporation or Business Name Certificate",
    "KRA PIN certificate",
    "Previous compliance filings and receipts",
    "Current business details and director information",
    "Payroll records (for employer obligations)",
  ],
  process: [
    { step: 1, title: "Compliance Audit", description: "Review the business's current statutory compliance status across all obligations." },
    { step: 2, title: "Gap Identification", description: "Identify outstanding filings, expired licences, and pending obligations." },
    { step: 3, title: "Remediation Filing", description: "Prepare and submit outstanding filings, returns, and applications." },
    { step: 4, title: "Ongoing Management", description: "Set up a compliance calendar and manage future filing deadlines." },
  ],
  governmentBody: "Multiple regulatory bodies (BRS, KRA, NSSF, SHA)",
  commonMistakes: [
    "Not filing annual returns with BRS within the required timeline",
    "Failing to update business details when directors or shareholders change",
    "Not keeping track of multiple compliance deadlines across different agencies",
    "Accumulating penalties from missed filing deadlines",
  ],
  faqs: [
    { question: "What compliance obligations does a Kenyan company have?", answer: "Companies must file annual returns with BRS, maintain tax compliance with KRA, remit NSSF and SHA contributions for employees, and renew applicable business licences. The specific obligations depend on the type and size of the business." },
    { question: "What happens if I miss a compliance deadline?", answer: "Missed deadlines can result in penalties, fines, and in some cases, the business may face legal consequences or lose its good standing. Swift Doc helps monitor and manage deadlines to prevent this." },
    { question: "Can Swift Doc handle all my compliance needs?", answer: "Swift Doc manages statutory filings including BRS returns, KRA compliance, NSSF, and SHA. Contact us to discuss your specific requirements." },
  ],
  relatedServices: [
    "company-registration",
    "kra-services",
    "tax-compliance",
    "nssf-services",
    "sha-services",
  ],
  relatedArticles: [
    "statutory-compliance-checklist-kenya",
  ],
};

/**
 * Complete service catalog for SEO pages.
 * Only includes services that Swift Doc genuinely offers.
 */
export const SERVICE_CATALOG: ServiceSeoData[] = [
  companyRegistration,
  businessNameRegistration,
  kraServices,
  taxCompliance,
  nssfServices,
  shaServices,
  businessCompliance,
];

/**
 * Get a service by slug.
 */
export function getServiceBySlug(slug: string): ServiceSeoData | undefined {
  return SERVICE_CATALOG.find((s) => s.slug === slug);
}

/**
 * Get all service slugs (for generateStaticParams).
 */
export function getAllServiceSlugs(): string[] {
  return SERVICE_CATALOG.map((s) => s.slug);
}
