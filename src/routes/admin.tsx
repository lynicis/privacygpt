import { createFileRoute, Link } from "@tanstack/react-router"
import { checkAdminAuthFn } from "../lib/admin"
import {
  useReviewChangelog,
  changelogsQueryOptions,
  snapshotCountsQueryOptions,
  snapshotTotalCountQueryOptions,
} from "../lib/queries"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  Bot,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  beforeLoad: async () => {
    try {
      await checkAdminAuthFn()
      return { auth: { success: true } }
    } catch (error) {
      if (error instanceof Response) {
        return { auth: { success: false } }
      }
      throw error
    }
  },
  loader: async ({ context }) => {
    if (!context.auth.success) {
      return { unauthorized: true }
    }
    await Promise.all([
      context.queryClient.ensureQueryData(
        changelogsQueryOptions({ page: 0, pageSize: 1000 })
      ),
      context.queryClient.ensureQueryData(snapshotCountsQueryOptions()),
      context.queryClient.ensureQueryData(snapshotTotalCountQueryOptions()),
    ])
    return { unauthorized: false }
  },
  headers: ({ loaderData }): Record<string, string> => {
    if (loaderData && (loaderData as any).unauthorized) {
      return {
        "WWW-Authenticate": 'Basic realm="Admin Portal"',
      }
    }
    return {}
  },
  head: () => ({
    meta: [
      {
        title: "Admin Portal — PrivacyGPT",
      },
      {
        name: "description",
        content:
          "Admin portal to review and approve policy change log entries.",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
})

function ChangelogReview({ id }: { id: number }) {
  const [notes, setNotes] = useState("")
  const reviewMutation = useReviewChangelog()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    reviewMutation.mutate({ id, reviewNotes: notes })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label
          htmlFor={`notes-${id}`}
          className="label block"
        >
          Review notes and summary of changes
        </label>
        <textarea
          id={`notes-${id}`}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Google updated their data collection wording regarding workspace integration..."
          className="w-full rounded-[6px] border border-field bg-paper-3 px-3 py-2 text-md text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          required
        />
      </div>
      {reviewMutation.error && (
        <p className="text-sm text-bad">
          {reviewMutation.error instanceof Error
            ? reviewMutation.error.message
            : "An unexpected error occurred."}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={reviewMutation.isPending}>
          {reviewMutation.isPending ? "Approving…" : "Approve and apply"}
        </Button>
        <span className="max-w-[48ch] text-sm text-muted">
          Approving applies any AI-proposed field updates to the company
          profile.
        </span>
      </div>
    </form>
  )
}

function AdminPage() {
  const { unauthorized } = Route.useLoaderData()
  const {
    data: changelogsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(changelogsQueryOptions({ page: 0, pageSize: 1000 }))
  const { data: snapshotsData } = useQuery(snapshotCountsQueryOptions())
  const { data: totalSnapshotsData } = useQuery(
    snapshotTotalCountQueryOptions()
  )
  const changelogs = changelogsData?.changelogs ?? []
  const snapshots = snapshotsData ?? []
  const totalSnapshots = totalSnapshotsData ?? 0
  const [companyFilter, setCompanyFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("pending_review") // Default to pending review
  const [expandedOverrides, setExpandedOverrides] = useState<
    Record<number, boolean>
  >({})

  if (unauthorized) {
    return (
      <main className="shell py-24">
        <div className="mx-auto max-w-md rounded-[10px] border border-rule bg-paper-2 p-8">
          <Lock className="h-6 w-6 text-signal" aria-hidden="true" />
          <h1 className="mt-4 text-title">401, unauthorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You must be logged in as an administrator to open the review queue.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={() => window.location.reload()}>
              Log in or refresh
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Back to the register</Link>
            </Button>
          </div>
        </div>
      </main>
    )
  }

  // Get unique companies from snapshots for filter dropdown
  const trackedCompanies = Array.from(
    new Map(snapshots.map((s) => [s.companyKey, s.companyName])).entries()
  ).sort((a, b) => (a[1] || "").localeCompare(b[1] || ""))

  // Filter changelogs
  const filteredChangelogs = changelogs.filter((entry) => {
    if (companyFilter !== "all" && entry.companyKey !== companyFilter)
      return false
    if (statusFilter !== "all" && entry.status !== statusFilter) return false
    return true
  })

  const toggleExpand = (id: number) => {
    setExpandedOverrides((prev) => {
      const statusDefault =
        changelogs.find((c) => c.id === id)?.status === "pending_review"
      return { ...prev, [id]: !(prev[id] ?? statusDefault) }
    })
  }

  // Stats
  const totalChanges = changelogs.length
  const pendingReviews = changelogs.filter(
    (c) => c.status === "pending_review"
  ).length
  const reviewedChanges = totalChanges - pendingReviews

  if (isLoading) {
    return (
      <main className="shell py-12" aria-busy="true" aria-label="Loading review queue">
        <div className="h-10 w-64 animate-pulse rounded-[6px] bg-paper-2" />
        <div className="mt-8 h-24 animate-pulse rounded-[10px] border border-rule bg-paper-2" />
        <div className="mt-4 h-64 animate-pulse rounded-[10px] border border-rule bg-paper-2" />
      </main>
    )
  }

  if (isError) {
    return (
      <main className="shell py-20">
        <h1 className="max-w-[20ch]">Failed to load the review queue</h1>
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
      {/* App head: the queue's four readings, then the filters. */}
      <section className="border-b border-rule">
        <div className="shell py-8">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Link
              to="/"
              className="flex items-center gap-1 transition-colors duration-[var(--dur-micro)] hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Register
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">Review queue</span>
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="max-w-[20ch] text-display-s">Review queue</h1>
              <p className="lead mt-3 max-w-[54ch] text-ink-2">
                Authorize, review, and approve policy changes the watchdog
                detected. Approved changes go live to readers.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/changelog">View public change log</Link>
            </Button>
          </div>

          <div className="panels mt-6 grid-cols-2 sm:grid-cols-4">
            <div className="p-4">
              <div className="reading text-[2rem] text-signal">
                {pendingReviews}
              </div>
              <div className="label mt-2">Pending review</div>
            </div>
            <div className="p-4">
              <div className="reading text-[2rem]">{reviewedChanges}</div>
              <div className="label mt-2">Reviewed</div>
            </div>
            <div className="p-4">
              <div className="reading text-[2rem]">{totalChanges}</div>
              <div className="label mt-2">Detected changes</div>
            </div>
            <div className="p-4">
              <div className="reading text-[2rem]">{totalSnapshots}</div>
              <div className="label mt-2">Policy snapshots</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="shell pb-20 pt-6">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted" aria-hidden="true" />
              <span className="text-sm text-muted">Filters</span>
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger aria-label="Filter by status" className="w-48">
                <SelectValue placeholder="Pending review" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending_review">Pending review</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Timeline */}
        {filteredChangelogs.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-rule-2 p-12 text-center">
            <FileText
              className="mx-auto mb-4 h-6 w-6 text-muted"
              aria-hidden="true"
            />
            <h2 className="text-lg font-medium">
              {changelogs.length === 0
                ? "No changes logged"
                : "No matching changes"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {changelogs.length === 0
                ? "The watchdog crawler has not detected any policy changes yet."
                : "Try adjusting the filters to see more results."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChangelogs.map((entry) => {
              const isExpanded =
                expandedOverrides[entry.id] ?? entry.status === "pending_review"
              const detectedDate = new Date(entry.detectedAt)
              const isPending = entry.status === "pending_review"

              return (
                <article
                  key={entry.id}
                  className={`overflow-hidden rounded-[10px] border bg-paper-2 transition-colors duration-[var(--dur-micro)] ${isPending ? "border-signal/40" : "border-rule"}`}
                >
                  <div className="border-b border-rule p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={
                            isPending ? "text-signal" : "text-ok"
                          }
                        >
                          {isPending ? (
                            <AlertCircle className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          )}
                        </span>
                        <div>
                          <h2 className="text-md font-medium">
                            <Link
                              to="/company/$companyKey"
                              params={{
                                companyKey: entry.companyKey || "",
                              }}
                              className="hover:underline"
                            >
                              {entry.companyName}
                            </Link>
                          </h2>
                          <p className="measured mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {detectedDate.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}{" "}
                            at{" "}
                            {detectedDate.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`chip ${isPending ? "chip--signal" : "chip--ok"}`}
                      >
                        {isPending ? "Pending review" : "Reviewed"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(entry.id)}
                      className="mb-2"
                    >
                      {isExpanded ? "Hide" : "Show"} diff details
                    </Button>

                    {isExpanded && (
                      <div className="mt-2 space-y-4">
                        {/* Diff visualization */}
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

                        {/* Review notes */}
                        {entry.reviewNotes && (
                          <div className="rounded-[6px] border border-rule bg-paper-3 p-4">
                            <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                              {entry.reviewNotes.startsWith("AI Review") && (
                                <Bot
                                  className="h-3.5 w-3.5 text-cool"
                                  aria-hidden="true"
                                />
                              )}
                              {entry.reviewNotes.startsWith("AI Review")
                                ? "AI review notes"
                                : "Review notes"}
                              {entry.reviewNotes.includes("[BREAKING]") && (
                                <span className="chip chip--bad">
                                  Breaking change
                                </span>
                              )}
                            </div>
                            <p className="max-w-[70ch] text-sm text-ink-2">
                              {entry.reviewNotes}
                            </p>
                            {entry.reviewedAt && (
                              <p className="measured mt-2 text-xs text-muted">
                                reviewed{" "}
                                {new Date(
                                  entry.reviewedAt
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Admin review form */}
                        {isPending && (
                          <div className="rounded-[6px] border border-rule bg-paper-3 p-4">
                            <div className="mb-3 flex items-center gap-1.5 text-sm text-ink-2">
                              <ShieldCheck
                                className="h-3.5 w-3.5 text-signal"
                                aria-hidden="true"
                              />
                              Admin review action
                            </div>
                            <ChangelogReview id={entry.id} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
