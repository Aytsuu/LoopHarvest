import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function parseDotEnvValue(contents: string, key: string) {
  const pattern = new RegExp(`^${key}=(.*)$`, "m");
  const match = contents.match(pattern);

  if (!match) {
    return null;
  }

  return match[1]?.trim() || null;
}

function readLocalEnvFile(filePath: string, key: string) {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return parseDotEnvValue(readFileSync(filePath, "utf8"), key);
  } catch {
    return null;
  }
}

export function getServerSecret(key: string) {
  const directValue = process.env[key]?.trim();
  if (directValue) {
    return directValue;
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const repoRoot = path.resolve(process.cwd(), "..");
  const candidateFiles = [
    path.join(repoRoot, "supabase", ".env"),
    path.join(repoRoot, "api", ".env"),
    path.join(repoRoot, "ai_engine", "gateway", ".env"),
  ];

  for (const filePath of candidateFiles) {
    const value = readLocalEnvFile(filePath, key);
    if (value) {
      return value;
    }
  }

  return null;
}
