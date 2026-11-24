import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"
import { getBlogPostsFn } from "../lib/blog"
import { APP_URL } from "../lib/site"

export const Route = createFileRoute("/blog/")({
  head: () => {
    const title = "AI Privacy Blog & Opt-Out Guides | PrivacyGPT"
    const description =
      "Privacy insights, rankings, and step-by-step opt-out guides explaining how major AI companies handle your conversational data."
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${APP_URL}/blog` },
        { property: "og:image", content: `${APP_URL}/og-image.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: `${APP_URL}/og-image.png` },
      ],
      links: [{ rel: "canonical", href: `${APP_URL}/blog` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            url: `${APP_URL}/blog`,
            description,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: APP_URL,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: `${APP_URL}/blog`,
              },
            ],
          }),
        },
      ],
    }
  },
  loader: async () => {
    const posts = await getBlogPostsFn()
    return { posts }
  },
  component: BlogIndex,
})

function BlogIndex() {
  const { posts } = Route.useLoaderData()

  return (
    <main className="shell py-10 sm:py-12">
      <header className="head-block">
        <h1>Blog</h1>
        <p>Privacy insights and guides</p>
      </header>

      <div>
        {posts.map((post) => (
          <article
            key={post.slug}
            className="grid gap-3 border-b border-rule py-8 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-10"
          >
            <div className="measured flex items-baseline gap-3 text-muted sm:flex-col sm:items-start sm:gap-1">
              <time dateTime={post.publishDate}>
                {new Date(post.publishDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </time>
              <span>{post.readingTime} min read</span>
            </div>

            <div>
              <h2 className="text-md sm:text-title">
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="hover:text-signal"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="mt-3 max-w-[62ch] text-ink-2">{post.description}</p>
              <Link
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-signal"
              >
                Read more
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
