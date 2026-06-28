"use client";

import { useEffect, useState } from "react";
import { CalendarEvent, EmailSummary, GoogleTask } from "@/lib/types";
import { api } from "@/lib/api";
import DashboardCard from "@/components/DashboardCard";
import TodayCard from "@/components/TodayCard";
import LookAheadCard from "@/components/LookAheadCard";
import EmailList from "@/components/EmailList";
import NewTaskForm from "@/components/NewTaskForm";

function useDashboardSection<T>(path: string) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(api(path))
      .then(async (r) => {
        const text = await r.text();
        const body = text ? JSON.parse(text) : {};
        if (!r.ok) throw new Error(body.error ?? `Error ${r.status}`);
        setData(body);
      })
      .catch((e) => setError(e.message));
  }, [path]);

  return { data, error, loading: data === null && error === null, setData };
}

function useCustody() {
  const [header, setHeader] = useState<string | null>(null);
  const [detail, setDetail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(api("/api/dashboard/custody"))
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Something went wrong.");
        setHeader(body.header ?? "");
        setDetail(body.detail ?? "");
      })
      .catch((e) => setError(e.message));
  }, []);

  return { header, detail, error, loading: header === null && error === null };
}

function dateParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayDateParam(): string {
  return dateParam(new Date());
}

function lookAheadParams(): { from: string; to: string } {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const end = new Date();
  end.setDate(end.getDate() + 10);
  return { from: dateParam(tomorrow), to: dateParam(end) };
}

function todayHeading(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function Dashboard() {
  const custody = useCustody();
  const { from, to } = lookAheadParams();
  const appointments = useDashboardSection<CalendarEvent>(
    `/api/dashboard/appointments?date=${todayDateParam()}`
  );
  const upcoming = useDashboardSection<CalendarEvent>(
    `/api/dashboard/appointments?from=${from}&to=${to}`
  );
  const reminders = useDashboardSection<CalendarEvent>(
    "/api/dashboard/reminders?days=30"
  );
  const emails = useDashboardSection<EmailSummary>("/api/dashboard/emails");
  const tasks = useDashboardSection<GoogleTask>("/api/dashboard/tasks");

  const todayStr = todayDateParam();
  const dueOrOverdueTasks = (tasks.data ?? []).filter(
    (t) => t.due && t.due.slice(0, 10) <= todayStr
  );
  const oneMonthOut = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return dateParam(d);
  })();
  const upcomingTasks = (tasks.data ?? []).filter(
    (t) => !t.due || (t.due.slice(0, 10) > todayStr && t.due.slice(0, 10) <= oneMonthOut)
  );

  return (
    <div className="px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="font-heading text-4xl tracking-[0.15em] text-slate">
          At a Glance
        </h1>
        <div className="mt-4 mx-auto w-48 border-t border-gold/40" />
      </div>

      <div className="flex flex-col gap-4">
        {!custody.loading && custody.header && (
          <p className="text-sm text-slate-light/70 italic">
            <span className="font-bold">{custody.header}</span>
            {custody.detail && ` ${custody.detail}`}
          </p>
        )}

        <DashboardCard
          title={`Today, ${todayHeading()}`}
          loading={appointments.loading || tasks.loading}
          error={appointments.error ?? tasks.error}
          isEmpty={false}
          emptyMessage=""
        >
          <TodayCard
            events={appointments.data ?? []}
            tasks={dueOrOverdueTasks}
            onTaskCompleted={(id) =>
              tasks.setData((tasks.data ?? []).filter((t) => t.id !== id))
            }
          />
        </DashboardCard>

        <DashboardCard title="New Task" loading={false} error={null} isEmpty={false} emptyMessage="">
          <NewTaskForm
            onCreated={(task) =>
              tasks.setData([task, ...(tasks.data ?? [])])
            }
          />
        </DashboardCard>

        <DashboardCard
          title="Looking Forward"
          loading={upcoming.loading || reminders.loading || tasks.loading}
          error={upcoming.error ?? reminders.error ?? tasks.error}
          isEmpty={false}
          emptyMessage=""
        >
          <LookAheadCard
            events={upcoming.data ?? []}
            tasks={upcomingTasks}
            reminders={reminders.data ?? []}
            onTaskCompleted={(id) =>
              tasks.setData((tasks.data ?? []).filter((t) => t.id !== id))
            }
          />
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

      </div>
    </div>
  );
}
