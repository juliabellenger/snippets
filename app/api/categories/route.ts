import { NextResponse } from "next/server";
import { listCategories, listCategorySummaries } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("summaries") === "true") {
    return NextResponse.json(listCategorySummaries());
  }
  return NextResponse.json(listCategories());
}
