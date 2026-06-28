"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { CalendarEvent, GoogleTask } from "@/lib/types";
import { api } from "@/lib/api";

function formatTime(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function EventRow({ event }: { event: CalendarEvent }) {
  const timeRange = event.allDay
    ? "All day"
    : `${formatTime(event.start)} – ${formatTime(event.end)}`;

  return (
    <li className="flex items-baseline gap-2 text-sm">
      <Calendar className="shrink-0 h-4 w-4 text-slate" />
      <a
        href={event.link}
        target="_blank"
        rel="noreferrer"
        className="flex-1 min-w-0 truncate text-slate hover:text-gold-light"
      >
        {event.title}
      </a>
      <span className="shrink-0 font-heading text-xs tracking-wider text-gold">
        {timeRange}
      </span>
    </li>
  );
}

function TaskRow({
  task,
  onCompleted,
}: {
  task: GoogleTask;
  onCompleted: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    setSaving(true);
    const response = await fetch(api(`/api/dashboard/tasks/${task.id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    if (response.ok) {
      onCompleted(task.id);
    } else {
      setSaving(false);
    }
  }

  return (
    <li className="flex items-baseline gap-2 text-sm">
      <input
        type="checkbox"
        disabled={saving}
        onChange={handleToggle}
        className="shrink-0 h-4 w-4 accent-gold cursor-pointer"
        aria-label={`Mark "${task.title}" complete`}
      />
      <span className="flex-1 min-w-0 truncate text-slate">{task.title}</span>
    </li>
  );
}

export default function TodayCard({
  events,
  tasks,
  onTaskCompleted,
}: {
  events: CalendarEvent[];
  tasks: GoogleTask[];
  onTaskCompleted: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {events.length === 0 && tasks.length === 0 ? (
        <p className="text-slate-light/50 text-sm italic">
          Nothing on the calendar or due today.
        </p>
      ) : (
        <>
          {events.length > 0 && (
            <ul className="flex flex-col gap-2">
              {events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          )}
          {tasks.length > 0 && (
            <ul className="flex flex-col gap-2">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onCompleted={onTaskCompleted}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
