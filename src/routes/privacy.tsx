import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { APP_URL } from "../lib/site"

export const Route = createFileRoute("/privacy")({
  head: () => {
    const title = "Privacy Policy | PrivacyGPT"
    const description =
      "PrivacyGPT's privacy policy. We collect no cookies, no analytics, and no personally identifiable information. Open, transparent, privacy-first."
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${APP_URL}/privacy` },
        { property: "og:image", content: `${APP_URL}/og-image.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: `${APP_URL}/og-image.png` },
      ],
      links: [{ rel: "canonical", href: `${APP_URL}/privacy` }],
      scripts: [
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
                name: "Privacy Policy",
                item: `${APP_URL}/privacy`,
              },
            ],
          }),
        },
      ],
    }
  },
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <main className="shell py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-[var(--dur-micro)] hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Tracker
      </Link>

      <header className="mx-auto mt-6 max-w-[56ch] border-b border-rule pb-10">
        <h1>Privacy Policy</h1>
        <p className="lead mt-4 text-ink-2">
          How we handle your data, and why there’s almost nothing to handle.
        </p>
        <p className="mt-4 text-sm text-muted">
          Effective date: <span className="measured">June 23, 2026</span>
        </p>
      </header>

      <article className="mx-auto mt-12 max-w-[56ch]">
        <section className="pt-0">
          <h2>What we collect</h2>
          <h3 className="mt-6">Nothing personal.</h3>
          <p className="mt-3 leading-relaxed text-ink-2">
            PrivacyGPT has no user accounts, no login system, and no analytics
            tracking. We do not collect cookies, IP addresses, browser
            fingerprints, or any personally identifiable information. There is
            simply no mechanism on this site to gather or store data about you.
          </p>
        </section>

        <section className="mt-14 border-t border-rule pt-8">
          <h2>Hosting and infrastructure</h2>
          <h3 className="mt-6">Cloudflare Workers</h3>
          <p className="mt-3 leading-relaxed text-ink-2">
            This site is hosted on Cloudflare Workers. Cloudflare may retain
            standard CDN-level request logs (e.g., timestamps, requested URLs)
            for operational and security purposes. These logs are not used for
            tracking, profiling, or advertising and are not linked to any
            personal identity.
          </p>
        </section>

        <section className="mt-14 border-t border-rule pt-8">
          <h2>How we source our data</h2>
          <h3 className="mt-6">Public policies only</h3>
          <p className="mt-3 leading-relaxed text-ink-2">
            All company data displayed on PrivacyGPT is sourced from publicly
            available privacy policies, terms of service, and official help
            documentation. We use automated tools to scrape and parse these
            public documents. No proprietary, confidential, or non-public data
            is ever collected or stored.
          </p>
        </section>

        <section className="mt-14 border-t border-rule pt-8">
          <h2>Data freshness</h2>
          <h3 className="mt-6">Verified daily, but not in real-time</h3>
          <p className="mt-3 leading-relaxed text-ink-2">
            Company profiles are re-verified and re-scraped daily via an
            automated watchdog pipeline. However, AI companies may update their
            policies at any time. PrivacyGPT may not reflect the most recent
            changes immediately.{" "}
            <strong className="font-medium text-ink">
              Always consult the company’s current privacy policy directly
              before making decisions.
            </strong>
          </p>
        </section>

        <section className="mt-14 border-t border-rule pt-8">
          <h2>Third-party services</h2>
          <h3 className="mt-6">No ads. No trackers. No analytics.</h3>
          <p className="mt-3 leading-relaxed text-ink-2">
            PrivacyGPT does not integrate with any advertising networks,
            analytics providers, or data brokers. The only third-party
            infrastructure used is Cloudflare for hosting and content delivery.
          </p>
        </section>

        <section className="mt-14 border-t border-rule pt-8">
          <h2>Contact</h2>
          <p className="mt-3 leading-relaxed text-ink-2">
            If you have questions about this privacy policy or how PrivacyGPT
            handles data, contact us at{" "}
            <a
              href="mailto:me@lynicis.dev"
              className="font-medium text-signal underline underline-offset-2 hover:text-ink"
            >
              me@lynicis.dev
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  )
}
