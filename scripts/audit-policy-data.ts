/**
 * Read-only audit dossier generator.
 *
 * For every company in privacy.db, writes a dossier containing all DB columns,
 * the primary source_url, and the full text of its latest snapshot, plus a
 * summary that flags rows whose snapshot may be stale or unusable.
 *
 * Usage: bun run scripts/audit-policy-data.ts [--out <dir>]
 */
import { createClient } from "@libsql/client"
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

const REPO_ROOT = path.resolve(import.meta.dirname, "..")
const LOCAL_DB = path.join(REPO_ROOT, "privacy.db")

const COMPANY_COLUMNS = [
  "id",
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

/** Fields a reviewer must produce a verdict for. */
const AUDITED_FIELDS = COMPANY_COLUMNS.filter(
  (column) =>
    column !== "id" &&
    column !== "company_key" &&
    column !== "company_name" &&
    column !== "product_name"
)

const MIN_USABLE_SNAPSHOT_CHARS = 500

const BASELINE_FINDINGS = [
  "`unsound`: `trains_on_data_nuance` says inputs are 'processed in real time and not saved on the servers', but `retention_period` says 'Retained for the shortest necessary period'; deletion text references real-name authentication data.",
  "`haystack`, `nous-research`: `has_valid_privacy_policy=0` yet `confidence='verified_from_policy_text'` — contradictory.",
  "`mlc-ai`, `openbmb`, `haystack`, `nous-research`: no formal privacy policy (source URLs are GitHub repos/homepages); `last_verified_date` stale at 2026-09-19 vs 2026-11-18 for the other 35.",
  "`sambanova`, `opencode-zen`: `opt_out_available=1` but `opt_out_url` empty.",
  "`bytedance`: watchdog snapshots broken (latest is 57 bytes — TRAE policy page is JS-rendered); DB fields unverifiable from snapshots.",
] as const

type Row = Record<string, unknown>

function parseOutDir(args: string[]): string {
  const index = args.indexOf("--out")
  if (index === -1) return path.join(REPO_ROOT, ".audit")
  const value = args[index + 1]
  if (!value) {
    console.error("--out requires a directory argument")
    process.exit(1)
  }
  return path.resolve(value)
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "`` (null)"
  const text = String(value)
  if (text === "") return "`` (empty)"
  if (text.includes("\n")) return "\n" + text
  return text
}

function renderDossier(
  company: Row,
  snapshot: Row | null,
  liveFetchPath: string
): string {
  const lines: string[] = []
  lines.push(
    `# Audit dossier — ${company.company_name} (${company.company_key})`
  )
  lines.push("")
  lines.push(`- DB row id: ${company.id}`)
  lines.push(`- source_url: ${company.source_url}`)
  lines.push(`- last_verified_date: ${company.last_verified_date}`)
  lines.push(`- confidence: ${company.confidence}`)
  lines.push(`- has_valid_privacy_policy: ${company.has_valid_privacy_policy}`)
  if (snapshot) {
    const content = String(snapshot.raw_content ?? "")
    lines.push(`- latest snapshot fetched_at: ${snapshot.fetched_at}`)
    lines.push(`- latest snapshot chars: ${content.length}`)
    lines.push(`- latest snapshot content_hash: ${snapshot.content_hash}`)
  } else {
    lines.push("- latest snapshot: NONE")
  }
  lines.push("")
  lines.push(`Live fetch (if captured): ${liveFetchPath}`)
  lines.push("")
  lines.push("## DB field values")
  lines.push("")
  for (const column of AUDITED_FIELDS) {
    lines.push(`### ${column}`)
    lines.push("")
    lines.push(formatValue(company[column]))
    lines.push("")
  }
  lines.push("## Snapshot content")
  lines.push("")
  lines.push("---SNAPSHOT-CONTENT-START---")
  lines.push(snapshot ? String(snapshot.raw_content ?? "") : "(no snapshot)")
  lines.push("---SNAPSHOT-CONTENT-END---")
  lines.push("")
  return lines.join("\n")
}

async function main(): Promise<void> {
  const outDir = parseOutDir(process.argv.slice(2))
  const dossiersDir = path.join(outDir, "dossiers")
  mkdirSync(dossiersDir, { recursive: true })

  const client = createClient({ url: pathToFileURL(LOCAL_DB).href })

  type Summary = {
    companyKey: string
    confidence: string
    hasPolicy: number
    lastVerified: string
    snapshotAt: string | null
    snapshotChars: number
    needsLiveFetch: boolean
    reasons: string[]
  }

  const summaries: Summary[] = []

  try {
    const companies = (
      await client.execute(
        `SELECT ${COMPANY_COLUMNS.join(", ")} FROM companies ORDER BY company_key`
      )
    ).rows as unknown as Row[]

    for (const company of companies) {
      const companyKey = String(company.company_key)
      const snapshotResult = await client.execute({
        sql: `SELECT fetched_at, content_hash, raw_content FROM snapshots
              WHERE company_id = ? ORDER BY fetched_at DESC LIMIT 1`,
        args: [Number(company.id)],
      })
      const snapshotRow = snapshotResult.rows[0] as unknown as Row | undefined
      const snapshot = snapshotRow ?? null

      const liveFetchPath = path.join(
        dossiersDir,
        `${companyKey}.live-fetch.md`
      )
      const dossierPath = path.join(dossiersDir, `${companyKey}.md`)

      writeFileSync(
        dossierPath,
        renderDossier(company, snapshot, liveFetchPath),
        "utf8"
      )

      const lastVerified = String(company.last_verified_date)
      const snapshotAt = snapshot ? String(snapshot.fetched_at) : null
      const snapshotChars = snapshot
        ? String(snapshot.raw_content ?? "").length
        : 0
      const reasons: string[] = []
      if (!snapshotAt) {
        reasons.push("no snapshot")
      } else if (snapshotAt.slice(0, 10) < lastVerified) {
        reasons.push(
          `snapshot ${snapshotAt.slice(0, 10)} < verified ${lastVerified}`
        )
      }
      if (snapshotChars < MIN_USABLE_SNAPSHOT_CHARS) {
        reasons.push(`snapshot only ${snapshotChars} chars`)
      }

      summaries.push({
        companyKey,
        confidence: String(company.confidence),
        hasPolicy: Number(company.has_valid_privacy_policy),
        lastVerified,
        snapshotAt,
        snapshotChars,
        needsLiveFetch: reasons.length > 0,
        reasons,
      })
    }
  } finally {
    client.close()
  }

  const summaryLines: string[] = []
  summaryLines.push("# Audit summary")
  summaryLines.push("")
  summaryLines.push(`Companies: ${summaries.length}`)
  summaryLines.push(
    `Needing a live fetch: ${summaries.filter((s) => s.needsLiveFetch).length}`
  )
  summaryLines.push("")
  summaryLines.push("## Snapshot freshness")
  summaryLines.push("")
  summaryLines.push(
    "| company | confidence | has_policy | last_verified | snapshot_at | chars | live_fetch | reasons |"
  )
  summaryLines.push("| --- | --- | --- | --- | --- | --- | --- | --- |")
  for (const s of summaries) {
    summaryLines.push(
      `| ${s.companyKey} | ${s.confidence} | ${s.hasPolicy} | ${s.lastVerified} | ${
        s.snapshotAt ?? "none"
      } | ${s.snapshotChars} | ${s.needsLiveFetch ? "YES" : "no"} | ${
        s.reasons.join("; ") || "—"
      } |`
    )
  }
  summaryLines.push("")
  summaryLines.push("## Baseline findings")
  summaryLines.push("")
  for (const finding of BASELINE_FINDINGS) {
    summaryLines.push(`- ${finding}`)
  }
  summaryLines.push("")
  summaryLines.push("## Live-fetch queue")
  summaryLines.push("")
  for (const s of summaries.filter((entry) => entry.needsLiveFetch)) {
    summaryLines.push(`- ${s.companyKey} — ${s.reasons.join("; ")}`)
  }
  summaryLines.push("")

  writeFileSync(
    path.join(outDir, "summary.md"),
    summaryLines.join("\n"),
    "utf8"
  )

  console.log(
    `DOSSIERS companies=${summaries.length} out=${dossiersDir} live_fetch=${
      summaries.filter((s) => s.needsLiveFetch).length
    }`
  )
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : String(err))
  process.exit(1)
})
