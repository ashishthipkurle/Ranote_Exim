export interface LegalBlockBullets {
  type: "bullets";
  items: string[];
}

export type LegalBlock = string | LegalBlockBullets;

export interface LegalSection {
  slug: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalSummaryItem {
  title: string;
  description: string;
  icon?: string;
}

export interface GrievanceOfficer {
  name: string;
  designation: string;
  email: string;
  address: string;
  phone?: string;
}

export interface LegalDocument {
  version: string;
  updatedAt: string;
  effectiveAt: string;
  summary: [LegalSummaryItem, LegalSummaryItem, LegalSummaryItem];
  sections: LegalSection[];
  contact: {
    title: string;
    note: string;
    officer: GrievanceOfficer;
  };
}

