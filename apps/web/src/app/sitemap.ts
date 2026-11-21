import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/contacto`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/javiera`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/samuel`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
