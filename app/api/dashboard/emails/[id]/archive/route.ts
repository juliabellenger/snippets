import { NextResponse } from "next/server";
import { getSessionAccessToken } from "@/lib/googleApi";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accessToken = await getSessionAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not connected to Gmail. Try signing out and back in." },
      { status: 401 }
    );
  }

  // Archiving in Gmail just means removing the INBOX label.
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ removeLabelIds: ["INBOX"] }),
    }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Couldn't archive the email." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
