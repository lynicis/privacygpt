import { createServerFn } from "@tanstack/react-start"

export interface BlogPostMeta {
  title: string
  slug: string
  description: string
  author: string
  tags: string[]
  publishDate: string
  canonicalUrl?: string
  type: string
  readingTime: number
}

const BLOG_POSTS: BlogPostMeta[] = [
  {
    title: "AI Privacy Rankings 2026: Which Chatbot Can You Actually Trust?",
    slug: "ai-privacy-rankings-2026",
    description:
      "We scored ChatGPT, Claude, Gemini, and Grok on data collection, training opt-out, deletion rights, and transparency. See which AI chatbot respects your privacy.",
    author: "PrivacyGPT",
    tags: [
      "ai-privacy",
      "rankings",
      "comparison",
      "chatgpt",
      "claude",
      "gemini",
    ],
    publishDate: "2026-06-23",
    canonicalUrl:
      "https://privacygpt.lynicis.dev/blog/ai-privacy-rankings-2026",
    type: "BlogPosting",
    readingTime: 8,
  },
  {
    title:
      "The Privacy Paradox: Why 81% of Americans Worry About AI Data But Can't Stop Using It",
    slug: "ai-privacy-paradox",
    description:
      "81% of Americans are concerned about AI data privacy, yet daily AI use keeps growing. We explore why this paradox exists and how to protect yourself.",
    author: "PrivacyGPT",
    tags: ["ai-privacy", "privacy-paradox", "statistics", "consumer-behavior"],
    publishDate: "2026-06-23",
    canonicalUrl: "https://privacygpt.lynicis.dev/blog/ai-privacy-paradox",
    type: "BlogPosting",
    readingTime: 7,
  },
  {
    title: "How to Opt-Out of AI Training on Social Media",
    slug: "how-to-opt-out-ai-training",
    description:
      "How to opt out of AI training on LinkedIn, Meta, Google, and other major platforms.",
    author: "PrivacyGPT",
    tags: ["opt-out", "ai-training", "social-media", "privacy"],
    publishDate: "2026-06-22",
    canonicalUrl:
      "https://privacygpt.lynicis.dev/blog/how-to-opt-out-ai-training",
    type: "BlogPosting",
    readingTime: 4,
  },
  {
    title: "Does Delete Actually Work?",
    slug: "does-delete-actually-work",
    description:
      "When you delete your AI conversations, what really happens to your data? We investigate the truth behind the delete button.",
    author: "PrivacyGPT",
    tags: ["deletion", "ai-privacy", "data-retention", "privacy"],
    publishDate: "2026-06-21",
    canonicalUrl:
      "https://privacygpt.lynicis.dev/blog/does-delete-actually-work",
    type: "BlogPosting",
    readingTime: 4,
  },
]

export function getBlogPosts(): BlogPostMeta[] {
  return [...BLOG_POSTS].sort(
    (a, b) =>
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  )
}

export function getBlogPostBySlug(slug: string): BlogPostMeta | null {
  return BLOG_POSTS.find((p) => p.slug === slug) || null
}

export const getBlogPostsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    return getBlogPosts()
  }
)

export const getBlogPostBySlugFn = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    return getBlogPostBySlug(slug)
  })
