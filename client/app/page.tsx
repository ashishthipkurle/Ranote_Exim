import HomeClient from "@/components/homepage/HomeClient";
import { getHomepageSettings } from "@/lib/homepage-settings";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const settings = getHomepageSettings();
  return <HomeClient initialShowHeroVideo={settings.showHeroVideo} />;
}
