"use client";

import { Calendar, Bell, CheckSquare } from "lucide-react";
import { CalendarEvent, GoogleTask } from "@/lib/types";

function formatDate(iso: string): string {
  // iso is either "YYYY-MM-DD" (all-day) or a full dateTime string
  const d = iso.length === 10
    ? new Date(`${iso}T00:00:00`)
    : new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(iso?: string): string {
  if (!iso || iso.length === 10) return "";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function EventRow({ event }: { event: CalendarEvent }) {
  const date = formatDate(event.start);
  const startTime = formatTime(event.start);
  const endTime = formatTime(event.end);
  const timeLabel = event.allDay
    ? "All day"
    : endTime
    ? `${startTime} – ${endTime}`
    : startTime;

  return (
    <li className="flex items-baseline gap-2 text-sm">
      <Calendar className="shrink-0 h-4 w-4 text-slate mt-0.5" />
      <a
        href={event.link}
        target="_blank"
        rel="noreferrer"
        className="flex-1 min-w-0 truncate text-slate hover:text-gold-light"
      >
        {event.title}
      </a>
      <span className="shrink-0 font-heading text-xs tracking-wider text-gold">{date}</span>
      {timeLabel && (
        <span className="shrink-0 font-heading text-xs tracking-wider text-gold">{timeLabel}</span>
      )}
    </li>
  );
}

function TaskRow({ task }: { task: GoogleTask }) {
  const date = task.due ? formatDate(task.due.slice(0, 10)) : "";
  return (
    <li className="flex items-baseline gap-2 text-sm">
      <CheckSquare className="shrink-0 h-4 w-4 text-slate mt-0.5" />
      <span className="shrink-0 font-heading text-xs tracking-wider text-gold w-20">{date}</span>
      <span className="flex-1 min-w-0 truncate text-slate">{task.title}</span>
    </li>
  );
}

function ReminderRow({ event }: { event: CalendarEvent }) {
  const date = formatDate(event.start);
  return (
    <li className="flex items-baseline gap-2 text-sm">
      <Bell className="shrink-0 h-4 w-4 text-slate mt-0.5" />
      <a
        href={event.link}
        target="_blank"
        rel="noreferrer"
        className="flex-1 min-w-0 truncate text-slate hover:text-gold-light"
      >
        {event.title}
      </a>
      <span className="shrink-0 font-heading text-xs tracking-wider text-gold">{date}</span>
    </li>
  );
}

export default function LookAheadCard({
  events,
  tasks,
  reminders,
}: {
  events: CalendarEvent[];
  tasks: GoogleTask[];
  reminders: CalendarEvent[];
}) {
  const empty = events.length === 0 && tasks.length === 0 && reminders.length === 0;
  if (empty) {
    return (
      <p className="text-slate-light/50 text-sm italic">
        Nothing coming up in the next 10 days.
      </p>
    );
  }

  const hasTopSection = events.length > 0 || tasks.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {(events.length > 0 || tasks.length > 0) && (
        <ul className="flex flex-col gap-2">
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </ul>
      )}
      {hasTopSection && reminders.length > 0 && (
        <div className="border-t border-gold/15" />
      )}
      {reminders.length > 0 && (
        <ul className="flex flex-col gap-2">
          {reminders.map((e) => (
            <ReminderRow key={e.id} event={e} />
          ))}
        </ul>
      )}
    </div>
  );
}
