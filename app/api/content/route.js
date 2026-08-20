import { supabaseAdmin } from "@/backend/lib/supabase-admin";
import { errorResponse, successResponse } from "@/backend/lib/security";

// This handler takes no dynamic inputs (no headers/cookies/searchParams), so
// Next.js could otherwise statically cache it at build time. Force dynamic
// rendering so content edits made in the admin panel show up immediately.
export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("page_content").select("key, value");
  if (error) return errorResponse("Could not load content", 500);
  return successResponse({ content: Object.fromEntries((data || []).map((c) => [c.key, c.value])) });
}
