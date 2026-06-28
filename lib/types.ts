export interface Snippet {
  id: string;
  cleanText: string;
  inputType: "typed" | "spoken";
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  name: string;
  count: number;
  lastUsed: string; // ISO timestamp of most recent snippet in this category
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO timestamp, or date (YYYY-MM-DD) for all-day events
  end?: string; // ISO timestamp, or date (YYYY-MM-DD) for all-day events
  allDay: boolean;
  link?: string;
}

export interface EmailSummary {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  unread: boolean;
  starred: boolean;
  link: string;
  needsReply: boolean;
  summary: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  due?: string; // ISO date
  notes?: string;
  completed: boolean;
}
