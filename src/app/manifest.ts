import type { MetadataRoute } from "next";

/** Used when someone adds Preppy to their home screen from the browser. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Preppy",
    short_name: "Preppy",
    description: "Save recipes, cook on the days that suit you, shop the way you shop.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFDF9",
    theme_color: "#FFFDF9",
    // Android: Preppy appears in the share sheet once added to the home screen, and opens Add with what was shared.
    share_target: { action: "/add", method: "GET", params: { title: "title", text: "text", url: "url" } },
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
