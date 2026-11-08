import type { ReactNode } from "react";
import { SyncRunner } from "@/components/account/SyncRunner";
import { BottomNav } from "./BottomNav";
import styles from "./AppShell.module.css";

/** Page frame: scrollable content column plus the persistent bottom navigation. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>{children}</main>
      <BottomNav />
      <SyncRunner />
    </div>
  );
}
