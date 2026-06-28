"use client";

import { useEffect, useState } from "react";
import { CalendarEvent, EmailSummary, GoogleTask } from "@/lib/types";
import { api } from "@/lib/api";
import DashboardCard from "@/components/DashboardCard";
import TaskList from "@/components/TaskList";
import EmailList from "@/components/EmailList";

function useDashboardSection<T>(path: string) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(api(path))
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Something went wrong.");
        setData(body);
      })
      .catch((e) => setError(e.message));
  }, [path]);

  return { data, error, loading: data === null && error === null, setData };
}

function formatEventStart(event: CalendarEvent): string {
  if (event.allDay) {
    return new Date(event.start).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
  return new Date(event.start).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const appointments = useDashboardSection<CalendarEvent>(
    "/api/dashboard/appointments"
  );
  const reminders = useDashboardSection<CalendarEvent>(
    "/api/dashboard/reminders"
  );
  const emails = useDashboardSection<EmailSummary>("/api/dashboard/emails");
  const tasks = useDashboardSection<GoogleTask>("/api/dashboard/tasks");

  return (
    <div className="px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="font-heading text-4xl tracking-[0.15em] text-slate">
          Today
        </h1>
        <div className="mt-4 mx-auto w-48 border-t border-gold/40" />
      </div>

      <div className="flex flex-col gap-4">
        <DashboardCard
          title="Appointments"
          loading={appointments.loading}
          error={appointments.error}
          isEmpty={(appointments.data ?? []).length === 0}
          emptyMessage="Nothing on the calendar this week."
        >
          <ul className="flex flex-col gap-2">
            {(appointments.data ?? []).map((event) => (
              <li key={event.id} className="flex items-baseline justify-between gap-2 text-sm">
                <a
                  href={event.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate hover:text-gold-light"
                >
                  {event.title}
                </a>
                <span className="shrink-0 font-heading text-xs tracking-wider text-gold">
                  {formatEventStart(event)}
                </span>
              </li>
            ))}
          </ul>
        </DashboardCard>

        <DashboardCard
          title="Emails Needing Attention"
          loading={emails.loading}
          error={emails.error}
          isEmpty={(emails.data ?? []).length === 0}
          emptyMessage="Inbox is clear."
        >
          <EmailList
            emails={emails.data ?? []}
            onArchived={(id) =>
              emails.setData((emails.data ?? []).filter((e) => e.id !== id))
            }
          />
        </DashboardCard>

        <DashboardCard
          title="Tasks"
          loading={tasks.loading}
          error={tasks.error}
          isEmpty={false}
          emptyMessage=""
        >
          <TaskList
            tasks={tasks.data ?? []}
            onTaskAdded={(task) =>
              tasks.setData([...(tasks.data ?? []), task])
            }
          />
        </DashboardCard>

        <DashboardCard
          title="Annual Reminders"
          loading={reminders.loading}
          error={reminders.error}
          isEmpty={(reminders.data ?? []).length === 0}
          emptyMessage="Nothing coming up in the next 60 days."
        >
          <ul className="flex flex-col gap-2">
            {(reminders.data ?? []).map((event) => (
              <li key={event.id} className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-slate">{event.title}</span>
                <span className="shrink-0 font-heading text-xs tracking-wider text-gold">
                  {formatEventStart(event)}
                </span>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </div>
    </div>
  );
}
