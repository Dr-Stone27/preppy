import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Preppy",
    short_name: "Preppy",
    description: "Save recipes, cook twice a week, shop the way you shop.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFDF9",
    theme_color: "#FFFDF9",
    // App icons are designed in the PWA slice; the favicon stands in until then.
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
