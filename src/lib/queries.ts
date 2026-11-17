import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import {
  getCompaniesFn,
  getCompanyByKeyFn,
  getChangelogsFn,
  getSnapshotCountsFn,
  getSnapshotTotalCountFn,
  getPendingReviewsCountFn,
} from "./api"
import type { ChangelogFilters, CompanyFilters } from "./api"
import { reviewChangelogFn } from "./admin"

export const queryKeys = {
  companies: {
    all: ["companies"] as const,
    list: (filters: CompanyFilters) => ["companies", "list", filters] as const,
    byKey: (key: string) => ["companies", key] as const,
  },
  changelogs: {
    all: ["changelogs"] as const,
    list: (filters: ChangelogFilters) =>
      ["changelogs", "list", filters] as const,
  },
  snapshots: {
    all: ["snapshots"] as const,
    counts: () => ["snapshots", "counts"] as const,
    totalCount: () => ["snapshots", "total-count"] as const,
  },
  admin: {
    pendingReviews: () => ["admin", "pending-reviews"] as const,
    data: () => ["admin", "data"] as const,
  },
}

export function companiesQueryOptions(filters: CompanyFilters = {}) {
  return queryOptions({
    queryKey: queryKeys.companies.list(filters),
    queryFn: () => getCompaniesFn({ data: filters }),
  })
}

export function useCompanies(filters: CompanyFilters = {}) {
  return useQuery(companiesQueryOptions(filters))
}

export function companyByKeyQueryOptions(key: string) {
  return queryOptions({
    queryKey: queryKeys.companies.byKey(key),
    queryFn: () => getCompanyByKeyFn({ data: key }),
    enabled: !!key,
  })
}

export function useCompanyByKey(key: string) {
  return useQuery(companyByKeyQueryOptions(key))
}

export function changelogsQueryOptions(filters: ChangelogFilters = {}) {
  return queryOptions({
    queryKey: queryKeys.changelogs.list(filters),
    queryFn: () => getChangelogsFn({ data: filters }),
  })
}

export function useChangelogs(filters: ChangelogFilters = {}) {
  return useQuery(changelogsQueryOptions(filters))
}

export function snapshotCountsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.snapshots.counts(),
    queryFn: () => getSnapshotCountsFn(),
  })
}

export function useSnapshotCounts() {
  return useQuery(snapshotCountsQueryOptions())
}

export function snapshotTotalCountQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.snapshots.totalCount(),
    queryFn: () => getSnapshotTotalCountFn(),
  })
}

export function useSnapshotTotalCount() {
  return useQuery(snapshotTotalCountQueryOptions())
}

export function pendingReviewsCountQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.admin.pendingReviews(),
    queryFn: () => getPendingReviewsCountFn(),
  })
}

export function usePendingReviewsCount() {
  return useQuery(pendingReviewsCountQueryOptions())
}

export function useReviewChangelog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; reviewNotes: string }) =>
      reviewChangelogFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.changelogs.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.pendingReviews(),
      })
    },
  })
}
