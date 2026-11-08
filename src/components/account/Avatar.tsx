"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useSync } from "@/state/sync";
import styles from "./Avatar.module.css";

/** First letter of the email when signed in, a person outline when not. */
export function Avatar({ size = 44 }: { size?: number }) {
  const { email } = useSync();
  return (
    <span className={styles.avatar} data-in={email ? "" : undefined} style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden>
      {email ? email[0].toUpperCase() : <Icon name="user" size={Math.round(size * 0.5)} />}
    </span>
  );
}

/** Home header entry to Settings. */
export function AvatarLink() {
  const { email } = useSync();
  return (
    <Link href="/settings" className={styles.link} aria-label={email ? `Settings, signed in as ${email}` : "Settings, not signed in"}>
      <Avatar />
    </Link>
  );
}
