import { Suspense } from "react";
import { CookDay } from "@/components/plan/CookDay";

export const metadata = { title: "Cook day · Preppy" };

export default function CookPage() {
  return (
    <Suspense>
      <CookDay />
    </Suspense>
  );
}
