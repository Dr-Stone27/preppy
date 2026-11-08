"use client";

import { useState, useSyncExternalStore } from "react";
import styles from "./Add.module.css";

type Platform = "iphone" | "android";

/** The signed iPhone Shortcut (built by tools/build-shortcut.py); an iCloud link can replace it. */
const SHORTCUT = process.env.NEXT_PUBLIC_IOS_SHORTCUT_URL || "/save-to-preppy.shortcut";

const noop = () => () => {};
const guess = (): Platform => (/android/i.test(navigator.userAgent) ? "android" : "iphone");

/** How to send a post to Preppy without copying the caption by hand, per phone. */
export function FromInstagram() {
  const detected = useSyncExternalStore(noop, guess, () => "iphone" as Platform);
  const [picked, setPicked] = useState<Platform | null>(null);
  const platform = picked ?? detected;

  return (
    <details className={styles.howto}>
      <summary>Save from Instagram without copying</summary>
      <div className={styles.howtoBody}>
        <div className={styles.segment} role="tablist" aria-label="Your phone">
          {(
            [
              ["iphone", "iPhone"],
              ["android", "Android"],
            ] as const
          ).map(([p, label]) => (
            <button key={p} type="button" role="tab" aria-selected={platform === p} onClick={() => setPicked(p)}>
              {label}
            </button>
          ))}
        </div>

        {platform === "iphone" ? (
          <>
            <p className="t-small">Add the Preppy shortcut once. After that, any post comes in with its caption already filled.</p>
            <ol className={styles.steps}>
              <li>
                <a href={SHORTCUT} download="Save to Preppy.shortcut">
                  Get the Preppy shortcut
                </a>
                , open it, and tap Add Shortcut.
              </li>
              <li>In Instagram, tap the share button on a post, then Preppy. You may need to tap More to find it the first time.</li>
              <li>Preppy opens with the link and caption in. Tap Read recipe.</li>
            </ol>
            <p className="t-label t-muted">
              The shortcut opens Preppy in Safari. If you added Preppy to your home screen, sign in in Safari too, since iPhone keeps the two signed in separately.
            </p>
          </>
        ) : (
          <>
            <p className="t-small">Add Preppy to your home screen once, so it shows up when you share.</p>
            <ol className={styles.steps}>
              <li>In Chrome, open the ⋮ menu and tap Add to home screen, then Install.</li>
              <li>In Instagram, tap the share button on a post, then Preppy. The link comes in by itself.</li>
              <li>
                For the caption: hold the home button or bar to open Circle to Search, circle the caption, and tap Copy. Paste it below and tap Read recipe.
              </li>
            </ol>
            <p className="t-label t-muted">Circle to Search is on most recent Samsung and Pixel phones. Without it, copy the caption by hand.</p>
          </>
        )}
      </div>
    </details>
  );
}
