import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ฟาร์มด้วง | Beetle Farm Management",
    short_name: "ฟาร์มด้วง",
    description: "ระบบจัดการฟาร์มด้วงครบวงจร",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f7f2",
    theme_color: "#4b6b4f",
    lang: "th",
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}