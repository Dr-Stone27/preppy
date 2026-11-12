import { Play } from "@/components/dev/Play";

// A scratch page for trying design directions on a phone. Not linked from the app.
export const metadata = { title: "Play · Preppy", robots: { index: false, follow: false } };

export default function PlayPage() {
  return <Play />;
}
