import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "မီးဇယား",
    short_name: "မီးဇယား",
    description: "မြန်မာနိုင်ငံ လျှပ်စစ်မီး ဖွင့်/ပိတ် ဇယား",
    lang: "my",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#2563eb",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "လအလိုက် ဇယား", url: "/calendar" },
      { name: "Chat", url: "/chat" },
    ],
  };
}
