import { NextResponse } from "next/server";
import { getSessionAccessToken } from "@/lib/googleApi";
import { GoogleTask } from "@/lib/types";

interface GTask {
  id: string;
  title?: string;
  due?: string;
  notes?: string;
  status?: string;
}

export async function GET() {
  const accessToken = await getSessionAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not connected to Google Tasks. Try signing out and back in." },
      { status: 401 }
    );
  }

  const params = new URLSearchParams({
    showCompleted: "false",
    maxResults: "50",
  });

  const response = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Couldn't load Google Tasks." },
      { status: 502 }
    );
  }

  const data = await response.json();
  const tasks: GoogleTask[] = ((data.items ?? []) as GTask[])
    .map((t) => ({
      id: t.id,
      title: t.title ?? "(Untitled)",
      due: t.due,
      notes: t.notes,
      completed: t.status === "completed",
    }))
    .sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const accessToken = await getSessionAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not connected to Google Tasks. Try signing out and back in." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { title, due } = body;
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const response = await fetch(
    "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title.trim(),
        due: typeof due === "string" && due ? `${due}T00:00:00.000Z` : undefined,
      }),
    }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Couldn't create the task." },
      { status: 502 }
    );
  }

  const created: GTask = await response.json();
  const task: GoogleTask = {
    id: created.id,
    title: created.title ?? title,
    due: created.due,
    notes: created.notes,
    completed: false,
  };

  return NextResponse.json(task, { status: 201 });
}
