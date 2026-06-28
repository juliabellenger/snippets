import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "dismissed-emails.json");

function readAll(): Record<string, string[]> {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, string[]>) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function getDismissedEmailIds(email: string): Set<string> {
  return new Set(readAll()[email] ?? []);
}

export function dismissEmail(email: string, messageId: string) {
  const all = readAll();
  const ids = new Set(all[email] ?? []);
  ids.add(messageId);
  all[email] = [...ids];
  writeAll(all);
}
