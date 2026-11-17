import { createFileRoute } from "@tanstack/react-router"
import { getBlogPostsFn } from "../lib/blog"
import { escapeXml } from "../lib/feeds"
import { APP_URL } from "../lib/site"

export const Route = createFileRoute("/blog/feed.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const posts = await getBlogPostsFn()

          const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PrivacyGPT Blog</title>
    <link>${APP_URL}/blog</link>
    <description>Privacy insights and guides for AI-conscious users</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${APP_URL}/blog/feed.xml" rel="self" type="application/rss+xml" />
    ${posts
      .map(
        (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${APP_URL}/blog/${post.slug}</link>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.publishDate).toUTCString()}</pubDate>
      <guid>${APP_URL}/blog/${post.slug}</guid>
      <author>${escapeXml(post.author)}</author>
    </item>`
      )
      .join("")}
  </channel>
</rss>`

          return new Response(rss, {
            status: 200,
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
            },
          })
        } catch (error) {
          console.error("Error generating blog RSS feed response:", error)
          return new Response("Error generating RSS feed", {
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
