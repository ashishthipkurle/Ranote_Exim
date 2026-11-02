import fs from "fs";
import path from "path";

export interface HomepageSettings {
  showHeroVideo: boolean;
  updatedAt: string;
}

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  showHeroVideo: true,
  updatedAt: new Date().toISOString(),
};

// In-memory fallback/cache
let cachedSettings: HomepageSettings = { ...DEFAULT_HOMEPAGE_SETTINGS };

function getSettingsFilePath(): string {
  return path.join(process.cwd(), "data", "homepage-settings.json");
}

export function getHomepageSettings(): HomepageSettings {
  try {
    const filePath = getSettingsFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(data);
      cachedSettings = {
        showHeroVideo: typeof parsed.showHeroVideo === "boolean" ? parsed.showHeroVideo : true,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
      return cachedSettings;
    }
  } catch (error) {
    console.error("[HomepageSettings] Error reading settings file:", error);
  }

  return cachedSettings;
}

export function updateHomepageSettings(newSettings: Partial<HomepageSettings>): HomepageSettings {
  try {
    const current = getHomepageSettings();
    const updated: HomepageSettings = {
      ...current,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };

    const dirPath = path.join(process.cwd(), "data");
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = getSettingsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf-8");
    cachedSettings = updated;
    return updated;
  } catch (error) {
    console.error("[HomepageSettings] Error writing settings file:", error);
    cachedSettings = {
      ...cachedSettings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };
    return cachedSettings;
  }
}

