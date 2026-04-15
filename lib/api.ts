const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/snippets";

export function api(path: string): string {
  return `${BASE}${path}`;
}
