import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dismissEmail } from "@/lib/dismissedEmails";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  dismissEmail(email, id);

  return NextResponse.json({ ok: true });
}
