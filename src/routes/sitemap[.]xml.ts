import { createFileRoute } from "@tanstack/react-router"
import { getDb, companies } from "../lib/db"
import { getBlogPosts } from "../lib/blog"
import { escapeXml } from "../lib/feeds"
import { APP_URL } from "../lib/site"

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const db = await getDb()
          const [rows, blogPosts] = await Promise.all([
            db
              .select({
                companyKey: companies.companyKey,
                lastVerifiedDate: companies.lastVerifiedDate,
              })
              .from(companies),
            getBlogPosts(),
          ])

          const now = new Date().toISOString()

          const urls = [
            {
              loc: APP_URL,
              lastmod: now,
              changefreq: "weekly",
              priority: "1.0",
            },
            {
              loc: `${APP_URL}/methodology`,
              lastmod: now,
              changefreq: "monthly",
              priority: "0.8",
            },
            {
              loc: `${APP_URL}/compare`,
              lastmod: now,
              changefreq: "monthly",
              priority: "0.8",
            },
            {
              loc: `${APP_URL}/changelog`,
              lastmod: now,
              changefreq: "daily",
              priority: "0.7",
            },
            {
              loc: `${APP_URL}/faq`,
              lastmod: now,
              changefreq: "monthly",
              priority: "0.8",
            },
            {
              loc: `${APP_URL}/blog`,
              lastmod: now,
              changefreq: "weekly",
              priority: "0.8",
            },
            ...rows.map((row) => ({
              loc: `${APP_URL}/company/${row.companyKey}`,
              lastmod: row.lastVerifiedDate || now,
              changefreq: "weekly" as const,
              priority: "0.9",
            })),
            ...blogPosts.map((post) => ({
              loc: `${APP_URL}/blog/${post.slug}`,
              lastmod: post.publishDate
                ? new Date(post.publishDate).toISOString()
                : now,
              changefreq: "monthly" as const,
              priority: "0.7",
            })),
          ]

          const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${escapeXml(u.lastmod)}</lastmod>
    <changefreq>${escapeXml(u.changefreq)}</changefreq>
    <priority>${escapeXml(u.priority)}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`

          return new Response(xml, {
            status: 200,
            headers: {
              "Content-Type": "application/xml",
              "Cache-Control": "public, max-age=3600, s-maxage=3600",
            },
          })
        } catch (error) {
          console.error("Error generating sitemap:", error)
          return new Response("Error generating sitemap", {
            status: 500,
            headers: {
              "Content-Type": "text/plain",
            },
          })
        }
      },
    },
  },
})
