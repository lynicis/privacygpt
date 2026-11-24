import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import {
  changelogsQueryOptions,
  companiesQueryOptions,
  snapshotCountsQueryOptions,
  snapshotTotalCountQueryOptions,
  pendingReviewsCountQueryOptions,
} from "../lib/queries"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { formatDateTime, positiveInt } from "../lib/utils"
import { APP_URL } from "../lib/site"
import {
  ArrowLeft,
  Rss,
  FileText,
  Filter,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import type { tableFeatures } from "@/components/ui/data-table"
import type { ChangelogWithCompany } from "../lib/api"
import type {
  ColumnDef,
  Row,
  SortingState,
  PaginationState,
  ExpandedState,
} from "@tanstack/react-table"

const CHANGELOG_SORT_BY = ["detectedAt", "companyName", "status"] as const
const CHANGELOG_SORT_ORDER = ["asc", "desc"] as const

interface ChangelogSearch {
  page?: number
  pageSize?: number
  sortBy?: (typeof CHANGELOG_SORT_BY)[number]
  sortOrder?: (typeof CHANGELOG_SORT_ORDER)[number]
  companyFilter?: string
  statusFilter?: string
}

export const Route = createFileRoute("/changelog")({
  component: ChangelogPage,
  validateSearch: (search: Record<string, unknown>): ChangelogSearch => {
    const parsedPage = positiveInt(search.page, 1)
    const parsedPageSize = positiveInt(search.pageSize, 20, 1000)
    const sortBy =
      CHANGELOG_SORT_BY.includes(
        search.sortBy as (typeof CHANGELOG_SORT_BY)[number]
      ) && search.sortBy !== "detectedAt"
        ? (search.sortBy as ChangelogSearch["sortBy"])
        : undefined
    const sortOrder =
      CHANGELOG_SORT_ORDER.includes(
        search.sortOrder as (typeof CHANGELOG_SORT_ORDER)[number]
      ) && search.sortOrder !== "desc"
        ? (search.sortOrder as ChangelogSearch["sortOrder"])
        : undefined
    const companyFilter =
      typeof search.companyFilter === "string" &&
      search.companyFilter &&
      search.companyFilter !== "all"
        ? search.companyFilter
        : undefined
    const statusFilter =
      typeof search.statusFilter === "string" &&
      search.statusFilter &&
      search.statusFilter !== "all"
        ? search.statusFilter
        : undefined

    return {
      page: parsedPage > 1 ? parsedPage : undefined,
      pageSize: parsedPageSize !== 20 ? parsedPageSize : undefined,
      sortBy,
      sortOrder,
      companyFilter,
      statusFilter,
    }
  },
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    pageSize: search.pageSize ?? 20,
    sortBy: search.sortBy ?? ("detectedAt" as const),
    sortOrder: search.sortOrder ?? ("desc" as const),
    companyFilter: search.companyFilter ?? "all",
    statusFilter: search.statusFilter ?? "all",
  }),
  loader: async ({ deps, context }) => {
    const pageIndex = deps.page - 1
    await Promise.all([
      context.queryClient.ensureQueryData(
        changelogsQueryOptions({
          page: pageIndex,
          pageSize: deps.pageSize,
          sortBy: deps.sortBy,
          sortOrder: deps.sortOrder,
          companyFilter: deps.companyFilter,
          statusFilter: deps.statusFilter,
        })
      ),
      context.queryClient.ensureQueryData(snapshotCountsQueryOptions()),
      context.queryClient.ensureQueryData(
        companiesQueryOptions({ limit: 1000 })
      ),
      context.queryClient.ensureQueryData(snapshotTotalCountQueryOptions()),
      context.queryClient.ensureQueryData(pendingReviewsCountQueryOptions()),
    ])
    const hasFilterParams = Boolean(
      deps.page > 1 ||
      deps.pageSize !== 20 ||
      deps.sortBy !== "detectedAt" ||
      deps.sortOrder !== "desc" ||
      deps.companyFilter !== "all" ||
      deps.statusFilter !== "all"
    )
    return { hasFilterParams }
  },
  head: ({ loaderData }) => {
    const hasFilterParams = loaderData?.hasFilterParams ?? false
    const title = "AI Privacy Policy Change Log | PrivacyGPT"
    const description =
      "Track weekly changes to AI companies' privacy policies. See what changed, when it changed, and how it affects your conversational data."
    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...(hasFilterParams
          ? [{ name: "robots", content: "noindex, follow" }]
          : []),
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${APP_URL}/changelog` },
        { property: "og:image", content: `${APP_URL}/og-image.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: `${APP_URL}/og-image.png` },
      ],
      links: [{ rel: "canonical", href: `${APP_URL}/changelog` }],
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
                name: "Policy Change Log",
                item: `${APP_URL}/changelog`,
              },
            ],
          }),
        },
      ],
    }
  },
})

function ChangelogPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const changelogFilters = useMemo(
    () => ({
      page: (search.page ?? 1) - 1,
      pageSize: search.pageSize ?? 20,
      sortBy: search.sortBy ?? ("detectedAt" as const),
      sortOrder: search.sortOrder ?? ("desc" as const),
      companyFilter: search.companyFilter ?? "all",
      statusFilter: search.statusFilter ?? "all",
    }),
    [
      search.page,
      search.pageSize,
      search.sortBy,
      search.sortOrder,
      search.companyFilter,
      search.statusFilter,
    ]
  )

  const {
    data: changelogsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(changelogsQueryOptions(changelogFilters))
  const { data: companiesData } = useQuery(
    companiesQueryOptions({ limit: 1000 })
  )
  const { data: snapshotsData } = useQuery(snapshotCountsQueryOptions())
  const { data: totalSnapshots } = useQuery(snapshotTotalCountQueryOptions())
  const { data: pendingReviewsCount } = useQuery(
    pendingReviewsCountQueryOptions()
  )

  const changelogs = changelogsData?.changelogs ?? []
  const totalCount = changelogsData?.totalCount ?? 0
  const companies = companiesData?.companies ?? []
  const snapshots = snapshotsData ?? []

  const [expanded, setExpanded] = useState<ExpandedState>({})

  // Get all companies from the database for filter dropdown
  const trackedCompanies = useMemo(() => {
    return companies
      .map((c) => [c.companyKey, c.companyName] as const)
      .sort((a, b) => (a[1] || "").localeCompare(b[1] || ""))
  }, [companies])

  // Map router search params to tanstack-table pagination state
  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: (search.page ?? 1) - 1,
      pageSize: search.pageSize ?? 20,
    }),
    [search.page, search.pageSize]
  )

  const onPaginationChange = (nextState: PaginationState) => {
    const nextPage = nextState.pageIndex + 1
    navigate({
      search: {
        ...search,
        page: nextPage > 1 ? nextPage : undefined,
        pageSize: nextState.pageSize !== 20 ? nextState.pageSize : undefined,
      },
    })
  }

  // Map router search params to tanstack-table sorting state
  const sorting: SortingState = useMemo(
    () => [
      {
        id: search.sortBy ?? "detectedAt",
        desc: (search.sortOrder ?? "desc") === "desc",
      },
    ],
    [search.sortBy, search.sortOrder]
  )

  const onSortingChange = (nextState: SortingState) => {
    const firstSort = nextState[0] as (typeof nextState)[number] | undefined
    if (firstSort) {
      const nextSortBy = firstSort.id as ChangelogSearch["sortBy"]
      const nextSortOrder = firstSort.desc ? "desc" : "asc"
      navigate({
        search: {
          ...search,
          sortBy: nextSortBy !== "detectedAt" ? nextSortBy : undefined,
          sortOrder: nextSortOrder !== "desc" ? nextSortOrder : undefined,
        },
      })
    }
  }

  const columns = useMemo<
    ColumnDef<typeof tableFeatures, ChangelogWithCompany>[]
  >(
    () => [
      {
        id: "expand",
        header: () => <span className="sr-only">Details</span>,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={
              row.getIsExpanded()
                ? "Collapse change details"
                : "Expand change details"
            }
            onClick={() => row.toggleExpanded()}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ),
      },
      {
        accessorKey: "status",
        header: () => {
          return (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                const currentOrder = search.sortOrder ?? "desc"
                const isStatusSort = search.sortBy === "status"
                const nextOrder =
                  isStatusSort && currentOrder === "asc" ? "desc" : "asc"
                navigate({
                  search: {
                    ...search,
                    page: undefined,
                    sortBy: "status",
                    sortOrder: nextOrder !== "desc" ? nextOrder : undefined,
                  },
                })
              }}
            >
              Status
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const isPending = row.original.status === "pending_review"
          return (
            <Badge
              variant="outline"
              className={
                isPending
                  ? "border-signal/40 bg-signal-soft text-signal"
                  : "border-ok/40 bg-ok-soft text-ok"
              }
            >
              {isPending ? "Pending review" : "Reviewed"}
            </Badge>
          )
        },
      },
      {
        accessorKey: "companyName",
        header: () => {
          return (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                const currentOrder = search.sortOrder ?? "desc"
                const isCompanySort = search.sortBy === "companyName"
                const nextOrder =
                  isCompanySort && currentOrder === "asc" ? "desc" : "asc"
                navigate({
                  search: {
                    ...search,
                    page: undefined,
                    sortBy: "companyName",
                    sortOrder: nextOrder !== "desc" ? nextOrder : undefined,
                  },
                })
              }}
            >
              Company
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <Link
            to="/company/$companyKey"
            params={{
              companyKey: row.original.companyKey || "",
            }}
            className="font-medium text-ink hover:underline"
          >
            {row.original.companyName}
          </Link>
        ),
      },
      {
        accessorKey: "detectedAt",
        header: () => {
          return (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                const currentOrder = search.sortOrder ?? "desc"
                const isDetectedSort =
                  (search.sortBy ?? "detectedAt") === "detectedAt"
                const nextOrder =
                  isDetectedSort && currentOrder === "asc" ? "desc" : "asc"
                navigate({
                  search: {
                    ...search,
                    page: undefined,
                    sortBy: undefined,
                    sortOrder: nextOrder !== "desc" ? nextOrder : undefined,
                  },
                })
              }}
            >
              Detected at
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <span className="measured text-muted">
            {formatDateTime(row.original.detectedAt)}
          </span>
        ),
      },
    ],
    [search, navigate]
  )

  const pageCount = Math.ceil(totalCount / (search.pageSize ?? 20))
  const companiesTracked = trackedCompanies.length

  const renderSubComponent = ({
    row,
  }: {
    row: Row<typeof tableFeatures, ChangelogWithCompany>
  }) => {
    const entry = row.original
    return (
      <div className="space-y-4">
        <div className="grid gap-px overflow-hidden rounded-[6px] border border-rule bg-rule md:grid-cols-2">
          <div>
            <div className="border-b border-rule bg-paper-3 px-3 py-2 text-sm text-muted">
              Before
            </div>
            <div className="max-h-96 overflow-y-auto bg-paper-3 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap text-ink-2">
              {entry.beforeText}
            </div>
          </div>
          <div>
            <div className="border-b border-rule bg-paper-3 px-3 py-2 text-sm text-muted">
              After
            </div>
            <div className="max-h-96 overflow-y-auto bg-paper-3 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap text-ink-2">
              {entry.afterText}
            </div>
          </div>
        </div>

        {entry.reviewNotes && (
          <div className="rounded-[6px] border border-rule bg-paper-3 p-4">
            <div className="mb-1 text-sm text-muted">Review notes</div>
            <p className="max-w-[70ch] text-sm text-ink-2">
              {entry.reviewNotes}
            </p>
            {entry.reviewedAt && (
              <p className="measured mt-2 text-xs text-muted">
                reviewed {formatDateTime(entry.reviewedAt)}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <main
        className="shell py-12"
        aria-busy="true"
        aria-label="Loading change log"
      >
        <div className="h-10 w-72 animate-pulse rounded-[6px] bg-paper-2" />
        <div className="mt-4 h-5 w-96 animate-pulse rounded-[6px] bg-paper-2" />
        <div className="mt-8 h-24 animate-pulse rounded-[10px] border border-rule bg-paper-2" />
        <div className="mt-4 h-80 animate-pulse rounded-[10px] border border-rule bg-paper-2" />
      </main>
    )
  }

  if (isError) {
    return (
      <main className="shell py-20">
        <h1 className="max-w-[20ch]">Failed to load the change log</h1>
        <p className="mt-4 max-w-[48ch] text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>
        <Button variant="outline" className="mt-6" onClick={() => refetch()}>
          Try again
        </Button>
      </main>
    )
  }

  return (
    <>
      {/* Banner: the trail's head and its four readings. */}
      <section className="border-b border-rule">
        <div className="shell py-10 sm:py-12">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Link
              to="/"
              className="flex items-center gap-1 transition-colors duration-[var(--dur-micro)] hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Register
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">Change log</span>
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="max-w-[20ch] text-display-s">Policy change log</h1>
              <p className="lead mt-3 max-w-[52ch] text-ink-2">
                Each change is detected by the watchdog crawler, logged here,
                and reviewed for accuracy.
              </p>
            </div>
            <Button asChild variant="outline">
              <a href="/changelog/feed.xml" title="Subscribe to the RSS feed">
                <Rss className="h-4 w-4" aria-hidden="true" />
                RSS feed
              </a>
            </Button>
          </div>

          {/* Four readings, one instrument panel. */}
          <div className="panels mt-8 grid-cols-2 sm:grid-cols-4">
            <div className="p-4">
              <div className="reading text-[2.2rem]">{companiesTracked}</div>
              <div className="label mt-2">Companies tracked</div>
            </div>
            <div className="p-4">
              <div className="reading text-[2.2rem]">{totalSnapshots}</div>
              <div className="label mt-2">Snapshots stored</div>
            </div>
            <div className="p-4">
              <div className="reading text-[2.2rem]">{totalCount}</div>
              <div className="label mt-2">Matching changes</div>
            </div>
            <div className="p-4">
              <div className="reading text-[2.2rem] text-signal">
                {pendingReviewsCount}
              </div>
              <div className="label mt-2">Pending reviews</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="shell pt-6 pb-20">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted" aria-hidden="true" />
            <span className="text-sm text-muted">Filters</span>
          </div>
          <Select
            value={search.companyFilter || "all"}
            onValueChange={(val) => {
              navigate({
                search: {
                  ...search,
                  page: undefined,
                  companyFilter: val !== "all" ? val : undefined,
                },
              })
            }}
          >
            <SelectTrigger aria-label="Filter by company" className="w-48">
              <SelectValue placeholder="All companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All companies</SelectItem>
              {trackedCompanies.map(([key, name]) => (
                <SelectItem key={key} value={key || ""}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={search.statusFilter || "all"}
            onValueChange={(val) => {
              navigate({
                search: {
                  ...search,
                  page: undefined,
                  statusFilter: val !== "all" ? val : undefined,
                },
              })
            }}
          >
            <SelectTrigger aria-label="Filter by status" className="w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending_review">Pending review</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* DataTable */}
        {changelogs.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-rule-2 p-12 text-center">
            <FileText
              className="mx-auto mb-4 h-6 w-6 text-muted"
              aria-hidden="true"
            />
            <h2 className="text-lg font-medium">No matching changes</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting the filters to see more results.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={changelogs}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            sorting={sorting}
            onSortingChange={onSortingChange}
            expanded={expanded}
            onExpandedChange={setExpanded}
            getRowCanExpand={() => true}
            getRowId={(row) => String(row.id)}
            renderSubComponent={renderSubComponent}
          />
        )}

        {/* Snapshot Status Section */}
        {snapshots.length > 0 && (
          <section className="mt-14">
            <div className="mb-3 flex items-baseline justify-between gap-4 border-b border-rule pb-3">
              <h2 className="text-title">Latest snapshots</h2>
              <span className="measured text-sm text-muted">
                {snapshots.length} shown
              </span>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[10px] border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
              {snapshots.map((snap) => (
                <div
                  key={snap.companyId || snap.companyKey}
                  className="bg-paper-2 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-ink">
                      {snap.companyName}
                    </span>
                    <span className="measured text-xs text-muted">
                      {snap.contentHash.slice(0, 8)}…
                    </span>
                  </div>
                  <p className="measured mt-1 text-xs text-muted">
                    fetched {formatDateTime(snap.fetchedAt)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
