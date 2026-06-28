import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSessionAccessToken } from "@/lib/googleApi";
import { getDismissedEmailIds } from "@/lib/dismissedEmails";
import { classifyEmail } from "@/lib/gemini";
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
  const session = await auth();
  const accessToken = await getSessionAccessToken();
  if (!accessToken || !session?.user?.email) {
    return NextResponse.json(
      { error: "Not connected to Gmail. Try signing out and back in." },
      { status: 401 }
    );
  }

  const dismissed = getDismissedEmailIds(session.user.email);
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  // Exclude bulk/automated categories. School emails fetched separately
  // since they often land in Updates rather than Primary.
  const [primaryIds, schoolIds] = await Promise.all([
    listMessageIds(
      authHeader,
      "in:inbox is:unread -category:promotions -category:social -category:updates -category:forums"
    ),
    listMessageIds(authHeader, "in:inbox is:unread (school OR district)"),
  ]);

  if (primaryIds === null && schoolIds === null) {
    return NextResponse.json(
      { error: "Couldn't load Gmail messages." },
      { status: 502 }
    );
  }

  const ids = Array.from(new Set([...(primaryIds ?? []), ...(schoolIds ?? [])]))
    .filter((id) => !dismissed.has(id))
    .slice(0, MAX_RESULTS);

  const messages = await Promise.all(
    ids.map((id) =>
      fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
        { headers: authHeader }
      ).then((r) => (r.ok ? (r.json() as Promise<GmailMessage>) : null))
    )
  );

  const baseEmails = messages
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
    ;

  const classified = await Promise.all(
    baseEmails.map(async (e) => {
      const { show, needsReply, summary } = await classifyEmail(e);
      return { ...e, needsReply, summary, show };
    })
  );

  const emails: EmailSummary[] = classified
    .filter((e) => e.show)
    .map(({ show: _show, ...e }) => e);

  return NextResponse.json(emails);
}
