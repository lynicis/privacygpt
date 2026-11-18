import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { companiesQueryOptions } from "../lib/queries"
import {
  Search,
  AlertTriangle,
  SlidersHorizontal,
  ExternalLink,
  BookOpen,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  Undo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfidenceBadge } from "@/components/ConfidenceBadge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DEFAULT_WEIGHTS, parseWeights } from "../lib/scoring"
import type { Weights } from "../lib/scoring"
import { positiveInt } from "../lib/utils"
import { APP_URL } from "../lib/site"
import { getGradeBadgeStyle } from "../lib/score-style"

const SORT_BY = [
  "score-desc",
  "score-asc",
  "name-asc",
  "name-desc",
  "training-first",
  "confidence-first",
] as const

type DashboardSort = (typeof SORT_BY)[number]

function summarizeRetention(text: string) {
  const first = text.split(". ")[0] ?? text
  return first.length > 64 ? `${first.slice(0, 61).trimEnd()}…` : first
}

interface DashboardSearch {
  page?: number
  search?: string
  noTraining?: boolean
  optOut?: boolean
  noHumanReview?: boolean
  sortBy?: DashboardSort
  weights?: string
}
export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    page: positiveInt(search.page, 1),
    search: (search.search as string) || undefined,
    noTraining:
      search.noTraining === true || search.noTraining === "true" || undefined,
    optOut: search.optOut === true || search.optOut === "true" || undefined,
    noHumanReview:
      search.noHumanReview === true ||
      search.noHumanReview === "true" ||
      undefined,
    sortBy: SORT_BY.includes(search.sortBy as DashboardSort)
      ? (search.sortBy as DashboardSort)
      : "score-desc",
    weights: (search.weights as string) || undefined,
  }),
  loaderDeps: ({ search }) => ({
    page: search.page,
    search: search.search,
    noTraining: search.noTraining,
    optOut: search.optOut,
    noHumanReview: search.noHumanReview,
    sortBy: search.sortBy,
    weights: search.weights,
  }),
  loader: async ({ deps, context }) => {
    try {
      const parsedWeights = parseWeights(deps.weights)
      const page = deps.page || 1
      const limit = 9
      const offset = (page - 1) * limit

      await context.queryClient.ensureQueryData(
        companiesQueryOptions({
          limit,
          offset,
          searchQuery: deps.search,
          filterNoTraining: deps.noTraining,
          filterOptOut: deps.optOut,
          filterNoHumanReview: deps.noHumanReview,
          sortBy: deps.sortBy,
          weights: parsedWeights,
        })
      )
    } catch (error) {
      console.error("Failed to prefetch companies on dashboard:", error)
    }
  },
  head: () => ({
    meta: [
      {
        title:
          "AI Privacy Watchdog: Compare AI Company Data Policies | PrivacyGPT",
      },
      {
        name: "description",
        content:
          "Compare how major AI companies handle your conversational data. PrivacyGPT tracks model training defaults, opt-out mechanisms, and retention policies from verified source documents.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:title",
        content:
          "AI Privacy Watchdog: Compare AI Company Data Policies | PrivacyGPT",
      },
      {
        property: "og:description",
        content:
          "Compare how major AI companies handle your conversational data. See who trains on your chats, who deletes on request, and who shares with third parties.",
      },
      { property: "og:url", content: APP_URL },
      {
        property: "og:image",
        content: `${APP_URL}/og-image.png`,
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content:
          "AI Privacy Watchdog: Compare AI Company Data Policies | PrivacyGPT",
      },
      {
        name: "twitter:description",
        content:
          "Compare how major AI companies handle your conversational data. See who trains on your chats, who deletes on request, and who shares with third parties.",
      },
      {
        name: "twitter:image",
        content: `${APP_URL}/og-image.png`,
      },
    ],
    links: [{ rel: "canonical", href: APP_URL }],
  }),
  component: App,
})

function App() {
  const navigate = useNavigate({ from: "/" })

  const search = Route.useSearch()

  const [isWeightsExpanded, setIsWeightsExpanded] = useState(false)

  const weights: Weights = useMemo(
    () => parseWeights(search.weights),
    [search.weights]
  )

  const filters = useMemo(
    () => ({
      limit: 9,
      offset: ((search.page || 1) - 1) * 9,
      searchQuery: search.search,
      filterNoTraining: search.noTraining,
      filterOptOut: search.optOut,
      filterNoHumanReview: search.noHumanReview,
      sortBy: search.sortBy,
      weights,
    }),
    [
      search.page,
      search.search,
      search.noTraining,
      search.optOut,
      search.noHumanReview,
      search.sortBy,
      weights,
    ]
  )

  const { data, isLoading, isError, error, refetch } = useQuery(
    companiesQueryOptions(filters)
  )
  const allCompanies = data?.companies ?? []
  const totalCount = data?.totalCount ?? 0
  const overallStats = data?.overallStats ?? {
    total: 0,
    trainsDefault: 0,
    hasOptOut: 0,
    hasHumanReview: 0,
  }

  const totalWeightSum = useMemo(() => {
    const sum =
      weights.trainingWeight +
      weights.optOutWeight +
      weights.retentionWeight +
      weights.deletionWeight +
      weights.sharingWeight +
      weights.humanReviewWeight
    return sum === 0 ? 1 : sum
  }, [weights])

  const handleResetWeights = () => {
    const newWeights = { ...DEFAULT_WEIGHTS }
    navigate({
      search: (prev) => ({
        ...prev,
        weights: JSON.stringify(newWeights),
      }),
      resetScroll: false,
    })
  }

  const setWeights = (newWeights: Weights) => {
    navigate({
      search: (prev) => ({
        ...prev,
        weights: JSON.stringify(newWeights),
      }),
      resetScroll: false,
    })
  }

  const setSearchQuery = (value: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        search: value || undefined,
        page: 1,
      }),
      resetScroll: false,
    })
  }

  const setFilterNoTraining = (value: boolean) => {
    navigate({
      search: (prev) => ({
        ...prev,
        noTraining: value || undefined,
        page: 1,
      }),
      resetScroll: false,
    })
  }

  const setFilterOptOut = (value: boolean) => {
    navigate({
      search: (prev) => ({
        ...prev,
        optOut: value || undefined,
        page: 1,
      }),
      resetScroll: false,
    })
  }

  const setFilterNoHumanReview = (value: boolean) => {
    navigate({
      search: (prev) => ({
        ...prev,
        noHumanReview: value || undefined,
        page: 1,
      }),
      resetScroll: false,
    })
  }

  const setSortBy = (value: string) => {
    const sortBy = SORT_BY.includes(value as DashboardSort)
      ? (value as DashboardSort)
      : "score-desc"
    navigate({
      search: (prev) => ({
        ...prev,
        sortBy,
        page: 1,
      }),
      resetScroll: false,
    })
  }

  const setPage = (page: number) => {
    navigate({
      search: (prev) => ({
        ...prev,
        page,
      }),
      resetScroll: false,
    })
  }

  const currentPage = search.page || 1
  const totalPages = Math.ceil(totalCount / 9)

  if (isLoading) {
    return (
      <main
        className="shell py-14"
        aria-busy="true"
        aria-label="Loading register"
      >
        <div className="grid gap-8 lg:grid-cols-[7fr_5fr] lg:items-end">
          <div>
            <div className="mb-4 h-12 w-2/3 animate-pulse rounded-[6px] bg-paper-2" />
            <div className="h-5 w-1/2 animate-pulse rounded-[6px] bg-paper-2" />
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-rule bg-rule">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse bg-paper-2" />
            ))}
          </div>
        </div>
        <div className="mt-8 h-16 animate-pulse rounded-[10px] border border-rule bg-paper-2" />
        <div className="mt-4 space-y-px overflow-hidden rounded-[10px] border border-rule bg-rule">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-paper-2" />
          ))}
        </div>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="shell py-20">
        <h1 className="max-w-[20ch]">Failed to load the register</h1>
        <p className="mt-4 max-w-[48ch] text-muted-foreground">
          {error.message ||
            "An unexpected error occurred while fetching company data."}
        </p>
        <Button variant="outline" className="mt-6" onClick={() => refetch()}>
          Try again
        </Button>
      </main>
    )
  }

  return (
    <>
      {/* Hero: the register is the page's lead; the head stays small above it. */}
      <section className="border-b border-rule">
        <div className="shell pt-14 pb-10 sm:pt-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
            <div>
              <h1 className="max-w-[16ch] text-display-s">
                Who trains on your chats?
              </h1>
              <p className="lead mt-4 max-w-[48ch] text-ink-2">
                Every major AI platform, read against its own policy: training
                defaults, opt-out routes, retention, human review. Cited.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="outline" size="lg">
                  <Link to="/methodology">
                    <BookOpen className="h-4 w-4" /> How the score is kept
                  </Link>
                </Button>
              </div>
            </div>

            {/* One instrument: a lead reading and its three statuses. */}
            <div className="panel p-5">
              <div className="label">Platforms tracked</div>
              <div className="reading mt-2 text-[3.6rem] text-cool">
                {overallStats.total}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-rule pt-4">
                <div>
                  <div className="measured text-xl text-bad">
                    {overallStats.trainsDefault}
                  </div>
                  <div className="label mt-1">Train by default</div>
                </div>
                <div>
                  <div className="measured text-xl text-ok">
                    {overallStats.hasOptOut}
                  </div>
                  <div className="label mt-1">Offer opt-out</div>
                </div>
                <div>
                  <div className="measured text-xl text-signal">
                    {overallStats.hasHumanReview}
                  </div>
                  <div className="label mt-1">Human review</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard */}
      <main className="shell flex flex-col pt-6 pb-20">
        {/* Scoring weights stay available, behind one disclosure. */}
        <div className="order-3 mb-4 rounded-[10px] border border-rule bg-paper-2 lg:order-1">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
                <Settings2 className="h-4 w-4 text-muted" aria-hidden="true" />
                Privacy scoring weights
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Adjust how each privacy factor changes the ranking.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetWeights}
                className="gap-1.5"
              >
                <Undo2 className="h-3.5 w-3.5" aria-hidden="true" /> Reset
              </Button>
              <Button
                variant={isWeightsExpanded ? "secondary" : "outline"}
                size="sm"
                onClick={() => setIsWeightsExpanded(!isWeightsExpanded)}
                aria-expanded={isWeightsExpanded}
              >
                {isWeightsExpanded ? "Hide" : "Configure"}
              </Button>
            </div>
          </div>

          {isWeightsExpanded && (
            <div className="grid gap-x-8 gap-y-5 border-t border-rule bg-paper-3 px-4 py-5 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  { key: "trainingWeight", label: "Default training disabled" },
                  { key: "optOutWeight", label: "Opt-out ease" },
                  { key: "retentionWeight", label: "Retention timeline" },
                  { key: "deletionWeight", label: "Deletion rights" },
                  { key: "sharingWeight", label: "Third-party sharing" },
                  { key: "humanReviewWeight", label: "No human review" },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`weight-${key}`}
                      className="text-sm text-ink-2"
                    >
                      {label}
                    </label>
                    <span className="measured text-muted">
                      {weights[key]}{" "}
                      <span className="text-xs">
                        ({Math.round((weights[key] / totalWeightSum) * 100)}%)
                      </span>
                    </span>
                  </div>
                  <input
                    id={`weight-${key}`}
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={weights[key]}
                    onChange={(e) =>
                      setWeights({
                        ...weights,
                        [key]: parseInt(e.target.value),
                      })
                    }
                    className="h-1.5 w-full cursor-pointer accent-signal"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* One toolbar: search, sort, three states. */}
        <div className="order-1 mb-4 flex flex-col gap-3 rounded-[10px] border border-rule bg-paper-3 p-3 lg:order-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <Input
              type="text"
              aria-label="Search companies"
              placeholder="Search by company or product"
              value={search.search || ""}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted" aria-hidden="true" />
            <Select
              value={search.sortBy || "score-desc"}
              onValueChange={(val) => setSortBy(val)}
            >
              <SelectTrigger aria-label="Sort companies" className="w-[196px]">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score-desc">Score: high to low</SelectItem>
                <SelectItem value="score-asc">Score: low to high</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
                <SelectItem value="training-first">
                  No training first
                </SelectItem>
                <SelectItem value="confidence-first">Verified first</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-rule pt-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
            <SlidersHorizontal
              className="h-4 w-4 text-muted"
              aria-hidden="true"
            />
            <div className="flex items-center gap-2">
              <Switch
                id="no-training"
                checked={search.noTraining || false}
                onCheckedChange={setFilterNoTraining}
              />
              <label htmlFor="no-training" className="cursor-pointer text-sm">
                Training off
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="opt-out"
                checked={search.optOut || false}
                onCheckedChange={setFilterOptOut}
              />
              <label htmlFor="opt-out" className="cursor-pointer text-sm">
                Opt-out
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="no-human"
                checked={search.noHumanReview || false}
                onCheckedChange={setFilterNoHumanReview}
              />
              <label htmlFor="no-human" className="cursor-pointer text-sm">
                No review
              </label>
            </div>
            <span className="measured ml-auto text-muted">
              {allCompanies.length} of {totalCount}
            </span>
          </div>
        </div>

        {/* The register: one surface, one row per platform. */}
        <div className="order-2 overflow-hidden rounded-[10px] border border-rule bg-paper-2 lg:order-3">
          <table className="reg hidden lg:table">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Platform</th>
                <th className="w-24">Grade</th>
                <th className="w-32">Training</th>
                <th className="w-28">Opt-out</th>
                <th className="w-44">Retention</th>
                <th className="w-32">Human review</th>
                <th className="w-36">Confidence</th>
                <th className="w-28">Source</th>
              </tr>
            </thead>
            <tbody>
              {allCompanies.map((company) => (
                <tr key={company.id}>
                  <td className="num text-muted">
                    {company.rank !== undefined ? company.rank : "–"}
                  </td>
                  <td>
                    <Link
                      to="/company/$companyKey"
                      params={{ companyKey: company.companyKey }}
                      className="block min-w-0"
                    >
                      <span className="name">{company.companyName}</span>
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {company.productName}
                      </span>
                    </Link>
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-baseline gap-1.5 rounded-[4px] border px-2 py-0.5 ${getGradeBadgeStyle(company.grade)}`}
                    >
                      <span className="grade">{company.grade}</span>
                      <span className="measured text-xs opacity-80">
                        {company.totalScore}
                      </span>
                    </span>
                  </td>
                  <td>
                    <span
                      className={`chip ${company.trainsOnDataByDefault ? "chip--bad" : "chip--ok"}`}
                    >
                      {company.trainsOnDataByDefault ? "By default" : "Off"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`chip ${company.optOutAvailable ? "chip--ok" : "chip--bad"}`}
                    >
                      {company.optOutAvailable ? "Available" : "None"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="block text-sm leading-snug text-muted-foreground"
                      title={company.retentionPeriod}
                    >
                      {summarizeRetention(company.retentionPeriod)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`chip ${company.humanReviewOfChats ? "chip--bad" : "chip--ok"}`}
                    >
                      {company.humanReviewOfChats ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>
                    <ConfidenceBadge value={company.confidence} />
                  </td>
                  <td>
                    <a
                      href={company.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-[var(--dur-micro)] hover:text-ink"
                    >
                      Policy{" "}
                      <ExternalLink
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* The same register, stacked for a phone. */}
          <ul className="divide-y divide-rule lg:hidden">
            {allCompanies.map((company) => (
              <li key={company.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to="/company/$companyKey"
                      params={{ companyKey: company.companyKey }}
                      className="block"
                    >
                      <span className="text-md font-medium">
                        {company.companyName}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {company.productName}
                      </span>
                    </Link>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-baseline gap-1 rounded-[4px] border px-2 py-0.5 ${getGradeBadgeStyle(company.grade)}`}
                  >
                    <span className="grade">{company.grade}</span>
                    <span className="measured text-xs opacity-80">
                      {company.totalScore}
                    </span>
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`chip ${company.trainsOnDataByDefault ? "chip--bad" : "chip--ok"}`}
                  >
                    {company.trainsOnDataByDefault
                      ? "Training by default"
                      : "Training off"}
                  </span>
                  <span
                    className={`chip ${company.optOutAvailable ? "chip--ok" : "chip--bad"}`}
                  >
                    {company.optOutAvailable ? "Opt-out" : "No opt-out"}
                  </span>
                  <ConfidenceBadge value={company.confidence} />
                </div>
                <p className="mt-2 text-sm text-muted">
                  Retention: {summarizeRetention(company.retentionPeriod)}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <a
                    href={company.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground"
                  >
                    Source policy{" "}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  <Link
                    to="/company/$companyKey"
                    params={{ companyKey: company.companyKey }}
                    className="inline-flex items-center gap-1 text-sm text-ink"
                  >
                    Full profile{" "}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {allCompanies.length === 0 && (
            <div className="p-12 text-center">
              <AlertTriangle
                className="mx-auto mb-4 h-6 w-6 text-muted"
                aria-hidden="true"
              />
              <h2 className="text-lg font-medium">No companies match</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Try loosening the filters or clearing the search to see every
                tracked AI privacy profile.
              </p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => {
                  setSearchQuery("")
                  setFilterNoTraining(false)
                  setFilterOptOut(false)
                  setFilterNoHumanReview(false)
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="order-4 mt-6 flex flex-wrap items-center justify-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage(1)}
              className="h-8 gap-1 px-2"
              aria-label="First page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="h-8 gap-1 px-2"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                if (totalPages <= 7) return true
                if (page === 1 || page === totalPages) return true
                if (Math.abs(page - currentPage) <= 1) return true
                return false
              })
              .reduce<(number | "ellipsis")[]>((acc, page, idx, arr) => {
                if (idx > 0 && page - arr[idx - 1] > 1) {
                  acc.push("ellipsis")
                }
                acc.push(page)
                return acc
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-muted">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === currentPage ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setPage(item)}
                    className="w-8 px-0"
                  >
                    {item}
                  </Button>
                )
              )}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="h-8 gap-1 px-2"
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(totalPages)}
              className="h-8 gap-1 px-2"
              aria-label="Last page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </main>
    </>
  )
}
