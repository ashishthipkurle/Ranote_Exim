import { LegalDocument } from "./types";

export const termsDoc: LegalDocument = {
  version: "1.2.0",
  updatedAt: "November 7, 2026",
  effectiveAt: "November 7, 2026",
  summary: [
    {
      title: "Verified Commercial Entities",
      description: "Ranote Exim is exclusively a B2B trade network. All exporters and importers must pass strict KYB verification, entity authentication, and sanctions checks.",
      icon: "verified",
    },
    {
      title: "Incoterms & Contractual Certainty",
      description: "All quotations, purchase orders, and trade transactions are governed by ICC Incoterms® 2020 rules and legally binding digital trade contracts.",
      icon: "gavel",
    },
    {
      title: "Protected Escrow & Settlement",
      description: "Milestone funds, trade finance guarantees, and letters of credit are administered through authorized banking and escrow institutions for mutual protection.",
      icon: "account_balance",
    },
  ],
  sections: [
    {
      slug: "acceptance",
      title: "Acceptance of Terms and Agreement to Trade",
      blocks: [
        "These Terms and Conditions (\"Terms\", \"Agreement\") constitute a legally binding commercial agreement entered into between Ranote Exim (\"Ranote\", \"Platform Operator\", \"we\", \"us\") and the commercial entity, enterprise, proprietorship, or authorized representative (\"User\", \"Trader\", \"Exporter\", \"Importer\", \"You\") accessing or utilizing the digital platform, trade APIs, and trade execution services hosted at ranote-exim.com and affiliated domains.",
        "By registering an enterprise account, clicking an affirmative acceptance checkbox, submitting commercial product listings, negotiating quotation agreements, or issuing purchase orders, you explicitly warrant that you possess full corporate capacity and executive authority to bind your legal entity to these Terms.",
        "If you do not possess such legal authority, or if you or your entity do not agree with each term and condition herein, you are strictly prohibited from accessing or transacting on the Ranote Exim platform.",
      ],
    },
    {
      slug: "eligibility",
      title: "Enterprise Eligibility and Verification",
      blocks: [
        "Ranote Exim operates strictly as an institutional and enterprise business-to-business (B2B) cross-border trade platform. The platform is not intended for consumer retail shopping (B2C) or individual private commerce.",
        {
          type: "bullets",
          items: [
            "Corporate Registration: You must be a validly incorporated company, registered partnership, statutory trade cooperative, or registered enterprise under the laws of your domestic jurisdiction.",
            "Statutory Trade Credentials: Valid Import-Export Code (IEC) issued by the Directorate General of Foreign Trade (DGFT) in India, or equivalent national foreign trade registration credentials in international destination jurisdictions.",
            "Tax & Regulatory Compliance: Valid Goods and Services Tax Identification Number (GSTIN), Permanent Account Number (PAN), VAT ID, or Federal Employer Identification Number (EIN).",
            "Sanctions & Anti-Corruption Adherence: You warrant that neither your enterprise, its beneficial owners, directors, nor associated entities are listed on international sanctions lists (OFAC, UN, EU, UK HMT) or engaged in prohibited restricted goods commerce.",
          ],
        },
        "Ranote reserves the unilateral right to suspend, terminate, or deny account verification for any entity failing to supply verifiable statutory documentation.",
      ],
    },
    {
      slug: "account-security",
      title: "Account Security and Corporate Signatories",
      blocks: [
        "Authorized account administrators are solely responsible for safeguarding corporate login credentials, API secrets, multi-factor authentication (MFA) devices, and digital signing keys.",
        "All purchase orders, quotation acceptances, freight confirmations, and communications generated through your authenticated accounts are legally attributable to your corporate enterprise. You must notify Ranote immediately in writing upon detecting unauthorized credential usage or security compromise.",
      ],
    },
    {
      slug: "marketplace-rules",
      title: "Marketplace Rules and Product Listing Standards",
      blocks: [
        "Exporters and suppliers listing products within the Ranote Exim directory and marketplace warrant that all specifications, photographic assets, laboratory test certificates, and price indications are accurate, authentic, and non-misleading.",
        {
          type: "bullets",
          items: [
            "Prohibited Commodities: Counterfeit goods, weapons, restricted hazardous chemicals without valid MSDS, endangered wildlife products, narcotic substances, or goods violating international intellectual property rights are strictly banned.",
            "Quality Certifications: Exporters listing agricultural, textile, pharmaceutical, or industrial engineering products must upload genuine certifications (e.g., FSSAI, ISO, CE, FDA, Phytosanitary, Halal, Kosher) as applicable.",
            "Fair Commercial Dealing: Price fixing, collusion, fake quotation inquiries, deceptive quantity bidding, and circumventing platform escrow protocols are strictly prohibited.",
          ],
        },
      ],
    },
    {
      slug: "orders-and-contracts",
      title: "Purchase Orders, Quotations, and Trade Contracts",
      blocks: [
        "When an Importer issues an automated Request for Quotation (RFQ) and an Exporter submits a formal Proforma Invoice or Quote via Ranote Exim, the electronic execution and counter-signing of that document constitutes a valid, enforceable international sales contract.",
        "Unless expressly modified in the signed trade contract, all international transactions on Ranote Exim incorporate and are governed by the International Chamber of Commerce (ICC) Incoterms® 2020 rules specified in the order (such as FOB, CIF, CFR, EXW, or DDP).",
        "Parties are legally bound to supply the designated quality, quantity, and packaging standards articulated in the signed Bill of Quantities and Technical Specifications schedule.",
      ],
    },
    {
      slug: "payments-and-escrow",
      title: "Payment Protocols, Escrow Settlement, and Fees",
      blocks: [
        "To safeguard bilateral trade execution, Ranote Exim integrates certified institutional escrow services, international wire routing, and Letter of Credit (LC) tracking mechanisms.",
        {
          type: "bullets",
          items: [
            "Escrow Releases: Buyer advance payments deposited into platform escrow are locked and disbursed to the Exporter only upon verified inspection milestones (e.g., SGS / Bureau Veritas pre-shipment inspection, Clean On-Board Bill of Lading verification, or Port Customs clearance).",
            "Platform Fees: Platform intermediary commission, transaction fees, and verification costs are clearly disclosed prior to order confirmation and deducted upon settlement in accordance with our fee schedule.",
            "Currency and Foreign Exchange: Invoices are denominated in specified trade currencies (USD, EUR, INR, AED). Traders are solely responsible for local currency foreign exchange variances and bank intermediary wire fees.",
          ],
        },
      ],
    },
    {
      slug: "shipping-and-incoterms",
      title: "Freight Carriage, Customs, and Risk Transfer",
      blocks: [
        "Risk of loss and damage transfers between Exporter and Importer strictly according to the agreed Incoterms® 2020 delivery rule.",
        "Both parties are responsible for securing appropriate Marine and Air Cargo insurance coverage for the voyage duration unless the selected Incoterm assigns insurance obligation to a specific party (e.g., CIF, CIP).",
        "Neither Ranote Exim nor participating freight forwarders assume liability for maritime delays caused by severe weather, force majeure, general average, port congestion, sovereign customs embargoes, or demurrage fees incurred due to delayed document processing by the consignee.",
      ],
    },
    {
      slug: "disputes-and-arbitration",
      title: "Dispute Resolution and Commercial Arbitration",
      blocks: [
        "In the event of a commercial dispute regarding product quality, cargo damage, or non-delivery, the parties agree to first engage in good-faith platform mediation facilitated by the Ranote Trade Arbitration Desk within thirty (30) calendar days of notice.",
        "If informal mediation fails to resolve the dispute, all claims, controversies, or disputes arising out of or in connection with these Terms or any transaction executed on Ranote Exim shall be referred to and finally resolved by commercial arbitration administered by the Mumbai Centre for International Arbitration (MCIA) or the Singapore International Arbitration Centre (SIAC) under its Arbitration Rules in force at the time of commencement.",
        "The tribunal shall consist of one (1) sole arbitrator mutually appointed by the parties. The seat and legal place of arbitration shall be Mumbai, India. The language of arbitration proceedings, evidentiary submissions, and award decrees shall be English.",
      ],
    },
    {
      slug: "intellectual-property",
      title: "Intellectual Property and Proprietary Rights",
      blocks: [
        "All software, UI architectures, brand designs, trade algorithms, analytics dashboards, and documentation comprising Ranote Exim are the exclusive intellectual property of Ranote Exim and its licensors, protected by copyright, trademark, and trade dress laws.",
        "Traders retain ownership of their proprietary company trademarks, logos, and uploaded product catalog media, granting Ranote a worldwide, non-exclusive, royalty-free license to display and distribute such content solely to market and execute trade on the platform.",
      ],
    },
    {
      slug: "limitation-of-liability",
      title: "Limitation of Liability and Indemnification",
      blocks: [
        "Ranote Exim acts as a digital trade intermediary and enterprise platform infrastructure provider. Except where prohibited by law, in no event shall Ranote Exim, its directors, officers, employees, or affiliates be liable for indirect, punitive, incidental, special, consequential, or punitive damages, including loss of profits, commercial interruption, loss of cargo, or loss of goodwill.",
        "The total aggregate liability of Ranote Exim arising out of or related to platform utilization shall not exceed the total platform commission fees actually received by Ranote for the specific transaction giving rise to the claim in the twelve (12) months preceding the dispute.",
        "You agree to defend, indemnify, and hold harmless Ranote Exim from and against any third-party claims, liabilities, damages, and expenses (including reasonable attorneys' fees) arising out of your violation of these Terms, product defect, customs infraction, or violation of applicable law.",
      ],
    },
    {
      slug: "governing-law",
      title: "Governing Law and Jurisdiction",
      blocks: [
        "These Terms and Conditions, and any non-contractual obligations arising out of or in connection with them, shall be governed by and construed in accordance with the substantive laws of the Republic of India, without regard to conflict of laws principles.",
        "Subject to the dispute resolution and arbitration provisions set forth in Section 8, the courts of competent jurisdiction situated in Mumbai, Maharashtra, India shall have exclusive supervisory jurisdiction over all legal proceedings arising hereunder.",
      ],
    },
    {
      slug: "grievance-and-notices",
      title: "Legal Notices and Corporate Inquiries",
      blocks: [
        "All formal legal notices, arbitration communications, and statutory inquiries directed to Ranote Exim must be transmitted in writing via certified courier and email to our designated legal department:",
      ],
    },
  ],
  contact: {
    title: "Legal & Regulatory Compliance Office",
    note: "For corporate legal correspondence, contract notices, or arbitration service, address our legal bureau below:",
    officer: {
      name: "Ranjeet Subhash Pote",
      designation: "Chief Legal & Grievance Officer",
      email: "connect@ranoteexim.com",
      address: "Vadarge, Gadhinglaj, Kolhapur, Maharashtra 416502, India",
      phone: "+91 9370366075",
    },
  },
};

