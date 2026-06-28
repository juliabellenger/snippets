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

export async function GET() {
  const accessToken = await getSessionAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not connected to Gmail. Try signing out and back in." },
      { status: 401 }
    );
  }

  const authHeader = { Authorization: `Bearer ${accessToken}` };
  const params = new URLSearchParams({
    q: "in:inbox (is:unread OR is:starred)",
    maxResults: "20",
  });

  const listResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
    { headers: authHeader }
  );

  if (!listResponse.ok) {
    return NextResponse.json(
      { error: "Couldn't load Gmail messages." },
      { status: 502 }
    );
  }

  const list = await listResponse.json();
  const ids: string[] = (list.messages ?? []).map(
    (m: { id: string }) => m.id
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
    });

  return NextResponse.json(emails);
}
