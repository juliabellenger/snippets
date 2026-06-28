import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "google-tokens.json");

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // unix seconds
}

function readAll(): Record<string, StoredTokens> {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeAll(tokens: Record<string, StoredTokens>) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(tokens, null, 2));
}

export function saveTokens(
  email: string,
  tokens: { accessToken: string; refreshToken?: string; expiresAt?: number }
) {
  const all = readAll();
  const existing = all[email];
  all[email] = {
    accessToken: tokens.accessToken,
    // Google only issues a refresh_token on first consent; keep the
    // previously stored one if this sign-in didn't get a new one.
    refreshToken: tokens.refreshToken ?? existing?.refreshToken,
    expiresAt: tokens.expiresAt,
  };
  writeAll(all);
}

export function getTokens(email: string): StoredTokens | undefined {
  return readAll()[email];
}

/**
 * Returns a valid access token for the given user, refreshing it via the
 * stored refresh_token if it's expired or about to expire.
 */
export async function getValidAccessToken(
  email: string
): Promise<string | null> {
  const tokens = getTokens(email);
  if (!tokens) return null;

  const isExpired =
    !tokens.expiresAt || tokens.expiresAt * 1000 < Date.now() + 60_000;
  if (!isExpired) return tokens.accessToken;

  if (!tokens.refreshToken) return null;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID ?? "",
      client_secret: process.env.AUTH_GOOGLE_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
  saveTokens(email, {
    accessToken: data.access_token,
    refreshToken: tokens.refreshToken,
    expiresAt,
  });

  return data.access_token;
}
