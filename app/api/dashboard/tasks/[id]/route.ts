import { NextResponse } from "next/server";
import { getSessionAccessToken } from "@/lib/googleApi";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessToken = await getSessionAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not connected to Google Tasks. Try signing out and back in." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const completed = body.completed !== false;

  const response = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: completed ? "completed" : "needsAction",
      }),
    }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Couldn't update the task." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
