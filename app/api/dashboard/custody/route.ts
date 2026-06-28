import { NextResponse } from "next/server";
import { getSessionAccessToken } from "@/lib/googleApi";

const DZIUBA_CALENDAR = "Dziuba kid timeshare 2024+";
const RITEA_CALENDAR = "Ritea-Bellenger Share Time";

interface GCalListEntry {
  id: string;
  summary?: string;
}

interface GCalEvent {
  summary?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
}

function eventDate(e: GCalEvent, field: "start" | "end"): string {
  const v = e[field];
  return v?.date ?? v?.dateTime?.slice(0, 10) ?? "";
}

export interface GroupStatus {
  names: string[];
  away: boolean;
  nextChange: string | null;
  returnDate: string | null; // only set when away:false and nextChange is a departure
}

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function localTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isActiveToday(event: GCalEvent, today: string): boolean {
  const start = eventDate(event, "start");
  const end = eventDate(event, "end");
  return !!start && !!end && start <= today && end > today;
}

async function fetchEvents(calId: string, authHeader: { Authorization: string }): Promise<GCalEvent[]> {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const timeMin = d.toISOString();
  const timeMax = new Date(d.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({ timeMin, timeMax, singleEvents: "true", orderBy: "startTime", maxResults: "100" });
  const r = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?${params}`,
    { headers: authHeader }
  );
  if (!r.ok) return [];
  const data = await r.json();
  return data.items ?? [];
}

function analyzeDziuba(events: GCalEvent[]): GroupStatus {
  const today = localToday();
  const tedEvents = events.filter((e) => /ted/i.test(e.summary ?? ""));

  // Started before today and still active → already away
  const alreadyAway = tedEvents.find(
    (e) => eventDate(e, "start") < today && eventDate(e, "end") > today
  );
  if (alreadyAway) {
    return { names: ["Rose", "Ann", "Hunter"], away: true, nextChange: eventDate(alreadyAway, "end") || null, returnDate: null };
  }

  const nextAway = tedEvents.find((e) => eventDate(e, "start") >= today);
  return {
    names: ["Rose", "Ann", "Hunter"],
    away: false,
    nextChange: nextAway ? eventDate(nextAway, "start") : null,
    returnDate: nextAway ? eventDate(nextAway, "end") || null : null,
  };
}

function analyzeRitea(events: GCalEvent[]): GroupStatus {
  const today = localToday();
  const mamanEvents = events.filter((e) => /maman?/i.test(e.summary ?? ""));

  const alreadyAway = mamanEvents.find(
    (e) => eventDate(e, "start") < today && eventDate(e, "end") > today
  );
  if (alreadyAway) {
    return { names: ["Chloe", "Charlie"], away: true, nextChange: eventDate(alreadyAway, "end") || null, returnDate: null };
  }

  const nextAway = mamanEvents.find((e) => eventDate(e, "start") >= today);
  return {
    names: ["Chloe", "Charlie"],
    away: false,
    nextChange: nextAway ? eventDate(nextAway, "start") : null,
    returnDate: nextAway ? eventDate(nextAway, "end") || null : null,
  };
}

function formatChangeDate(dateStr: string): string {
  const today = localToday();
  const tomorrow = localTomorrow();
  if (dateStr === today) return "today";
  if (dateStr === tomorrow) return "tomorrow";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

function nameStr(names: string[]): string {
  if (names.length === 1) return names[0];
  return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
}

function buildMessage(groups: GroupStatus[]): { header: string; detail: string } {
  const allHome = groups.every((g) => !g.away);
  const allAway = groups.every((g) => g.away);
  const header = allHome ? "FULL HOUSE!" : allAway ? "EMPTY NEST!" : "SMALL CREW!";

  const sorted = [...groups].sort((a, b) => {
    if (!a.nextChange && !b.nextChange) return 0;
    if (!a.nextChange) return 1;
    if (!b.nextChange) return -1;
    return a.nextChange.localeCompare(b.nextChange);
  });

  const details: string[] = [];
  for (const g of sorted) {
    const n = nameStr(g.names);
    const plural = g.names.length > 1;
    if (g.away) {
      if (g.nextChange) {
        details.push(`${n} ${plural ? "come" : "comes"} home ${formatChangeDate(g.nextChange)}`);
      } else {
        details.push(`${n} ${plural ? "are" : "is"} away`);
      }
    } else if (g.nextChange) {
      const leave = formatChangeDate(g.nextChange);
      const back = g.returnDate ? `, back ${formatChangeDate(g.returnDate)}` : "";
      details.push(`${n} ${plural ? "leave" : "leaves"} ${leave}${back}`);
    }
  }

  const detail = details.map((s) => s.charAt(0).toUpperCase() + s.slice(1) + ".").join(" ");
  return { header, detail };
}

export async function GET() {
  const accessToken = await getSessionAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not connected to Google Calendar. Try signing out and back in." },
      { status: 401 }
    );
  }

  const authHeader = { Authorization: `Bearer ${accessToken}` };

  const calListRes = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
    { headers: authHeader }
  );
  if (!calListRes.ok) {
    return NextResponse.json({ error: "Couldn't load calendars." }, { status: 502 });
  }

  const calList: GCalListEntry[] = (await calListRes.json()).items ?? [];
  const find = (name: string) => calList.find((c) => c.summary === name)?.id ?? null;

  const dziubaId = find(DZIUBA_CALENDAR);
  const riteaId = find(RITEA_CALENDAR);

  const [dziubaEvents, riteaEvents] = await Promise.all([
    dziubaId ? fetchEvents(dziubaId, authHeader) : Promise.resolve([]),
    riteaId ? fetchEvents(riteaId, authHeader) : Promise.resolve([]),
  ]);

  const groups: GroupStatus[] = [
    analyzeDziuba(dziubaEvents),
    analyzeRitea(riteaEvents),
  ];

  const { header, detail } = buildMessage(groups);

  return NextResponse.json({ header, detail, groups });
}
