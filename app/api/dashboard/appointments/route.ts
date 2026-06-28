import { NextResponse } from "next/server";
import { getSessionAccessToken } from "@/lib/googleApi";
import { CalendarEvent } from "@/lib/types";

interface GCalEvent {
  id: string;
  summary?: string;
  htmlLink?: string;
  start?: { date?: string; dateTime?: string };
  recurringEventId?: string;
}

export async function GET() {
  const accessToken = await getSessionAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not connected to Google Calendar. Try signing out and back in." },
      { status: 401 }
    );
  }

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "20",
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Couldn't load Calendar events." },
      { status: 502 }
    );
  }

  const data = await response.json();
  // Recurring all-day events (birthdays, anniversaries, renewals) are
  // treated as "annual reminders" instead, surfaced by the reminders route.
  const events: CalendarEvent[] = (data.items as GCalEvent[])
    .filter((e) => !(e.start?.date && e.recurringEventId))
    .map((e) => ({
      id: e.id,
      title: e.summary ?? "(No title)",
      start: e.start?.dateTime ?? e.start?.date ?? "",
      allDay: !!e.start?.date,
      link: e.htmlLink,
    }));

  return NextResponse.json(events);
}
