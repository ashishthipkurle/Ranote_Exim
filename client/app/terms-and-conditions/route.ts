import { redirect, RedirectType } from "next/navigation";

export async function GET() {
  redirect("/terms", RedirectType.permanent);
}

