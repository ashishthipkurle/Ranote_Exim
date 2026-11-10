import { LegalDocument } from "./types";

export const privacyDoc: LegalDocument = {
  version: "1.2.0",
  updatedAt: "November 7, 2026",
  effectiveAt: "November 7, 2026",
  summary: [
    {
      title: "Data Protection & Privacy",
      description: "We protect all business, trade, and personal records with enterprise-grade encryption and strict access controls under DPDP Act 2023 and GDPR.",
      icon: "shield_lock",
    },
    {
      title: "Zero Unauthorized Sharing",
      description: "We never monetize or sell corporate data. Information is shared strictly to execute customs clearance, trade logistics, and escrow settlement.",
      icon: "verified_user",
    },
    {
      title: "Full Account Governance",
      description: "You retain full control to download your compliance records, update corporate entities, revoke consent, or request complete account erasure.",
      icon: "manage_accounts",
    },
  ],
  sections: [
    {
      slug: "introduction",
      title: "Introduction and Scope",
      blocks: [
        "Ranote Exim (\"Ranote\", \"we\", \"us\", or \"our\") operates a premier business-to-business (B2B) digital cross-border trade and export-import platform. We are dedicated to maintaining the confidentiality, integrity, and security of corporate entities, enterprise representatives, and business personnel utilizing our digital ecosystem.",
        "This Privacy Policy outlines how Ranote collects, processes, stores, transfers, and safeguards information obtained through the Ranote Exim platform, associated APIs, customer portals, and related commercial communications. This policy applies to all registered exporters, importers, manufacturers, freight partners, and prospective business visitors across global jurisdictions.",
        "By registering an enterprise account, submitting trade documentation, requesting quotations, or engaging in commercial transactions via Ranote Exim, you acknowledge and agree to the data collection and processing methodologies described herein.",
      ],
    },
    {
      slug: "data-we-collect",
      title: "Information We Collect",
      blocks: [
        "In order to facilitate international commercial transactions and fulfill stringent statutory compliance regulations, we collect several categories of information:",
        {
          type: "bullets",
          items: [
            "Corporate and Entity Verification: Registered legal name, trading brand names, corporate identification numbers (CIN), Tax Identification Numbers (PAN, GSTIN, VAT), Import-Export Codes (IEC), Authorized Economic Operator (AEO) registrations, registered office addresses, and certificates of incorporation.",
            "Authorized Representative Information: Full legal name, official enterprise designation, corporate email address, authorized telephone numbers, passport or government-issued national ID copies for compliance officers and key managerial personnel (KMP).",
            "Commercial and Trade Documentation: Commercial invoices, bills of lading, packing lists, certificates of origin, phytosanitary certifications, material safety data sheets (MSDS), custom brokerage records, and letters of credit.",
            "Financial and Settlement Data: Business bank account details, wire routing codes (SWIFT / BIC / IBAN), escrow arrangement details, transaction histories, and currency preference identifiers.",
            "Technical and System Telemetry: IP addresses, browser fingerprinting, geographical location metrics derived from IP, device architecture, operating system, network connection logs, session recordings, and audit logs of trade approvals.",
          ],
        },
      ],
    },
    {
      slug: "how-we-use-data",
      title: "How We Use Your Information",
      blocks: [
        "All information collected is processed exclusively for bona fide business purposes, including:",
        {
          type: "bullets",
          items: [
            "Execution of Trade Contracts: Generating legally binding purchase orders, quotations, freight forwarding manifests, and milestone-based trade settlement contracts.",
            "Statutory and Regulatory KYC: Performing rigorous anti-money laundering (AML), Know Your Business (KYB), countering financing of terrorism (CFT), and international sanctions screening against OFAC, EU, and UN watchlists.",
            "Customs Processing & Port Logistics: Coordinating customs filings, port authority clearances, sea/air cargo tracking, and electronic data interchange (EDI) transmissions with certified port terminals.",
            "Platform Security & Fraud Prevention: Detecting fraudulent trade listings, unauthorized access attempts, counterfeit product inquiries, and automated credential abuse.",
            "Platform Optimization: Analyzing aggregate trade volumes, tariff efficiency, corridor route bottlenecks, and transaction frequencies to enhance trade execution velocity.",
          ],
        },
      ],
    },
    {
      slug: "legal-basis",
      title: "Legal Bases for Processing",
      blocks: [
        "We process corporate and representative data strictly under recognized international legal doctrines and domestic statutory frameworks, including the Digital Personal Data Protection (DPDP) Act 2023, the Information Technology Act 2000, and the European Union General Data Protection Regulation (GDPR):",
        {
          type: "bullets",
          items: [
            "Performance of a Contract: Processing necessary to execute quotation requests, cross-border purchase orders, escrow releases, and logistical carriage.",
            "Compliance with Legal Obligations: Fulfilling mandatory export-import customs mandates, Reserve Bank of India (RBI) foreign exchange management guidelines (FEMA), tax reporting, and statutory audits.",
            "Legitimate Commercial Interests: Ensuring security across our digital trade corridors, investigating trade disputes, and verifying corporate authenticity.",
            "Explicit Consent: Processing optional marketing communications, non-essential cookies, and opt-in bilateral supplier matchmaking features.",
          ],
        },
      ],
    },
    {
      slug: "cookies",
      title: "Cookies and Tracking Technologies",
      blocks: [
        "Ranote Exim utilizes cookies, local storage mechanisms, and cryptographic session tokens to authenticate enterprise sessions, remember language preferences, and monitor platform performance.",
        {
          type: "bullets",
          items: [
            "Strictly Necessary Cookies: Essential for maintaining authenticated user sessions, cryptographic token verification, and security firewall operations. These cookies cannot be deactivated.",
            "Functional and Preference Cookies: Retain your regional currency selections, preferred port corridors, language settings, and interface scale configurations.",
            "Analytical and Performance Cookies: Gather anonymized operational metrics detailing platform navigation speeds, page latency, and system error rates. These cookies are disabled by default until explicit affirmative consent is granted.",
          ],
        },
        "You may modify or revoke your cookie preferences at any time through our interactive Cookie Settings dialog or via your native browser configuration.",
      ],
    },
    {
      slug: "data-sharing",
      title: "Data Sharing and Cross-Border Transfers",
      blocks: [
        "Ranote Exim does not sell, rent, or lease corporate databases or contact repositories to any third-party marketing broker. We disclose information only to vetted third-party ecosystem participants strictly as required to fulfill international trade mandates:",
        {
          type: "bullets",
          items: [
            "Licensed Customs House Agents (CHAs) and Freight Forwarders: To execute maritime bill of lading issuance, customs clearance, phytosanitary inspection, and port haulage.",
            "Escrow and Institutional Banking Partners: To facilitate certified escrow deposits, SWIFT cross-border remittances, letter of credit verification, and currency exchange settlements.",
            "Regulatory Authorities and Law Enforcement: When compelled by legal process, subpoena, or statutory mandates issued by Directorate General of Foreign Trade (DGFT), Central Board of Indirect Taxes and Customs (CBIC), or competent judicial courts.",
            "Cloud Infrastructure and Security Vendors: ISO 27001 / SOC 2 Type II certified cloud data centers and encrypted database hosting facilities maintaining strict data isolation.",
          ],
        },
        "Cross-border transfers of data outside India or the European Economic Area (EEA) are executed under recognized safeguard mechanisms, including Standard Contractual Clauses (SCCs) and statutory adequacy frameworks.",
      ],
    },
    {
      slug: "retention",
      title: "Data Retention and Security Safeguards",
      blocks: [
        "We implement industry-standard defense-in-depth security architectures, including 256-bit AES encryption at rest, TLS 1.3 encryption in transit, multi-factor authentication (MFA), role-based access control (RBAC), and automated vulnerability assessments.",
        "Trade transaction records, customs declarations, and tax invoices are retained for a statutory duration of seven (7) to ten (10) years in accordance with applicable foreign trade regulations and tax compliance statutes. Following the expiration of statutory retention mandates, records are irreversibly anonymized or securely purged in accordance with our data destruction protocols.",
      ],
    },
    {
      slug: "your-rights",
      title: "Your Rights and Account Governance",
      blocks: [
        "Depending on your legal jurisdiction and applicable data protection legislation (including DPDP Act 2023, GDPR, and CCPA/CPRA), authorized representatives and enterprise data principals possess the following enforceable rights:",
        {
          type: "bullets",
          items: [
            "Right of Access & Portability: Request an export of your enterprise profile, verified trade documents, and transaction logs in a structured machine-readable format.",
            "Right to Rectification: Correct inaccurate or outdated corporate entity details, authorized signatories, or tax identification numbers.",
            "Right to Erasure / Deletion: Request the deletion of personal accounts, subject to statutory retention requirements governing completed customs declarations and active dispute proceedings.",
            "Right to Restrict or Withdraw Consent: Withdraw consent previously granted for non-essential data processing or marketing correspondence.",
            "Right to Nominate: Designate an alternative authorized representative to administer trade accounts in the event of death or incapacity under DPDP statutory rules.",
          ],
        },
        "To exercise any statutory data right, submit a request via Settings > Privacy within your dashboard or communicate directly with our designated Grievance Officer.",
      ],
    },
    {
      slug: "grievance-officer",
      title: "Grievance Redressal and Compliance Inquiries",
      blocks: [
        "In accordance with the Information Technology Act 2000, the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021, and the Digital Personal Data Protection Act 2023, Ranote Exim has appointed a dedicated Grievance Officer.",
        "Any complaints, concerns, or inquiries regarding the processing of data, rights invocation, or security concerns may be directed to our Grievance Officer, who will acknowledge receipt within 24 hours and resolve inquiries within the statutory timeline of fifteen (15) business days.",
      ],
    },
  ],
  contact: {
    title: "Data Protection & Grievance Office",
    note: "For statutory grievances, data access requests, or regulatory audits, contact our designated officer below:",
    officer: {
      name: "Ranjeet Subhash Pote",
      designation: "Chief Legal & Grievance Officer",
      email: "connect@ranoteexim.com",
      address: "Vadarge, Gadhinglaj, Kolhapur, Maharashtra 416502, India",
      phone: "+91 9370366075",
    },
  },
};

