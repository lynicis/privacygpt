import { createFileRoute } from "@tanstack/react-router"
import { desc, eq } from "drizzle-orm"
import { getDb, companies, changelogs } from "../lib/db"
import { getBlogPosts } from "../lib/blog"
import { escapeXml } from "../lib/feeds"
import { APP_URL } from "../lib/site"

interface SitemapEntry {
  loc: string
  lastmod?: string
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const db = await getDb()
          const [rows, latestChangelog, blogPosts] = await Promise.all([
            db
              .select({
                companyKey: companies.companyKey,
                lastVerifiedDate: companies.lastVerifiedDate,
              })
              .from(companies)
              .where(eq(companies.hasValidPrivacyPolicy, true)),
            db
              .select({ detectedAt: changelogs.detectedAt })
              .from(changelogs)
              .orderBy(desc(changelogs.detectedAt))
              .limit(1),
            getBlogPosts(),
          ])

          const latestCompanyDate = rows
            .map((r) => r.lastVerifiedDate)
            .filter(Boolean)
            .sort()
            .at(-1)
          const latestChangelogDate =
            latestChangelog[0]?.detectedAt || latestCompanyDate
          const latestBlogDate = blogPosts
            .map((p) => p.publishDate)
            .filter(Boolean)
            .sort()
            .at(-1)

          const urls: SitemapEntry[] = [
            { loc: APP_URL, lastmod: latestCompanyDate },
            { loc: `${APP_URL}/methodology` },
            { loc: `${APP_URL}/compare` },
            { loc: `${APP_URL}/changelog`, lastmod: latestChangelogDate },
            { loc: `${APP_URL}/faq` },
            { loc: `${APP_URL}/blog`, lastmod: latestBlogDate },
            { loc: `${APP_URL}/privacy`, lastmod: "2026-06-23" },
            { loc: `${APP_URL}/terms`, lastmod: "2026-06-23" },
            ...rows.map((row) => ({
              loc: `${APP_URL}/company/${row.companyKey}`,
              lastmod: row.lastVerifiedDate || undefined,
            })),
            ...blogPosts.map((post) => ({
              loc: `${APP_URL}/blog/${post.slug}`,
              lastmod: post.publishDate || undefined,
            })),
          ]

          const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${escapeXml(u.loc)}</loc>${
        u.lastmod ? `\n    <lastmod>${escapeXml(u.lastmod)}</lastmod>` : ""
      }\n  </url>`
  )
  .join("\n")}
</urlset>`

          return new Response(xml, {
            status: 200,
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
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
