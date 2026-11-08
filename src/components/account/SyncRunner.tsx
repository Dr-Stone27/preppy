"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { startAnalytics } from "@/lib/analytics";
import { clearFresh, setupPending, useSync } from "@/state/sync";

/**
 * Mounted once in the app frame so sign-in and saving run on every screen.
 * After a fresh sign-in it moves the person on: back into setup if they signed in partway through, otherwise home.
 */
export function SyncRunner() {
  const sync = useSync();
  const router = useRouter();

  useEffect(startAnalytics, []);

  // A sign-in link that was already used or has expired comes back with the reason in the address. Say so on the sign-in page.
  useEffect(() => {
    if (/error_code=(otp_expired|access_denied)/.test(location.hash)) router.replace("/account?link=used");
  }, [router]);

  useEffect(() => {
    if (!sync.fresh || !sync.email || sync.status === "loading") return;
    clearFresh();
    const path = location.pathname;
    if (setupPending()) {
      if (path !== "/welcome") router.replace("/welcome?step=done");
    } else if (path === "/account" || path === "/welcome") router.replace("/");
  }, [sync.fresh, sync.email, sync.status, router]);

  return null;
}
