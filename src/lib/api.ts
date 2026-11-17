"use server"

import { createServerFn } from "@tanstack/react-start"
import { getDb } from "./db"
import { companies, changelogs, snapshots } from "./db/schema"
import type { Changelog, Company } from "./db/schema"
import { eq, desc, and, asc, sql } from "drizzle-orm"
import type { SQL } from "drizzle-orm"
import {
  calculateSubScores,
  calculateTotalScore,
  mapScoreToGrade,
  DEFAULT_WEIGHTS,
} from "./scoring"
import type { Grade, SubScores, Weights } from "./scoring"

export type CompanySort =
  | "score-desc"
  | "score-asc"
  | "name-asc"
  | "name-desc"
  | "training-first"
  | "confidence-first"

export interface CompanyFilters {
  limit?: number
  offset?: number
  searchQuery?: string
  filterNoTraining?: boolean
  filterOptOut?: boolean
  filterNoHumanReview?: boolean
  sortBy?: CompanySort
  weights?: Weights
}

export interface CompanyWithScore extends Company {
  subScores: SubScores
  totalScore: number
  grade: Grade
  rank?: number
}

export interface CompanyStats {
  total: number
  trainsDefault: number
  hasOptOut: number
  hasHumanReview: number
}

export interface CompanyListResult {
  companies: CompanyWithScore[]
  totalCount: number
  stats: CompanyStats
  overallStats: CompanyStats
}

export interface ChangelogFilters {
  page?: number
  pageSize?: number
  sortBy?: "detectedAt" | "companyName" | "status"
  sortOrder?: "asc" | "desc"
  companyFilter?: string
  statusFilter?: string
}

export type ChangelogWithCompany = Pick<
  Changelog,
  | "id"
  | "companyId"
  | "detectedAt"
  | "beforeText"
  | "afterText"
  | "status"
  | "reviewNotes"
  | "reviewedAt"
> & {
  companyName: string | null
  companyKey: string | null
}

export async function getCompanies(
  data: CompanyFilters = {}
): Promise<CompanyListResult> {
  try {
    const db = await getDb()
    const allRows = await db.select().from(companies)

    const weights = data.weights ?? DEFAULT_WEIGHTS

    // Overall stats from companies with valid privacy policies (for hero section)
    const monitoredCompanies = allRows.filter((c) => c.hasValidPrivacyPolicy)
    const overallStats = {
      total: monitoredCompanies.length,
      trainsDefault: monitoredCompanies.filter((c) => c.trainsOnDataByDefault)
        .length,
      hasOptOut: monitoredCompanies.filter((c) => c.optOutAvailable).length,
      hasHumanReview: monitoredCompanies.filter((c) => c.humanReviewOfChats)
        .length,
    }

    // Calculate scores (only for companies with valid privacy policies)
    let scored = monitoredCompanies.map((c) => {
      const subScores = calculateSubScores(c)
      const totalScore = calculateTotalScore(subScores, weights)
      const grade = mapScoreToGrade(totalScore)
      return { ...c, subScores, totalScore, grade }
    })

    // Apply search query
    if (data.searchQuery?.trim()) {
      const q = data.searchQuery.toLowerCase()
      scored = scored.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.productName.toLowerCase().includes(q) ||
          c.trainsOnDataNuance.toLowerCase().includes(q)
      )
    }

    // Apply switches
    if (data.filterNoTraining) {
      scored = scored.filter((c) => !c.trainsOnDataByDefault)
    }
    if (data.filterOptOut) {
      scored = scored.filter((c) => c.optOutAvailable)
    }
    if (data.filterNoHumanReview) {
      scored = scored.filter((c) => !c.humanReviewOfChats)
    }

    // Sort
    const sortBy = data.sortBy || "score-desc"
    scored.sort((a, b) => {
      if (sortBy === "score-desc") return b.totalScore - a.totalScore
      if (sortBy === "score-asc") return a.totalScore - b.totalScore
      if (sortBy === "name-asc")
        return a.companyName.localeCompare(b.companyName)
      if (sortBy === "name-desc")
        return b.companyName.localeCompare(a.companyName)
      if (sortBy === "training-first") {
        return (
          (a.trainsOnDataByDefault ? 1 : 0) - (b.trainsOnDataByDefault ? 1 : 0)
        )
      }
      const priority: Record<string, number> = {
        verified_from_policy_text: 0,
        inferred: 1,
        needs_review: 2,
      }
      return (priority[a.confidence] ?? 9) - (priority[b.confidence] ?? 9)
    })

    const totalCount = scored.length
    const limit = Math.min(Math.max(1, data.limit ?? 9), 1000)
    const offset = Math.max(0, data.offset ?? 0)
    const sliced = scored.slice(offset, offset + limit)

    const stats = {
      total: totalCount,
      trainsDefault: scored.filter((c) => c.trainsOnDataByDefault).length,
      hasOptOut: scored.filter((c) => c.optOutAvailable).length,
      hasHumanReview: scored.filter((c) => c.humanReviewOfChats).length,
    }

    return { companies: sliced, totalCount, stats, overallStats }
  } catch (error) {
    console.error("Failed to fetch companies:", error)
    throw new Error("Failed to fetch companies")
  }
}

export const getCompaniesFn = createServerFn({ method: "GET" })
  .validator((input: CompanyFilters | undefined) => input || {})
  .handler(async ({ data }) => {
    return getCompanies(data)
  })

export const getCompanyByKeyFn = createServerFn({ method: "GET" })
  .validator((key: string) => key)
  .handler(async ({ data: key }): Promise<Company | null> => {
    try {
      const db = await getDb()
      const rows = await db
        .select()
        .from(companies)
        .where(eq(companies.companyKey, key))
        .limit(1)
      return rows[0] || null
    } catch (error) {
      console.error(`Failed to fetch company with key ${key}:`, error)
      throw new Error(`Failed to fetch company: ${key}`)
    }
  })

export async function getChangelogs(
  data: ChangelogFilters = {}
): Promise<{ changelogs: ChangelogWithCompany[]; totalCount: number }> {
  try {
    const db = await getDb()
    const pageSize = Math.min(Math.max(1, data.pageSize ?? 20), 1000)
    const page = Math.max(0, Math.floor(data.page ?? 0))
    const sortBy = data.sortBy ?? "detectedAt"
    const sortOrder = data.sortOrder ?? "desc"
    const companyFilter = data.companyFilter ?? "all"
    const statusFilter = data.statusFilter ?? "all"

    const conditions: SQL[] = []
    if (companyFilter !== "all") {
      conditions.push(eq(companies.companyKey, companyFilter))
    }
    if (statusFilter !== "all") {
      conditions.push(eq(changelogs.status, statusFilter))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Fetch count query
    const countRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(changelogs)
      .leftJoin(companies, eq(changelogs.companyId, companies.id))
      .where(whereClause)

    const totalCount = countRes[0]?.count ?? 0

    // Ordering logic
    let orderByClause: any = desc(changelogs.detectedAt)
    if (sortBy === "companyName") {
      orderByClause =
        sortOrder === "asc"
          ? asc(companies.companyName)
          : desc(companies.companyName)
    } else if (sortBy === "status") {
      orderByClause =
        sortOrder === "asc" ? asc(changelogs.status) : desc(changelogs.status)
    } else {
      orderByClause =
        sortOrder === "asc"
          ? asc(changelogs.detectedAt)
          : desc(changelogs.detectedAt)
    }

    // Query data
    const rows = await db
      .select({
        id: changelogs.id,
        companyId: changelogs.companyId,
        detectedAt: changelogs.detectedAt,
        beforeText: changelogs.beforeText,
        afterText: changelogs.afterText,
        status: changelogs.status,
        reviewNotes: changelogs.reviewNotes,
        reviewedAt: changelogs.reviewedAt,
        companyName: companies.companyName,
        companyKey: companies.companyKey,
      })
      .from(changelogs)
      .leftJoin(companies, eq(changelogs.companyId, companies.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(page * pageSize)

    return { changelogs: rows, totalCount }
  } catch (error) {
    console.error("Failed to fetch changelogs:", error)
    throw new Error("Failed to fetch changelogs")
  }
}

export const getChangelogsFn = createServerFn({ method: "GET" })
  .validator((input: ChangelogFilters | undefined) => input || {})
  .handler(async ({ data }) => {
    return getChangelogs(data)
  })

export const getSnapshotCountsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const db = await getDb()

      const latestSubquery = db
        .select({
          companyId: snapshots.companyId,
          maxFetched: sql<string>`max(${snapshots.fetchedAt})`.as(
            "max_fetched"
          ),
        })
        .from(snapshots)
        .groupBy(snapshots.companyId)
        .as("latest_sub")

      const rows = await db
        .select({
          companyId: snapshots.companyId,
          companyName: companies.companyName,
          companyKey: companies.companyKey,
          fetchedAt: snapshots.fetchedAt,
          contentHash: snapshots.contentHash,
        })
        .from(snapshots)
        .innerJoin(
          latestSubquery,
          and(
            eq(snapshots.companyId, latestSubquery.companyId),
            eq(snapshots.fetchedAt, latestSubquery.maxFetched)
          )
        )
        .leftJoin(companies, eq(snapshots.companyId, companies.id))
        .orderBy(desc(snapshots.fetchedAt))
      return rows
    } catch (error) {
      console.error("Failed to fetch snapshots:", error)
      throw new Error("Failed to fetch snapshots")
    }
  }
)

export const getSnapshotTotalCountFn = createServerFn({
  method: "GET",
}).handler(async () => {
  try {
    const db = await getDb()
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(snapshots)
    return result[0]?.count ?? 0
  } catch (error) {
    console.error("Failed to count snapshots:", error)
    throw new Error("Failed to count snapshots")
  }
})

export const getPendingReviewsCountFn = createServerFn({
  method: "GET",
}).handler(async () => {
  try {
    const db = await getDb()
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(changelogs)
      .where(eq(changelogs.status, "pending_review"))
    return result[0]?.count ?? 0
  } catch (error) {
    console.error("Failed to count pending reviews:", error)
    throw new Error("Failed to count pending reviews")
  }
})
