import { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import { termsDoc } from "@/content/legal/terms";

export const metadata: Metadata = {
  title: "Terms & Conditions | Ranote Exim",
  description:
    "Ranote Exim B2B Terms and Conditions governing international trade contracts, Incoterms® 2020 rules, escrow settlement, and commercial arbitration.",
  alternates: {
    canonical: "https://ranote-exim.com/terms",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <LegalLayout
      document={termsDoc}
      pageType="terms"
      pageTitle="Terms & Conditions"
    />
  );
}
