import fs from "fs";
import path from "path";

export interface TradeSettings {
  b2cActive: boolean;
  updatedAt?: string;
}

const SETTINGS_FILE = path.join(process.cwd(), "data", "trade-settings.json");

export function getTradeSettings(): TradeSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
      return { b2cActive: !!data.b2cActive, updatedAt: data.updatedAt };
    }
  } catch (error) {
    console.error("[TradeSettings] Error reading settings file:", error);
  }
  // Default to pure B2B (b2cActive: false)
  return { b2cActive: false };
}

export function isB2CActive(): boolean {
  return getTradeSettings().b2cActive;
}

export function setTradeSettings(b2cActive: boolean): TradeSettings {
  const settings: TradeSettings = {
    b2cActive,
    updatedAt: new Date().toISOString(),
  };

  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (error) {
    console.error("[TradeSettings] Error saving settings file:", error);
  }

  return settings;
}

