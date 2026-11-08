import { Suspense } from "react";
import { AddRecipe } from "@/components/add/AddRecipe";
import { ScreenHeader, Stack } from "@/components/ui/Layout";

export const metadata = { title: "Add a recipe · Preppy" };

export default function AddPage() {
  return (
    <Stack gap={4}>
      <ScreenHeader title="Add a recipe" />
      <Suspense>
        <AddRecipe />
      </Suspense>
    </Stack>
  );
}
