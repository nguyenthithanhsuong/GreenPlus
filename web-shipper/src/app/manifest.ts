import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "GreenPlus Shipper",
    short_name: "GreenPlus Shipper",
    description: "GreenPlus - Giao hàng",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ecfdf5",
    theme_color: "#07834b",
    lang: "vi",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
