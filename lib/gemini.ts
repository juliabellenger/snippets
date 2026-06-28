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
      contents: `You triage emails for a busy person. Determine whether this email belongs on their dashboard.

SHOW the email if EITHER:
1. It is from an individual human (not a company, organization, automated system, or mailing list), OR
2. It contains an important call to action requiring a personal decision or response (e.g. sign a permission slip, confirm attendance, approve something, respond to a request).

DO NOT show: newsletters, receipts, shipping notices, account notifications, marketing from orgs, FYI updates, automated alerts, or anything that doesn't need a personal response.

If shown: write a concise summary (under 140 chars). If it needs a reply, describe the action needed. If informational, state the key info.

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

  return { show: true, needsReply: false, summary: input.snippet.slice(0, 140) };
}
