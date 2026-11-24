import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { ArrowLeft, Clock, User } from "lucide-react"
import { getBlogPostBySlugFn } from "../lib/blog"
import { lazy, Suspense, useMemo } from "react"
import type { ComponentType } from "react"
import { APP_URL } from "../lib/site"

const postModules = import.meta.glob<{ default: ComponentType }>(
  "../content/blog/*.mdx"
)

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getBlogPostBySlugFn({ data: params.slug })
    if (!post) throw notFound()
    return { post }
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post
    if (!post) {
      return { meta: [{ title: "Post not found | PrivacyGPT" }] }
    }
    const url = post.canonicalUrl || `${APP_URL}/blog/${post.slug}`
    const title =
      post.title.length <= 48 ? `${post.title} | PrivacyGPT` : post.title
    return {
      meta: [
        { title },
        { name: "description", content: post.description },
        { property: "og:type", content: "article" },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.description },
        { property: "og:url", content: url },
        { property: "og:image", content: `${APP_URL}/og-image.png` },
        { property: "article:published_time", content: post.publishDate },
        { property: "article:author", content: post.author },
        ...post.tags.map((tag) => ({
          property: "article:tag",
          content: tag,
        })),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: post.title },
        { name: "twitter:description", content: post.description },
        { name: "twitter:image", content: `${APP_URL}/og-image.png` },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": post.type,
            headline: post.title,
            description: post.description,
            image: `${APP_URL}/og-image.png`,
            author: {
              "@type": "Organization",
              name: post.author,
              url: APP_URL,
            },
            publisher: {
              "@type": "Organization",
              name: "PrivacyGPT",
              url: APP_URL,
              logo: {
                "@type": "ImageObject",
                url: `${APP_URL}/pwa-512x512.png`,
                width: 512,
                height: 512,
              },
            },
            datePublished: post.publishDate,
            dateModified: post.publishDate,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": url,
            },
            keywords: post.tags.join(", "),
            url,
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
              {
                "@type": "ListItem",
                position: 3,
                name: post.title,
                item: url,
              },
            ],
          }),
        },
      ],
    }
  },
  component: BlogPost,
  notFoundComponent: () => (
    <main className="shell py-16">
      <div className="mx-auto w-full max-w-[68ch]">
        <h1>Post not found</h1>
        <Link
          to="/blog"
          className="mt-4 inline-flex items-center gap-2 text-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to blog
        </Link>
      </div>
    </main>
  ),
})

function BlogPost() {
  const { post } = Route.useLoaderData()

  const PostComponent = useMemo(() => {
    const matchKey = `../content/blog/${post.slug}.mdx`
    const loadPost = postModules[matchKey] as
      (() => Promise<{ default: ComponentType }>) | undefined
    if (!loadPost) return null
    return lazy(loadPost)
  }, [post.slug])

  return (
    <main className="shell py-8">
      <div className="mx-auto w-full max-w-[60ch]">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors duration-[var(--dur-micro)] hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to blog
        </Link>

        {/* Header */}
        <header className="mt-6 border-b border-rule pb-8">
          <h1 className="max-w-[24ch] text-display-s">{post.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
            <span className="measured flex items-center gap-1.5">
              <User className="h-4 w-4" aria-hidden="true" />
              {post.author}
            </span>
            <time className="measured" dateTime={post.publishDate}>
              {new Date(post.publishDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "UTC",
              })}
            </time>
            <span className="measured flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {post.readingTime} min read
            </span>
          </div>
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Content */}
        <div className="prose mt-10">
          {PostComponent ? (
            <Suspense
              fallback={<p className="measured text-muted">Loading…</p>}
            >
              <PostComponent />
            </Suspense>
          ) : (
            <p className="text-bad">Error loading post content.</p>
          )}
        </div>
      </div>
    </main>
  )
}
