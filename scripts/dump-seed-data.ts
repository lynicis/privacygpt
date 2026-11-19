/**
 * Regenerate src/lib/db/seedData.json from privacy.db.
 *
 * Mirrors the row mapping in scripts/sync-from-prod.ts so the seed file and the
 * database stay structurally equivalent. `hasValidPrivacyPolicy` is emitted only
 * when false — src/lib/db/seed.ts treats an absent key as true.
 *
 * Usage: bun run scripts/dump-seed-data.ts [--out <path>] [--check]
 */
import { createClient } from "@libsql/client"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

const REPO_ROOT = path.resolve(import.meta.dirname, "..")
const LOCAL_DB = path.join(REPO_ROOT, "privacy.db")
const DEFAULT_SEED = path.join(REPO_ROOT, "src/lib/db/seedData.json")

const COMPANY_COLUMNS = [
  "company_key",
  "company_name",
  "product_name",
  "trains_on_data_by_default",
  "trains_on_data_nuance",
  "opt_out_available",
  "opt_out_how",
  "opt_out_url",
  "retention_period",
  "data_deleted_on_request",
  "data_deleted_on_request_timeframe",
  "third_party_sharing",
  "human_review_of_chats",
  "human_review_conditions",
  "regional_variation",
  "children_data_policy",
  "enterprise_vs_consumer_difference",
  "enterprise_vs_consumer_summary",
  "source_url",
  "last_verified_date",
  "last_changed_date",
  "confidence",
  "has_valid_privacy_policy",
] as const

function parseArgs(args: string[]): { outPath: string; check: boolean } {
  let outPath = DEFAULT_SEED
  let check = false
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === "--check") {
      check = true
    } else if (arg === "--out") {
      const value = args[index + 1]
      if (!value) {
        console.error("--out requires a path")
        process.exit(1)
      }
      outPath = path.resolve(value)
      index += 1
    } else {
      console.error(`unknown argument: ${arg}`)
      process.exit(1)
    }
  }
  return { outPath, check }
}

async function main(): Promise<void> {
  const { outPath, check } = parseArgs(process.argv.slice(2))
  const client = createClient({ url: pathToFileURL(LOCAL_DB).href })
  try {
    const result = await client.execute(
      `SELECT ${COMPANY_COLUMNS.join(", ")} FROM companies ORDER BY id`
    )

    const rows = result.rows.map((row) => {
      const out: Record<string, unknown> = {
        companyKey: row.company_key,
        companyName: row.company_name,
        productName: row.product_name,
        trainsOnDataByDefault: Boolean(row.trains_on_data_by_default),
        trainsOnDataNuance: row.trains_on_data_nuance,
        optOutAvailable: Boolean(row.opt_out_available),
        optOutHow: row.opt_out_how,
        optOutUrl: row.opt_out_url ?? null,
        retentionPeriod: row.retention_period,
        dataDeletedOnRequest: Boolean(row.data_deleted_on_request),
        dataDeletedOnRequestTimeframe: row.data_deleted_on_request_timeframe,
        thirdPartySharing: row.third_party_sharing,
        humanReviewOfChats: Boolean(row.human_review_of_chats),
        humanReviewConditions: row.human_review_conditions,
        regionalVariation: row.regional_variation,
        childrenDataPolicy: row.children_data_policy,
        enterpriseVsConsumerDifference: Boolean(
          row.enterprise_vs_consumer_difference
        ),
        enterpriseVsConsumerSummary: row.enterprise_vs_consumer_summary,
        sourceUrl: row.source_url,
        lastVerifiedDate: row.last_verified_date,
        lastChangedDate: row.last_changed_date ?? null,
        confidence: row.confidence,
      }

      if (Number(row.has_valid_privacy_policy) === 0) {
        out.hasValidPrivacyPolicy = false
      }

      return out
    })

    const serialized = `${JSON.stringify(rows, null, 2)}\n`

    if (check) {
      const current = readFileSync(outPath, "utf8")
      if (current !== serialized) {
        console.error(`DRIFT: ${outPath} differs from the database`)
        process.exit(1)
      }
      console.log(`CLEAN companies=${rows.length} SEED=${outPath}`)
      return
    }

    writeFileSync(outPath, serialized, "utf8")
    console.log(`WROTE companies=${rows.length} SEED=${outPath}`)
  } finally {
    client.close()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : String(err))
  process.exit(1)
})
