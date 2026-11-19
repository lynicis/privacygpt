/**
 * Apply audited corrections to privacy.db.
 *
 * Reads a fixes file (default: .audit/fixes.json), validates every entry
 * against the live schema, then applies all updates in one write transaction.
 * The whole run is rejected on any validation failure.
 *
 * Fixes file shape:
 *   [{ "companyKey": "unsound", "field": "retention_period",
 *      "newValue": "…", "evidence": "quoted policy text" }, …]
 *
 * Usage:
 *   bun run scripts/apply-audit-fixes.ts [--fixes <path>] [--dry-run]
 */
import { createClient } from "@libsql/client"
import { readFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { CONFIDENCE_VALUES, parseConfidence } from "../src/lib/db/schema"

const REPO_ROOT = path.resolve(import.meta.dirname, "..")
const LOCAL_DB = path.join(REPO_ROOT, "privacy.db")

const BOOLEAN_COLUMNS: Record<string, true> = {
  trains_on_data_by_default: true,
  opt_out_available: true,
  data_deleted_on_request: true,
  human_review_of_chats: true,
  enterprise_vs_consumer_difference: true,
  has_valid_privacy_policy: true,
}

const URL_COLUMNS: Record<string, true> = {
  opt_out_url: true,
  source_url: true,
}

const DATE_COLUMNS: Record<string, true> = {
  last_verified_date: true,
  last_changed_date: true,
}

type Fix = {
  companyKey: string
  field: string
  newValue: string | number | boolean | null
  evidence: string
}

function fail(message: string): never {
  console.error(`REJECTED: ${message}`)
  process.exit(1)
}

function parseArgs(args: string[]): { fixesPath: string; dryRun: boolean } {
  let fixesPath = path.join(REPO_ROOT, ".audit/fixes.json")
  let dryRun = false
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === "--dry-run") {
      dryRun = true
    } else if (arg === "--fixes") {
      const value = args[index + 1]
      if (!value) fail("--fixes requires a path")
      fixesPath = path.resolve(value)
      index += 1
    } else {
      fail(`unknown argument: ${arg}`)
    }
  }
  return { fixesPath, dryRun }
}

function readFixes(fixesPath: string): Fix[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(fixesPath, "utf8"))
  } catch (err) {
    fail(
      `cannot read fixes file ${fixesPath}: ${
        err instanceof Error ? err.message : String(err)
      }`
    )
  }
  if (!Array.isArray(parsed)) fail("fixes file must be a JSON array")
  return parsed as Fix[]
}

function normalizeValue(field: string, value: Fix["newValue"]): unknown {
  if (value === null) {
    if (!URL_COLUMNS[field] && field !== "last_changed_date") {
      fail(`field ${field} is NOT NULL and cannot be set to null`)
    }
    return null
  }
  if (BOOLEAN_COLUMNS[field]) {
    if (typeof value === "boolean") return value ? 1 : 0
    if (value === 0 || value === 1) return value
    if (value === "0" || value === "1") return Number(value)
    fail(
      `boolean field ${field} got non-boolean value ${JSON.stringify(value)}`
    )
  }
  if (field === "confidence") {
    const text = String(value)
    if (!(CONFIDENCE_VALUES as readonly string[]).includes(text)) {
      fail(
        `confidence value ${JSON.stringify(text)} is not one of ${CONFIDENCE_VALUES.join(
          ", "
        )}`
      )
    }
    if (parseConfidence(text) !== text)
      fail(`confidence round-trip failed: ${text}`)
    return text
  }
  if (DATE_COLUMNS[field]) {
    const text = String(value)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      fail(
        `date field ${field} must be YYYY-MM-DD, got ${JSON.stringify(text)}`
      )
    }
    return text
  }
  if (URL_COLUMNS[field]) {
    const text = String(value)
    if (!text.startsWith("https://")) {
      fail(
        `URL field ${field} must start with https://, got ${JSON.stringify(text)}`
      )
    }
    return text
  }
  if (typeof value !== "string") {
    fail(`text field ${field} must be a string, got ${JSON.stringify(value)}`)
  }
  if (value.trim().length === 0) fail(`text field ${field} must not be empty`)
  return value
}

async function main(): Promise<void> {
  const { fixesPath, dryRun } = parseArgs(process.argv.slice(2))
  const fixes = readFixes(fixesPath)
  if (fixes.length === 0) fail("fixes file is empty")

  const client = createClient({ url: pathToFileURL(LOCAL_DB).href })
  try {
    const tableInfo = await client.execute("PRAGMA table_info(companies)")
    const columns = new Map<string, { notNull: boolean; type: string }>()
    for (const row of tableInfo.rows) {
      columns.set(String(row.name), {
        notNull: Number(row.notnull) === 1,
        type: String(row.type),
      })
    }

    const companyRows = await client.execute(
      "SELECT company_key FROM companies ORDER BY company_key"
    )
    const companyKeys = new Set(
      companyRows.rows.map((row) => String(row.company_key))
    )

    const seen = new Set<string>()
    const prepared: { fix: Fix; column: string; value: unknown }[] = []
    for (const fix of fixes) {
      const label = `${fix.companyKey}.${fix.field}`
      if (!fix.companyKey || !fix.field)
        fail(`fix entry missing companyKey/field: ${JSON.stringify(fix)}`)
      if (!columns.has(fix.field)) fail(`${label}: not a companies column`)
      if (fix.field === "id" || fix.field === "company_key") {
        fail(`${label}: ${fix.field} is identity and cannot be audited-edited`)
      }
      if (!companyKeys.has(fix.companyKey))
        fail(`${label}: unknown company_key`)
      if (seen.has(label)) fail(`${label}: duplicate fix entry`)
      seen.add(label)
      if (
        typeof fix.evidence !== "string" ||
        fix.evidence.trim().length === 0
      ) {
        fail(`${label}: evidence is required`)
      }
      const value = normalizeValue(fix.field, fix.newValue)
      if (value === null && columns.get(fix.field)?.notNull) {
        fail(`${label}: column is NOT NULL`)
      }
      prepared.push({ fix, column: fix.field, value })
    }

    console.log(
      `VALIDATED fixes=${prepared.length} companies=${new Set(fixes.map((f) => f.companyKey)).size}`
    )
    if (dryRun) {
      for (const entry of prepared) {
        console.log(
          `DRY ${entry.fix.companyKey}.${entry.column} = ${JSON.stringify(entry.value)}`
        )
      }
      return
    }

    const tx = await client.transaction("write")
    try {
      for (const entry of prepared) {
        const result = await tx.execute({
          sql: `UPDATE companies SET ${entry.column} = ? WHERE company_key = ?`,
          args: [entry.value as never, entry.fix.companyKey],
        })
        if (result.rowsAffected !== 1) {
          throw new Error(
            `${entry.fix.companyKey}.${entry.column}: ${result.rowsAffected} rows affected`
          )
        }
        console.log(
          `OK ${entry.fix.companyKey}.${entry.column} = ${JSON.stringify(entry.value)}`
        )
      }
      await tx.commit()
    } catch (err) {
      await tx.rollback()
      throw err
    } finally {
      tx.close()
    }
    console.log(`APPLIED ${prepared.length} updates`)
  } finally {
    client.close()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : String(err))
  process.exit(1)
})
