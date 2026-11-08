import { SUPABASE_URL } from "@/lib/supabase";
import { accountFrom, hasSecret, sameOrigin, secretHeaders } from "@/server/admin";

/**
 * Deletes the signed-in account. Saved plans and the AI counter go with it
 * (both tables reference auth.users with on delete cascade).
 */
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "forbidden" }, { status: 403 });
  if (!hasSecret()) return Response.json({ error: "not-configured" }, { status: 503 });
  const signal = AbortSignal.timeout(8_000);
  try {
    const who = await accountFrom(req.headers.get("authorization"), signal);
    if (who === "sign-in") return Response.json({ error: "sign-in" }, { status: 401 });
    if (who === "error") return Response.json({ error: "busy" }, { status: 503 });
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(who.id)}`, { method: "DELETE", headers: secretHeaders(), signal });
    if (!res.ok) {
      console.error("[account] delete", res.status, (await res.text().catch(() => "")).slice(0, 200));
      return Response.json({ error: "failed" }, { status: 502 });
    }
    return Response.json({ deleted: true });
  } catch (e) {
    console.error("[account] delete", e instanceof Error ? e.message : e);
    return Response.json({ error: "busy" }, { status: 503 });
  }
}
