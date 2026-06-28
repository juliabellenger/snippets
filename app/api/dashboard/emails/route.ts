import { NextResponse } from "next/server";
import { getSessionAccessToken } from "@/lib/googleApi";
import { EmailSummary } from "@/lib/types";

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessage {
  id: string;
  snippet?: string;
  labelIds?: string[];
  payload?: { headers?: GmailHeader[] };
}

const SCHOOL_OR_DISTRICT = /school|district/i;
const MAX_RESULTS = 20;

async function listMessageIds(authHeader: HeadersInit, q: string) {
  const params = new URLSearchParams({ q, maxResults: "25" });
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
    { headers: authHeader }
  );
  if (!response.ok) return null;
  const data = await response.json();
  return ((data.messages ?? []) as { id: string }[]).map((m) => m.id);
}

export async function GET() {
  const accessToken = await getSessionAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not connected to Gmail. Try signing out and back in." },
      { status: 401 }
    );
  }

  const authHeader = { Authorization: `Bearer ${accessToken}` };

  // Unread mail, with marketing/social noise filtered out, plus anything
  // from a school or district regardless of read state — those shouldn't
  // get buried even if already glanced at.
  const [unreadIds, schoolIds] = await Promise.all([
    listMessageIds(authHeader, "in:inbox is:unread -category:promotions -category:social"),
    listMessageIds(authHeader, "in:inbox (school OR district)"),
  ]);

  if (unreadIds === null && schoolIds === null) {
    return NextResponse.json(
      { error: "Couldn't load Gmail messages." },
      { status: 502 }
    );
  }

  const ids = Array.from(new Set([...(unreadIds ?? []), ...(schoolIds ?? [])])).slice(
    0,
    MAX_RESULTS
  );

  const messages = await Promise.all(
    ids.map((id) =>
      fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
        { headers: authHeader }
      ).then((r) => (r.ok ? (r.json() as Promise<GmailMessage>) : null))
    )
  );

  const emails: EmailSummary[] = messages
    .filter((m): m is GmailMessage => m !== null)
    .map((m) => {
      const headers = m.payload?.headers ?? [];
      const subject =
        headers.find((h) => h.name === "Subject")?.value ?? "(No subject)";
      const from = headers.find((h) => h.name === "From")?.value ?? "";
      const labels = m.labelIds ?? [];
      return {
        id: m.id,
        subject,
        from,
        snippet: m.snippet ?? "",
        unread: labels.includes("UNREAD"),
        starred: labels.includes("STARRED"),
        link: `https://mail.google.com/mail/u/0/#inbox/${m.id}`,
      };
    })
    // Belt-and-suspenders: keep school/district mail even if Gmail's
    // category filter on the unread query would otherwise have excluded it.
    .filter(
      (e) =>
        e.unread || SCHOOL_OR_DISTRICT.test(e.from) || SCHOOL_OR_DISTRICT.test(e.subject)
    );

  return NextResponse.json(emails);
}
