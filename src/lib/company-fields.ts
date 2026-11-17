import type { Company } from "./db/schema"

export const COMPANY_FIELDS = [
  "trainsOnDataByDefault",
  "trainsOnDataNuance",
  "optOutAvailable",
  "optOutHow",
  "optOutUrl",
  "retentionPeriod",
  "dataDeletedOnRequest",
  "dataDeletedOnRequestTimeframe",
  "thirdPartySharing",
  "humanReviewOfChats",
  "humanReviewConditions",
  "regionalVariation",
  "childrenDataPolicy",
  "enterpriseVsConsumerDifference",
  "enterpriseVsConsumerSummary",
  "sourceUrl",
] as const satisfies readonly (keyof Company)[]

export type CompanyField = (typeof COMPANY_FIELDS)[number]

const BOOLEAN_FIELDS: Partial<Record<CompanyField, true>> = {
  trainsOnDataByDefault: true,
  optOutAvailable: true,
  dataDeletedOnRequest: true,
  humanReviewOfChats: true,
  enterpriseVsConsumerDifference: true,
}

export function coerceFieldChanges(raw: unknown): {
  updates: Partial<Record<CompanyField, string | boolean>>
  skipped: string[]
} {
  if (!Array.isArray(raw)) {
    throw new Error("proposedChanges must be an array")
  }

  const updates: Partial<Record<CompanyField, string | boolean>> = {}
  const skipped: string[] = []

  for (const item of raw) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("field" in item) ||
      !("newValue" in item) ||
      typeof item.field !== "string" ||
      typeof item.newValue !== "string"
    ) {
      skipped.push(
        typeof item === "object" && item !== null && "field" in item
          ? String(item.field)
          : "unknown"
      )
      continue
    }

    const field = item.field as CompanyField
    if (!COMPANY_FIELDS.includes(field)) {
      skipped.push(item.field)
      continue
    }

    if (BOOLEAN_FIELDS[field] === true) {
      const normalized = item.newValue.trim().toLowerCase()
      if (normalized !== "true" && normalized !== "false") {
        skipped.push(field)
        continue
      }
      updates[field] = normalized === "true"
      continue
    }

    updates[field] = item.newValue
  }

  return { updates, skipped }
}
