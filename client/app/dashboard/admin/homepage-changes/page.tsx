import { redirect } from "next/navigation";

export default function AdminHomepageChangesRedirect() {
  redirect("/dashboard/exporter/homepage-changes");
}

