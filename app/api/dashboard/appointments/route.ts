import { NextResponse } from "next/server";
import { getSessionAccessToken } from "@/lib/googleApi";
import { CalendarEvent } from "@/lib/types";

interface GCalEvent {
  id: string;
  summary?: string;
  htmlLink?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  recurringEventId?: string;
}

interface GCalListEntry {
  id: string;
  summary?: string;
}

const EXCLUDED_CALENDARS = [
  "Dziuba kid timeshare 2024+",
  "Ritea-Bellenger Share Time",
];

function startOfDay(dateStr: string | null): Date {
  if (dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: Request) {
  const accessToken = await getSessionAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not connected to Google Calendar. Try signing out and back in." },
      { status: 401 }
    );
  }

  const authHeader = { Authorization: `Bearer ${accessToken}` };
  const { searchParams } = new URL(request.url);
  let timeMin: string;
  let timeMax: string;
  if (searchParams.get("from") && searchParams.get("to")) {
    timeMin = startOfDay(searchParams.get("from")).toISOString();
    const toDay = startOfDay(searchParams.get("to"));
    timeMax = new Date(toDay.getTime() + 24 * 60 * 60 * 1000).toISOString();
  } else {
    const dayStart = startOfDay(searchParams.get("date"));
    timeMin = dayStart.toISOString();
    timeMax = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }

  const calendarListResponse = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
    { headers: authHeader }
  );

  if (!calendarListResponse.ok) {
    return NextResponse.json(
      { error: "Couldn't load your calendars." },
      { status: 502 }
    );
  }

  const calendarList = await calendarListResponse.json();
  const calendarIds: string[] = (calendarList.items as GCalListEntry[])
    .filter((c) => !EXCLUDED_CALENDARS.includes(c.summary ?? ""))
    .map((c) => c.id);

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });

  const eventLists = await Promise.all(
    calendarIds.map((calendarId) =>
      fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        { headers: authHeader }
      ).then((r) => (r.ok ? r.json() : { items: [] }))
    )
  );

  // Recurring all-day events (birthdays, anniversaries, renewals) are
  // treated as "annual reminders" instead, surfaced by the reminders route.
  // Google's timeMin returns events *active* in the range, including ones
  // that started before it — filter those out so only events starting within
  // the requested range are shown.
  const events: CalendarEvent[] = eventLists
    .flatMap((data) => data.items as GCalEvent[])
    .filter((e) => !(e.start?.date && e.recurringEventId))
    .filter((e) => {
      const startStr = e.start?.dateTime ?? e.start?.date ?? "";
      return startStr >= timeMin.slice(0, 10);
    })
    .map((e) => ({
      id: e.id,
      title: e.summary ?? "(No title)",
      start: e.start?.dateTime ?? e.start?.date ?? "",
      end: e.end?.dateTime ?? e.end?.date,
      allDay: !!e.start?.date,
      link: e.htmlLink,
    }))
    .sort((a, b) => a.start.localeCompare(b.start));

  return NextResponse.json(events);
}
