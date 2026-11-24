import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Shield, Trash2, Share2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_URL } from "../lib/site"

const faqs = [
  {
    icon: Shield,
    question: "Which AI companies train on your conversations by default?",
    answer:
      "OpenAI (ChatGPT), Google (Gemini), Anthropic (Claude), Meta (Llama), and Perplexity all have opt-out mechanisms but train on your data unless you turn them off. Apple and Mistral do not train on user data by default.",
    link: "/",
    linkText: "View all companies",
  },
  {
    icon: Trash2,
    question: "Can you delete your AI conversation history?",
    answer:
      "Most major AI companies let you request deletion. OpenAI, Anthropic, Google, and Meta all offer deletion options. How long they keep your data before deleting varies, though, from about 30 days to 3 years depending on the company.",
    link: "/methodology",
    linkText: "See scoring criteria",
  },
  {
    icon: Share2,
    question: "Which AI chatbots share data with third parties?",
    answer:
      "We track third-party sharing across 30+ AI platforms. OpenAI, Google, and Microsoft all share data with service providers, while Mistral and Apple have stricter policies around who gets access to your conversations.",
    link: "/compare",
    linkText: "Compare companies",
  },
  {
    icon: Info,
    question: "What is PrivacyGPT and how does it work?",
    answer:
      "PrivacyGPT monitors how major AI companies handle your conversations. It covers training defaults, opt-out options, data retention, deletion rights, and third-party sharing, all pulled from the companies' own privacy policies and documentation.",
    link: "/methodology",
    linkText: "Read methodology",
  },
]

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      {
        title: "Frequently Asked Questions | PrivacyGPT",
      },
      {
        name: "description",
        content:
          "Get answers about AI data privacy. Learn which AI companies train on your conversations, how to delete your data, and which chatbots share data with third parties.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:title",
        content: "Frequently Asked Questions | PrivacyGPT",
      },
      {
        property: "og:description",
        content:
          "Get answers about AI data privacy. Learn which AI companies train on your conversations, how to delete your data, and which chatbots share data with third parties.",
      },
      {
        property: "og:url",
        content: `${APP_URL}/faq`,
      },
      {
        property: "og:image",
        content: `${APP_URL}/og-image.png`,
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Frequently Asked Questions | PrivacyGPT",
      },
      {
        name: "twitter:description",
        content:
          "Get answers about AI data privacy. Learn which AI companies train on your conversations, how to delete your data, and which chatbots share data with third parties.",
      },
      {
        name: "twitter:image",
        content: `${APP_URL}/og-image.png`,
      },
    ],
    links: [{ rel: "canonical", href: `${APP_URL}/faq` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
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
              name: "FAQ",
              item: `${APP_URL}/faq`,
            },
          ],
        }),
      },
    ],
  }),
  component: FAQPage,
})

function FAQPage() {
  return (
    <main className="shell py-8">
      <div className="mx-auto w-full max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="-ml-3 gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Tracker
          </Link>
        </Button>

        {/* The document's head: one title, one line. */}
        <header className="mt-6 border-b border-rule pb-10">
          <h1>Frequently Asked Questions</h1>
          <p className="mt-4 max-w-[52ch] text-lead text-ink-2">
            Get answers about AI data privacy and how PrivacyGPT works.
          </p>
        </header>

        {/* Questions on hairlines, one document, no cards. */}
        <div>
          {faqs.map((faq) => {
            const Icon = faq.icon
            return (
              <section key={faq.question} className="border-b border-rule py-8">
                <h2 className="flex items-start gap-2.5 text-title">
                  <Icon
                    className="mt-1 h-5 w-5 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                  {faq.question}
                </h2>
                <p className="mt-3 max-w-[65ch] text-ink-2">{faq.answer}</p>
                <div className="mt-4">
                  <Button asChild variant="link" className="h-auto p-0 text-sm">
                    <Link to={faq.link}>{faq.linkText}</Link>
                  </Button>
                </div>
              </section>
            )
          })}
        </div>

        <div className="mt-16 border-t border-rule pt-6 text-sm text-muted-foreground">
          <p>
            Have more questions? Check our{" "}
            <Link
              to="/methodology"
              className="text-ink underline decoration-rule-2 underline-offset-4 hover:decoration-signal"
            >
              methodology
            </Link>{" "}
            or{" "}
            <Link
              to="/"
              className="text-ink underline decoration-rule-2 underline-offset-4 hover:decoration-signal"
            >
              explore the dashboard
            </Link>{" "}
            to see detailed privacy data for 30+ AI platforms.
          </p>
        </div>
      </div>
    </main>
  )
}
