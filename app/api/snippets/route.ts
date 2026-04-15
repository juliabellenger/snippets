import { NextResponse } from "next/server";
import { listSnippets, createSnippet } from "@/lib/store";

export async function GET() {
  return NextResponse.json(listSnippets());
}

export async function POST(request: Request) {
  const body = await request.json();
  const { cleanText, categories, inputType } = body;

  if (!cleanText || typeof cleanText !== "string") {
    return NextResponse.json({ error: "cleanText is required" }, { status: 400 });
  }

  const snippet = createSnippet(
    cleanText.trim(),
    Array.isArray(categories) ? categories : [],
    inputType === "spoken" ? "spoken" : "typed"
  );
  return NextResponse.json(snippet, { status: 201 });
}
