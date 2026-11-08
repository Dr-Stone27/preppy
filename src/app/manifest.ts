import type { MetadataRoute } from "next";

/** Used when someone adds Preppy to their home screen from the browser. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Preppy",
    short_name: "Preppy",
    description: "Save recipes, cook twice a week, shop the way you shop.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFDF9",
    theme_color: "#FFFDF9",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
