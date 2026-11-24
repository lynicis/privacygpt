import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { getCompanyByKeyFn } from "../lib/api"
import {
  calculateSubScores,
  calculateTotalScore,
  mapScoreToGrade,
  DEFAULT_WEIGHTS,
} from "../lib/scoring"
import { APP_URL } from "../lib/site"
import { SUB_SCORE_UI } from "../components/score-meta"
import {
  ArrowLeft,
  ExternalLink,
  Database,
  ToggleLeft,
  Clock,
  Share2,
  Eye,
  Globe,
  UserX,
  Building2,
  Calendar,
  AlertTriangle,
  GitCompareArrows,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfidenceBadge } from "@/components/ConfidenceBadge"
import { getSubScoreColor } from "../lib/score-style"

export const Route = createFileRoute("/company/$companyKey")({
  loader: async ({ params }) => {
    const company = await getCompanyByKeyFn({ data: params.companyKey })
    if (!company) throw notFound()
    return company
  },
  head: ({ loaderData }) => {
    const company = loaderData
    if (!company) {
      return { meta: [{ title: "Company Not Found | PrivacyGPT" }] }
    }
    const subScores = calculateSubScores(company)
    const totalScore = calculateTotalScore(subScores, DEFAULT_WEIGHTS)
    const grade = mapScoreToGrade(totalScore)
    const url = `${APP_URL}/company/${company.companyKey}`

    const baseTitle = `${company.companyName} Privacy Policy & Grade (${grade}) | PrivacyGPT`
    const fullTitle = `${company.companyName} ${company.productName} Privacy (${grade}) | PrivacyGPT`
    const title = fullTitle.length <= 60 ? fullTitle : baseTitle

    const trainsSummary = company.trainsOnDataByDefault
      ? "Trains on chats by default"
      : "Does not train by default"
    const optOutSummary = company.optOutAvailable
      ? "opt-out available"
      : "no opt-out"
    const rawDescription = `${company.companyName} (${company.productName}) privacy grade: ${grade} (${totalScore}/100). ${trainsSummary}, ${optOutSummary}. Verified against official policy.`
    const description =
      rawDescription.length > 158
        ? `${rawDescription.slice(0, 155).trimEnd()}…`
        : rawDescription

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:image", content: `${APP_URL}/og-image.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: `${APP_URL}/og-image.png` },
      ],
      links: [{ rel: "canonical", href: url }],
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
                name: company.companyName,
                item: url,
              },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: title,
            description,
            url,
            dateModified: company.lastVerifiedDate,
            about: {
              "@type": "Organization",
              name: company.companyName,
            },
            citation: company.sourceUrl,
          }),
        },
      ],
    }
  },
  notFoundComponent: () => (
    <main className="shell py-20">
      <AlertTriangle className="mb-4 h-6 w-6 text-signal" aria-hidden="true" />
      <h1 className="max-w-[20ch]">Company not found</h1>
      <p className="mt-3 max-w-[48ch] text-muted-foreground">
        The requested company privacy profile could not be found or has not been
        seeded yet.
      </p>
      <Button asChild className="mt-6" variant="outline">
        <Link to="/">Back to the register</Link>
      </Button>
    </main>
  ),
  component: CompanyDetailPage,
})

function CompanyDetailPage() {
  const company = Route.useLoaderData()

  const subScores = calculateSubScores(company)
  const totalScore = calculateTotalScore(subScores, DEFAULT_WEIGHTS)
  const overallGrade = mapScoreToGrade(totalScore)

  const rows = [
    {
      icon: Database,
      title: "Default model training",
      value: company.trainsOnDataByDefault,
      valueLabel: company.trainsOnDataByDefault
        ? "Trains by default"
        : "Off by default",
      bad: company.trainsOnDataByDefault,
      body: company.trainsOnDataNuance,
    },
    {
      icon: ToggleLeft,
      title: "Opt-out mechanism",
      value: company.optOutAvailable,
      valueLabel: company.optOutAvailable ? "Opt-out available" : "No opt-out",
      bad: !company.optOutAvailable,
      body: company.optOutHow,
    },
    {
      icon: Eye,
      title: "Human review of chats",
      value: company.humanReviewOfChats,
      valueLabel: company.humanReviewOfChats ? "Reviewed" : "Not reviewed",
      bad: company.humanReviewOfChats,
      body: company.humanReviewConditions,
    },
    {
      icon: Share2,
      title: "Third-party sharing",
      value: null,
      valueLabel: null,
      bad: false,
      body: company.thirdPartySharing,
    },
  ] as const

  return (
    <main className="shell py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-[var(--dur-micro)] hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to the
        register
      </Link>

      {/* The record's head: identity, dates, grade, one action. */}
      <header className="mt-6 grid gap-10 border-b border-rule pb-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div>
          <h1 className="max-w-[18ch]">{company.companyName}</h1>
          <p className="mt-3 text-lg text-ink-2">{company.productName}</p>

          {company.confidence === "unverified" && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-[6px] border border-signal/40 bg-signal-soft px-3 py-1.5 text-sm text-signal">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Policy not verified. Data may be inaccurate.
            </p>
          )}

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted" aria-hidden="true" />
              <dt className="text-muted">Verified</dt>
              <dd className="measured text-ink-2">
                {company.lastVerifiedDate}
              </dd>
            </div>
            {company.lastChangedDate && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted" aria-hidden="true" />
                <dt className="text-muted">Changed</dt>
                <dd className="measured text-ink-2">
                  {company.lastChangedDate}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            {company.optOutAvailable && company.optOutUrl && (
              <Button asChild size="lg">
                <a
                  href={company.optOutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Opt out of training
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
            )}
            <Button asChild variant="outline" size="lg">
              <a
                href={company.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the source policy
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/compare" search={{ companyA: company.companyKey }}>
                <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
                Compare {company.companyName}
              </Link>
            </Button>
          </div>
        </div>

        <div className="panel p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="label">Overall grade</div>
              <div className="reading mt-2 text-[5rem]">{overallGrade}</div>
            </div>
            <div className="pb-2 text-right">
              <div className="measured text-2xl text-ink">{totalScore}</div>
              <div className="label mt-1">of 100</div>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-rule pt-4">
            <ConfidenceBadge value={company.confidence} size="md" />
            <a
              href={company.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[var(--dur-micro)] hover:text-ink"
            >
              Primary source{" "}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <div className="grid gap-12 pt-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
        <div>
          {/* Six readings in one surface. */}
          <section aria-labelledby="breakdown">
            <div className="head-block">
              <h2 id="breakdown">Privacy grade breakdown</h2>
              <p>
                Weighted from the six policy factors below. The formula lives in
                the methodology.
              </p>
            </div>
            <div className="panels grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {SUB_SCORE_UI.map(({ key, longLabel }) => (
                <div key={key} className="p-4">
                  <div className="label min-h-10">{longLabel}</div>
                  <div className="measured mt-3 text-xl text-ink">
                    {mapScoreToGrade(subScores[key])}
                  </div>
                  <div className="measured mt-1 text-sm text-muted">
                    {subScores[key]}/100
                  </div>
                  <div className="bar mt-3">
                    <span
                      className={getSubScoreColor(subScores[key])}
                      style={{ width: `${subScores[key]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* The policy record, as an audit trail. */}
          <section aria-labelledby="policy" className="mt-16">
            <div className="head-block">
              <h2 id="policy">Policy details</h2>
              <p>
                What the company’s own documents state, with the nuance kept.
              </p>
            </div>

            <div className="border-t border-rule">
              {rows.map(({ icon: Icon, title, valueLabel, bad, body }) => (
                <div
                  key={title}
                  className="grid gap-3 border-b border-rule py-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:gap-8"
                >
                  <h3 className="flex items-start gap-2 text-md font-medium">
                    <Icon
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted"
                      aria-hidden="true"
                    />
                    {title}
                  </h3>
                  <div>
                    {valueLabel && (
                      <span
                        className={`chip mb-3 ${bad ? "chip--bad" : "chip--ok"}`}
                      >
                        {valueLabel}
                      </span>
                    )}
                    <p className="max-w-[68ch] text-md leading-relaxed text-ink-2">
                      {body}
                    </p>
                  </div>
                </div>
              ))}

              <div className="grid gap-3 border-b border-rule py-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:gap-8">
                <h3 className="flex items-start gap-2 text-md font-medium">
                  <Clock
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                  Data retention and deletion
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="label">Retention period</div>
                    <p className="mt-1.5 text-md leading-relaxed text-ink-2">
                      {company.retentionPeriod}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="label">Deletion on request</span>
                      <span
                        className={`chip ${company.dataDeletedOnRequest ? "chip--ok" : "chip--bad"}`}
                      >
                        {company.dataDeletedOnRequest ? "Yes" : "No"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-md leading-relaxed text-ink-2">
                      {company.dataDeletedOnRequestTimeframe}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Context around the record. */}
        <aside
          aria-labelledby="context"
          className="lg:border-l lg:border-rule lg:pl-10"
        >
          <h2 id="context" className="text-title">
            Context and variations
          </h2>
          <div className="mt-6 space-y-8">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4 text-muted" aria-hidden="true" />
                Regional variations
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {company.regionalVariation}
              </p>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <UserX className="h-4 w-4 text-muted" aria-hidden="true" />
                Children’s data policy
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {company.childrenDataPolicy}
              </p>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4 text-muted" aria-hidden="true" />
                Enterprise vs consumer
              </h3>
              {company.enterpriseVsConsumerDifference && (
                <span className="chip chip--signal mt-2">Different terms</span>
              )}
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {company.enterpriseVsConsumerSummary}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
