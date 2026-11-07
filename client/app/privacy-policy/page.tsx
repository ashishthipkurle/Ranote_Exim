import { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import { privacyDoc } from "@/content/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy | Ranote Exim",
  description:
    "Ranote Exim Privacy Policy detailing data protection, enterprise compliance, DPDP Act 2023, GDPR adherence, and corporate privacy rights.",
  alternates: {
    canonical: "https://ranote-exim.com/privacy-policy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      document={privacyDoc}
      pageType="privacy-policy"
      pageTitle="Privacy Policy"
    />
  );
}

