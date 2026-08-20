import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/backend/lib/supabase-admin";

// This handler takes no dynamic inputs (no headers/cookies/searchParams), so
// Next.js could otherwise statically cache it at build time. Force dynamic
// rendering so content edits made in the admin panel show up immediately.
export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("page_content").select("key, value");
  if (error) {
    return NextResponse.json({ success: false, error: "Could not load content" }, { status: 500 });
  }
  return NextResponse.json({
    success: true,
    content: Object.fromEntries((data || []).map((c) => [c.key, c.value])),
  });
}
