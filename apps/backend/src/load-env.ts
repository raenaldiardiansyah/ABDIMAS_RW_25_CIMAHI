import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const envFiles = [
  path.resolve(currentDir, "../.env.local"),
  path.resolve(currentDir, "../.env"),
  path.resolve(currentDir, "../../../.env"),
];

for (const envPath of envFiles) {
  if (!fs.existsSync(envPath)) continue;

  const text = fs.readFileSync(envPath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    process.env[key] = value;
  }
}
