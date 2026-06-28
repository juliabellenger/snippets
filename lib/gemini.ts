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
    // No API key — show everything unfiltered
    return { show: true, needsReply: false, summary: "" };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You triage emails for a busy mom and help her decide what needs attention.

SHOW the email if any of these apply:
- A real person (friend, family, teacher, coach, colleague, doctor) wrote to her personally
- A school or organization needs a specific action from her (sign something, confirm, pay, respond to a request about her child)
- Something time-sensitive or requiring a personal decision
- A conversation she is part of that has a new reply needing her attention

DO NOT show:
- Marketing, promotions, newsletters, or sales emails
- Automated receipts, shipping notifications, order confirmations
- Generic account/subscription/billing notifications with no required action
- Spam or mass emails not addressed to her personally

If shown, write a one-line reason why it matters — focus on what she needs to do or know. Examples: "Rose's teacher is asking about the field trip permission slip.", "Tom sent a message that needs a reply.", "Dentist appointment needs to be confirmed by Friday."

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
  } catch (err) {
    console.error("[gemini] classifyEmail error:", err);
  }

  // On any error, show the email rather than silently hiding it
  return { show: true, needsReply: false, summary: "" };
}
