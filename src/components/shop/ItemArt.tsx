import { itemArt } from "@/domain/shop/itemArt";

/** The 3D picture for a shopping or pantry item. Decorative: the item's name is always written beside it. */
export function ItemArt({ name, group, size = 28, className }: { name: string; group?: string; size?: number; className?: string }) {
  const { src, filter } = itemArt(name, group);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" aria-hidden width={size} height={size} loading="lazy" decoding="async" className={className} style={{ filter, flex: "none" }} />;
}
