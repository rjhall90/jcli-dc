import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export interface JcliConfig {
  baseUrl: string;
  token: string;
  email: string;
}

const CONFIG_DIR = path.join(os.homedir(), ".jcli");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function loadConfig(): JcliConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error(
      "No configuration found. Run: jcli config set --url <url> --token <pat>"
    );
    process.exit(1);
  }
  const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
  return JSON.parse(raw) as JcliConfig;
}

export function saveConfig(config: Partial<JcliConfig>): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  let existing: Partial<JcliConfig> = {};
  if (fs.existsSync(CONFIG_FILE)) {
    existing = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  }

  const merged = { ...existing, ...config };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), "utf-8");
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
