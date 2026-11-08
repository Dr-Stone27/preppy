"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import styles from "./BottomNav.module.css";

type Tab = { href: string; label: string; icon: IconName };

const LEFT: Tab[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/plan", label: "Plan", icon: "plan" },
];
const RIGHT: Tab[] = [
  { href: "/library", label: "Library", icon: "library" },
  { href: "/shop", label: "Shop", icon: "shop" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();
  const tab = (t: Tab) => {
    const active = isActive(pathname, t.href);
    return (
      <Link
        key={t.href}
        href={t.href}
        className={styles.tab}
        data-active={active || undefined}
        aria-current={active ? "page" : undefined}
      >
        <Icon name={t.icon} strokeWidth={active ? 2.1 : 1.7} />
        <span>{t.label}</span>
      </Link>
    );
  };

  return (
    <nav className={styles.nav} aria-label="Main">
      <div className={styles.inner}>
        {LEFT.map(tab)}
        <Link href="/add" className={styles.add} aria-label="Add a recipe">
          <Icon name="plus" size={26} strokeWidth={2.2} />
        </Link>
        {RIGHT.map(tab)}
      </div>
    </nav>
  );
}
