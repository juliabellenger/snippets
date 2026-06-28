import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export interface EmailClassification {
  show: boolean;
  needsReply: boolean;
  summary: string;
}

export async function classifyEmail(input: {
  subject: string;
  from: string;
  snippet: string;
}): Promise<EmailClassification> {
  const ai = getClient();
  if (!ai) {
    return { show: false, needsReply: false, summary: "" };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You triage emails for a busy person. Be very conservative — when in doubt, do NOT show.

SHOW only if one of these is clearly true:
1. A real person in her life (family, friend, teacher, coach, colleague, doctor's office staff) wrote to her personally and it needs a response or action.
2. A school or institution requires a specific personal action (sign a form, confirm attendance, approve something, pay a specific fee, respond to a specific request about her child).

DO NOT show anything else, including:
- Any company, brand, service, or app — even with a "call to action"
- Newsletters, receipts, order confirmations, shipping/delivery notices
- Bank/financial alerts, subscription notices, account notifications
- Appointment reminders from businesses (only show if a human staff member is asking a question)
- Automated emails that use a person's name in the From field
- Informational updates from organizations, even schools
- Anything where no reply or personal decision is required

If shown: one concise line describing the specific action needed.

Respond with ONLY: {"show": boolean, "needsReply": boolean, "summary": string}

From: ${input.from}
Subject: ${input.subject}
Preview: ${input.snippet}`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text ?? "";
    const parsed = JSON.parse(text);
    if (typeof parsed.show === "boolean" && typeof parsed.needsReply === "boolean" && typeof parsed.summary === "string") {
      return { show: parsed.show, needsReply: parsed.needsReply, summary: parsed.summary.slice(0, 200) };
    }
  } catch {
    // Fall through to fallback.
  }

  return { show: false, needsReply: false, summary: "" };
}
