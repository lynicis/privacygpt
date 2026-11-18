import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"
import { getBlogPostsFn } from "../lib/blog"
import { APP_URL } from "../lib/site"

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog - PrivacyGPT" },
      {
        name: "description",
        content:
          "Privacy insights, guides, and analysis on how major AI companies handle your conversational data.",
      },
      { property: "og:title", content: "Blog - PrivacyGPT" },
      {
        property: "og:description",
        content:
          "Privacy insights, guides, and analysis on how major AI companies handle your conversational data.",
      },
      { property: "og:url", content: `${APP_URL}/blog` },
      { name: "twitter:title", content: "Blog - PrivacyGPT" },
      {
        name: "twitter:description",
        content:
          "Privacy insights, guides, and analysis on how major AI companies handle your conversational data.",
      },
    ],
    links: [{ rel: "canonical", href: `${APP_URL}/blog` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Blog - PrivacyGPT",
          url: `${APP_URL}/blog`,
          description:
            "Privacy insights, guides, and analysis on how major AI companies handle your conversational data.",
        }),
      },
    ],
  }),
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
