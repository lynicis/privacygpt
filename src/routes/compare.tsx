import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { companiesQueryOptions, companyByKeyQueryOptions } from "@/lib/queries"
import { APP_URL } from "@/lib/site"
import {
  calculateSubScores,
  calculateTotalScore,
  mapScoreToGrade,
  DEFAULT_WEIGHTS,
} from "@/lib/scoring"
import { CompanySelect } from "@/components/CompanySelect"
import { CompareScores } from "@/components/CompareScores"
import { CompareSection } from "@/components/CompareSection"
import { Button } from "@/components/ui/button"
import {
  GitCompareArrows,
  ExternalLink,
  ArrowRightLeft,
  RotateCcw,
  BookOpen,
} from "lucide-react"

interface CompareSearch {
  companyA?: string
  companyB?: string
}

export const Route = createFileRoute("/compare")({
  validateSearch: (search: Record<string, unknown>): CompareSearch => ({
    companyA: (search.companyA as string) || undefined,
    companyB: (search.companyB as string) || undefined,
  }),
  loaderDeps: ({ search }) => ({
    companyA: search.companyA,
    companyB: search.companyB,
  }),
  loader: async ({ deps, context }) => {
    const [, companyA, companyB] = await Promise.all([
      context.queryClient.ensureQueryData(
        companiesQueryOptions({ limit: 1000 })
      ),
      deps.companyA
        ? context.queryClient.ensureQueryData(
            companyByKeyQueryOptions(deps.companyA)
          )
        : Promise.resolve(null),
      deps.companyB
        ? context.queryClient.ensureQueryData(
            companyByKeyQueryOptions(deps.companyB)
          )
        : Promise.resolve(null),
    ])
    return {
      companyAName: companyA?.companyName ?? null,
      companyBName: companyB?.companyName ?? null,
      hasParams: Boolean(deps.companyA || deps.companyB),
    }
  },
  head: ({ loaderData }) => {
    const nameA = loaderData?.companyAName
    const nameB = loaderData?.companyBName
    const hasPair = Boolean(nameA && nameB)
    const hasParams = loaderData?.hasParams ?? false
    const title = hasPair
      ? `${nameA} vs ${nameB} Privacy Policy Comparison | PrivacyGPT`
      : "Compare AI Privacy Policies Side by Side | PrivacyGPT"
    const description = hasPair
      ? `Compare ${nameA} and ${nameB} privacy policies side by side: training defaults, opt-out ease, data retention, deletion rights, and human review.`
      : "Compare how two AI companies handle your conversational data side by side: training defaults, opt-out mechanisms, retention, and human review."
    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...(hasParams ? [{ name: "robots", content: "noindex, follow" }] : []),
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${APP_URL}/compare` },
        { property: "og:image", content: `${APP_URL}/og-image.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: `${APP_URL}/og-image.png` },
      ],
      links: [{ rel: "canonical", href: `${APP_URL}/compare` }],
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
                name: "Compare",
                item: `${APP_URL}/compare`,
              },
            ],
          }),
        },
      ],
    }
  },
  component: ComparePage,
})

function ComparePage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: "/compare" })

  const selectedA = search.companyA ?? ""
  const selectedB = search.companyB ?? ""

  const { data: companiesData } = useQuery(
    companiesQueryOptions({ limit: 1000 })
  )
  const companies = companiesData?.companies ?? []

  const { data: companyA, isLoading: loadingA } = useQuery(
    companyByKeyQueryOptions(selectedA)
  )
  const { data: companyB, isLoading: loadingB } = useQuery(
    companyByKeyQueryOptions(selectedB)
  )

  const updateSearch = (
    next: Partial<Pick<CompareSearch, "companyA" | "companyB">>
  ) =>
    navigate({
      to: "/compare",
      search: (prev) => ({ ...prev, ...next }),
      replace: true,
    })

  const handleSwap = () => {
    updateSearch({
      companyA: selectedB || undefined,
      companyB: selectedA || undefined,
    })
  }

  const handleReset = () => {
    updateSearch({ companyA: undefined, companyB: undefined })
  }

  const invalidSelection =
    Boolean(selectedA && selectedB) &&
    !loadingA &&
    !loadingB &&
    (!companyA || !companyB)

  const hasSelection = selectedA && selectedB

  const scoresA = companyA ? calculateSubScores(companyA) : null
  const scoresB = companyB ? calculateSubScores(companyB) : null

  const totalScoreA = scoresA
    ? calculateTotalScore(scoresA, DEFAULT_WEIGHTS)
    : 0
  const totalScoreB = scoresB
    ? calculateTotalScore(scoresB, DEFAULT_WEIGHTS)
    : 0
  const totalA = { letter: mapScoreToGrade(totalScoreA), points: totalScoreA }
  const totalB = { letter: mapScoreToGrade(totalScoreB), points: totalScoreB }

  return (
    <>
      {/* Banner: one head, one line, one reference. */}
      <section className="border-b border-rule">
        <div className="shell flex flex-wrap items-end justify-between gap-6 py-10 sm:py-12">
          <div>
            <h1 className="max-w-[20ch] text-display-s">
              Two policies, side by side
            </h1>
            <p className="lead mt-3 max-w-[48ch] text-ink-2">
              Pick two platforms. Every difference below is read from their
              published terms.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/methodology">
              <BookOpen className="h-4 w-4" aria-hidden="true" /> Methodology
            </Link>
          </Button>
        </div>
      </section>

      {/* Main Content */}
      <main className="shell pt-6 pb-20">
        {/* Company Selection */}
        <div className="mb-6 rounded-[10px] border border-rule bg-paper-2 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <CompanySelect
                companies={companies}
                value={selectedA}
                onChange={(v) => updateSearch({ companyA: v || undefined })}
                disabledCompany={selectedB}
                label="First company"
              />
            </div>

            <div className="flex items-center justify-center self-center lg:px-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwap}
                disabled={!selectedA && !selectedB}
                title="Swap companies"
                aria-label="Swap companies"
              >
                <ArrowRightLeft
                  className="h-4 w-4 rotate-90"
                  aria-hidden="true"
                />
              </Button>
            </div>

            <div className="min-w-0 flex-1">
              <CompanySelect
                companies={companies}
                value={selectedB}
                onChange={(v) => updateSearch({ companyB: v || undefined })}
                disabledCompany={selectedA}
                label="Second company"
              />
            </div>

            {(selectedA || selectedB) && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 self-start lg:self-end"
                onClick={handleReset}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {!hasSelection && (
          <div className="rounded-[10px] border border-dashed border-rule-2 p-12 text-center">
            <GitCompareArrows
              className="mx-auto mb-4 h-6 w-6 text-muted"
              aria-hidden="true"
            />
            <h2 className="text-lg font-medium">Select two companies</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Choose two AI platforms above to compare their privacy policies,
              training defaults, and data handling practices.
            </p>
          </div>
        )}

        {/* Loading state for company comparison */}
        {hasSelection && (loadingA || loadingB) && (
          <div className="rounded-[10px] border border-rule bg-paper-2 p-12 text-center">
            <p className="measured text-muted" role="status">
              Reading both policies…
            </p>
          </div>
        )}

        {/* Invalid selection */}
        {invalidSelection && (
          <div className="mb-5 rounded-[10px] border border-signal/40 bg-signal-soft p-6 text-center">
            <h2 className="text-lg font-medium text-signal">
              Company not found
            </h2>
            <p className="mt-1 text-sm text-ink-2">
              Pick another company to compare.
            </p>
          </div>
        )}

        {/* Comparison Content */}
        {hasSelection && companyA && companyB && (
          <>
            {/* Scores Section */}
            <section className="mb-10" aria-labelledby="scores">
              <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-rule pb-3">
                <h2 id="scores" className="text-title">
                  Score breakdown
                </h2>
                <span className="measured text-sm text-muted">
                  weighted, 0 to 100
                </span>
              </div>
              <CompareScores
                scoresA={scoresA!}
                scoresB={scoresB!}
                totalA={totalA}
                totalB={totalB}
                nameA={companyA.companyName}
                nameB={companyB.companyName}
              />
            </section>

            {/* Source Links */}
            <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href={companyA.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-[10px] border border-rule bg-paper-2 p-4 transition-colors duration-[var(--dur-micro)] hover:border-rule-2 hover:bg-paper-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {companyA.companyName} source policy
                  </p>
                  <p className="measured mt-1 text-xs text-muted">
                    verified {companyA.lastVerifiedDate}
                  </p>
                </div>
                <ExternalLink
                  className="h-4 w-4 shrink-0 text-muted"
                  aria-hidden="true"
                />
              </a>
              <a
                href={companyB.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-[10px] border border-rule bg-paper-2 p-4 transition-colors duration-[var(--dur-micro)] hover:border-rule-2 hover:bg-paper-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {companyB.companyName} source policy
                  </p>
                  <p className="measured mt-1 text-xs text-muted">
                    verified {companyB.lastVerifiedDate}
                  </p>
                </div>
                <ExternalLink
                  className="h-4 w-4 shrink-0 text-muted"
                  aria-hidden="true"
                />
              </a>
            </div>

            {/* Policy Details */}
            <section aria-labelledby="details">
              <div className="mb-2 flex items-baseline justify-between gap-4 border-b border-rule pb-3">
                <h2 id="details" className="text-title">
                  Policy details
                </h2>
                <span className="measured text-sm text-muted">
                  {companyA.companyName} / {companyB.companyName}
                </span>
              </div>
              <div className="mb-2 hidden justify-between gap-3 border-b border-rule px-0 pb-2 sm:flex">
                <span className="label">{companyA.companyName}</span>
                <span className="label">{companyB.companyName}</span>
              </div>
              <div className="space-y-0">
                <CompareSection
                  label="Model training"
                  valueA={companyA.trainsOnDataNuance}
                  valueB={companyB.trainsOnDataNuance}
                  booleanA={companyA.trainsOnDataByDefault}
                  booleanB={companyB.trainsOnDataByDefault}
                  booleanGood={false}
                />
                <CompareSection
                  label="Opt-out mechanism"
                  valueA={companyA.optOutHow}
                  valueB={companyB.optOutHow}
                  booleanA={companyA.optOutAvailable}
                  booleanB={companyB.optOutAvailable}
                  booleanGood={true}
                />
                <CompareSection
                  label="Data retention and deletion"
                  valueA={`${companyA.retentionPeriod}. Deletion: ${companyA.dataDeletedOnRequestTimeframe}`}
                  valueB={`${companyB.retentionPeriod}. Deletion: ${companyB.dataDeletedOnRequestTimeframe}`}
                  booleanA={companyA.dataDeletedOnRequest}
                  booleanB={companyB.dataDeletedOnRequest}
                  booleanGood={true}
                />
                <CompareSection
                  label="Third-party sharing"
                  valueA={companyA.thirdPartySharing}
                  valueB={companyB.thirdPartySharing}
                />
                <CompareSection
                  label="Human review"
                  valueA={companyA.humanReviewConditions}
                  valueB={companyB.humanReviewConditions}
                  booleanA={companyA.humanReviewOfChats}
                  booleanB={companyB.humanReviewOfChats}
                  booleanGood={false}
                />
                <CompareSection
                  label="Regional variations"
                  valueA={companyA.regionalVariation}
                  valueB={companyB.regionalVariation}
                />
                <CompareSection
                  label="Children's data policy"
                  valueA={companyA.childrenDataPolicy}
                  valueB={companyB.childrenDataPolicy}
                />
                <CompareSection
                  label="Enterprise vs consumer"
                  valueA={companyA.enterpriseVsConsumerSummary}
                  valueB={companyB.enterpriseVsConsumerSummary}
                  booleanA={companyA.enterpriseVsConsumerDifference}
                  booleanB={companyB.enterpriseVsConsumerDifference}
                  booleanGood={false}
                />
              </div>
            </section>
          </>
        )}
      </main>
    </>
  )
}
