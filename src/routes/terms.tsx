import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { APP_URL } from "../lib/site"

export const Route = createFileRoute("/terms")({
  head: () => {
    const title = "Terms of Usage | PrivacyGPT"
    const description =
      "PrivacyGPT terms of usage. Informational AI privacy comparison tool, not legal advice. Read our terms before using the service."
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${APP_URL}/terms` },
        { property: "og:image", content: `${APP_URL}/og-image.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: `${APP_URL}/og-image.png` },
      ],
      links: [{ rel: "canonical", href: `${APP_URL}/terms` }],
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
                name: "Terms of Usage",
                item: `${APP_URL}/terms`,
              },
            ],
          }),
        },
      ],
    }
  },
  component: TermsPage,
})

function TermsPage() {
  return (
    <main className="shell py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-[var(--dur-micro)] hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Tracker
      </Link>

      <header className="mx-auto mt-6 max-w-[56ch] border-b border-rule pb-10">
        <h1>Terms of Usage</h1>
        <p className="lead mt-4 text-ink-2">
          The ground rules for using PrivacyGPT.
        </p>
        <p className="mt-4 text-sm text-muted">
          Effective date: <span className="measured">June 23, 2026</span>
        </p>
      </header>

      <article className="mx-auto mt-12 max-w-[56ch]">
        <section className="pt-0">
          <h2>Purpose</h2>
          <h3 className="mt-6">An informational tool, not legal advice</h3>
          <p className="mt-3 leading-relaxed text-ink-2">
            PrivacyGPT is a comparison and awareness tool. It aggregates
            publicly available privacy policy data from AI companies to help
            users make informed decisions. Nothing on this site constitutes
            legal advice, and no attorney-client relationship is formed by using
            PrivacyGPT.
          </p>
        </section>

        <section className="mt-14 border-t border-rule pt-8">
          <h2>Data accuracy</h2>
          <h3 className="mt-6">Policies change, verify directly</h3>
          <p className="mt-3 leading-relaxed text-ink-2">
            AI companies update their privacy policies and terms of service
            frequently. PrivacyGPT re-scrapes and re-verifies company data daily
            via an automated pipeline, but there may be a delay between a policy
            change and our updated display.{" "}
            <strong className="font-medium text-ink">
              Always consult the company’s current privacy policy and terms of
              service directly before making decisions.
            </strong>{" "}
            PrivacyGPT is not a substitute for reading the actual legal
            documents.
          </p>
        </section>

        <section className="mt-14 border-t border-rule pt-8">
          <h2>No warranty</h2>
          <h3 className="mt-6">Provided “as is”</h3>
          <p className="mt-3 leading-relaxed text-ink-2">
            PrivacyGPT is provided on an “as is” and “as available” basis
            without warranties of any kind, either express or implied. We do not
            guarantee the accuracy, completeness, reliability, or timeliness of
            any data displayed on this site.
          </p>
        </section>

        <section className="mt-14 border-t border-rule pt-8">
          <h2>Limitation of liability</h2>
          <h3 className="mt-6">Use at your own discretion</h3>
          <p className="mt-3 leading-relaxed text-ink-2">
            In no event shall PrivacyGPT, its operator, or affiliates be liable
            for any direct, indirect, incidental, special, consequential, or
            punitive damages arising out of or related to your use of or
            reliance on the information provided by this service. This includes,
            but is not limited to, decisions made based on PrivacyGPT data
            regarding AI platform selection, privacy configurations, or data
            handling practices.
          </p>
        </section>

        <section className="mt-14 border-t border-rule pt-8">
          <h2>Intellectual property</h2>
          <h3 className="mt-6">Proprietary content</h3>
          <p className="mt-3 leading-relaxed text-ink-2">
            The site design, user interface, scoring methodology, data
            presentation, and all original content on PrivacyGPT are
            proprietary. Company names, logos, and trademarks referenced on this
            site belong to their respective owners. PrivacyGPT is not affiliated
            with, endorsed by, or connected to any AI company whose data it
            displays.
          </p>
        </section>

        <section className="mt-14 border-t border-rule pt-8">
          <h2>Governing law</h2>
          <h3 className="mt-6">Applicable jurisdiction</h3>
          <p className="mt-3 leading-relaxed text-ink-2">
            These terms shall be governed by and construed in accordance with
            applicable law. Any disputes arising from these terms or your use of
            PrivacyGPT shall be resolved in the competent courts of the
            applicable jurisdiction.
          </p>
        </section>

        <section className="mt-14 border-t border-rule pt-8">
          <h2>Contact</h2>
          <p className="mt-3 leading-relaxed text-ink-2">
            If you have questions about these terms, contact us at{" "}
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
