import { Suspense } from "react";
import { ShopScreen } from "@/components/shop/ShopScreen";

export const metadata = { title: "Shop · Preppy" };

export default function ShopPage() {
  return (
    <Suspense>
      <ShopScreen />
    </Suspense>
  );
}
