"use server"

import { createServerFn } from "@tanstack/react-start"
import { getDb } from "./db"
import { companies, changelogs } from "./db/schema"
import { desc, eq } from "drizzle-orm"

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export const getRssFeedFn = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const db = await getDb()
      const rows = await db
        .select({
          id: changelogs.id,
          detectedAt: changelogs.detectedAt,
          status: changelogs.status,
          companyName: companies.companyName,
        })
        .from(changelogs)
        .leftJoin(companies, eq(changelogs.companyId, companies.id))
        .orderBy(desc(changelogs.detectedAt))
        .limit(50)

      const now = new Date().toUTCString()
      const siteUrl = "https://privacygpt.lynicis.dev"

      const items = rows
        .map((entry) => {
          const pubDate = new Date(entry.detectedAt).toUTCString()
          const title = `Policy change detected: ${entry.companyName}`
          const description = `Privacy policy change detected for ${entry.companyName}. Status: ${entry.status === "reviewed" ? "Reviewed" : "Pending review"}.`

          return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(siteUrl + "/changelog")}</link>
      <guid isPermaLink="false">privacygpt-changelog-${entry.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(entry.companyName || "Unknown")}</category>
    </item>`
        })
        .join("\n")

      return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PrivacyGPT — Policy Change Log</title>
    <link>${siteUrl}/changelog</link>
    <description>Automated tracking of privacy policy changes across major AI companies.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    ${items}
  </channel>
</rss>`
    } catch (error) {
      console.error("Failed to generate RSS feed:", error)
      throw new Error("Failed to generate RSS feed")
    }
  }
)
