import { Suspense } from "react";
import { PlanScreen } from "@/components/plan/PlanScreen";

export const metadata = { title: "Plan · Preppy" };

export default function PlanPage() {
  return (
    <Suspense>
      <PlanScreen />
    </Suspense>
  );
}
