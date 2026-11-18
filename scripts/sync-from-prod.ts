import { execFile as execFileCb } from "node:child_process"
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { promisify } from "node:util"
import { createClient, type Client, type Transaction } from "@libsql/client"

const execFile = promisify(execFileCb)

const REPO_ROOT = path.resolve(import.meta.dirname, "..")
const LOCAL_DB = path.join(REPO_ROOT, "privacy.db")
const SEED_PATH = path.join(REPO_ROOT, "src/lib/db/seedData.json")
const WRANGLER = path.join(REPO_ROOT, "node_modules/.bin/wrangler")
const D1_NAME = "privacygpt-db"

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

const CHANGELOG_COLUMNS = [
  "id",
  "company_id",
  "detected_at",
  "before_text",
  "after_text",
  "status",
  "review_notes",
  "proposed_changes",
  "reviewed_at",
] as const

const SNAPSHOT_COLUMNS = [
  "id",
  "company_id",
  "fetched_at",
  "content_hash",
  "raw_content",
] as const

const CONFIDENCE_VALUES = new Set([
  "verified_from_policy_text",
  "inferred",
  "needs_review",
  "unverified",
])

const BOOLEAN_COMPANY_COLUMNS = [
  "trains_on_data_by_default",
  "opt_out_available",
  "data_deleted_on_request",
  "human_review_of_chats",
  "enterprise_vs_consumer_difference",
] as const

const USAGE = `Usage:
  bun run scripts/sync-from-prod.ts           Pull + validate only
  bun run scripts/sync-from-prod.ts --apply   Pull, validate, mirror local DB + seed
  bun run scripts/sync-from-prod.ts --help    Show this help`

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

function openDb(dbPath: string): Client {
  return createClient({ url: pathToFileURL(dbPath).href })
}

async function tableColumns(
  client: Client,
  table: string
): Promise<Set<string>> {
  const result = await client.execute(`PRAGMA table_info(${table})`)
  return new Set(result.rows.map((row) => String(row.name)))
}

async function countTable(client: Client, table: string): Promise<number> {
  const result = await client.execute(`SELECT count(*) AS n FROM ${table}`)
  return Number(result.rows[0]?.n ?? 0)
}

async function selectAll(
  client: Client,
  table: string,
  columns: readonly string[]
): Promise<Record<string, unknown>[]> {
  const sql = `SELECT ${columns.join(", ")} FROM ${table}`
  const result = await client.execute(sql)
  return result.rows.map((row) => {
    const out: Record<string, unknown> = {}
    for (const col of columns) {
      out[col] = row[col]
    }
    return out
  })
}

async function importSqlDump(dbPath: string, sqlPath: string): Promise<void> {
  const sql = readFileSync(sqlPath, "utf8")
  const client = openDb(dbPath)
  try {
    await client.executeMultiple(sql)
    return
  } catch {
    // Partial apply may leave tables; rebuild from dump with sqlite3.
  } finally {
    client.close()
  }

  try {
    unlinkSync(dbPath)
  } catch {
    // fresh path may not exist yet
  }

  await execFile("sqlite3", [dbPath, `.read ${sqlPath}`], {
    cwd: REPO_ROOT,
    maxBuffer: 10 * 1024 * 1024,
  })
}

async function pullRemote(tmpDir: string): Promise<string> {
  const sqlPath = path.join(tmpDir, "privacygpt-db.sql")
  const dbPath = path.join(tmpDir, "privacygpt-db.sqlite")

  try {
    await execFile(
      WRANGLER,
      ["d1", "export", D1_NAME, "--remote", "--output", sqlPath, "-y"],
      {
        cwd: REPO_ROOT,
        maxBuffer: 10 * 1024 * 1024,
      }
    )
  } catch (err) {
    fail(
      `Validation failed: wrangler d1 export failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    )
  }

  await importSqlDump(dbPath, sqlPath)

  console.log(`TEMP_DIR=${tmpDir}`)
  console.log(`TEMP_DB=${dbPath}`)
  return dbPath
}

async function validateTempDb(tempClient: Client): Promise<void> {
  for (const table of ["companies", "changelogs", "snapshots"] as const) {
    const cols = await tableColumns(tempClient, table)
    if (cols.size === 0) {
      fail(`Validation failed: table ${table} does not exist`)
    }
  }

  const companyCount1 = await countTable(tempClient, "companies")
  const changelogCount1 = await countTable(tempClient, "changelogs")
  const snapshotCount1 = await countTable(tempClient, "snapshots")

  if (companyCount1 <= 0) {
    fail("Validation failed: companies count is 0")
  }

  const companyCount2 = await countTable(tempClient, "companies")
  const changelogCount2 = await countTable(tempClient, "changelogs")
  const snapshotCount2 = await countTable(tempClient, "snapshots")

  if (
    companyCount1 !== companyCount2 ||
    changelogCount1 !== changelogCount2 ||
    snapshotCount1 !== snapshotCount2
  ) {
    fail("Validation failed: table counts were not stable across reads")
  }

  const required: Record<string, readonly string[]> = {
    companies: COMPANY_COLUMNS,
    changelogs: CHANGELOG_COLUMNS,
    snapshots: SNAPSHOT_COLUMNS,
  }

  for (const [table, columns] of Object.entries(required)) {
    const present = await tableColumns(tempClient, table)
    for (const col of columns) {
      if (!present.has(col)) {
        fail(`Validation failed: temp ${table} missing column ${col}`)
      }
    }
  }

  const orphanChangelogs = await tempClient.execute(`
    SELECT count(*) AS n FROM changelogs c
    LEFT JOIN companies co ON co.id = c.company_id
    WHERE co.id IS NULL
  `)
  if (Number(orphanChangelogs.rows[0]?.n ?? 0) > 0) {
    fail("Validation failed: orphan changelogs.company_id rows")
  }

  const orphanSnapshots = await tempClient.execute(`
    SELECT count(*) AS n FROM snapshots s
    LEFT JOIN companies co ON co.id = s.company_id
    WHERE co.id IS NULL
  `)
  if (Number(orphanSnapshots.rows[0]?.n ?? 0) > 0) {
    fail("Validation failed: orphan snapshots.company_id rows")
  }

  const dupKeys = await tempClient.execute(`
    SELECT company_key, count(*) AS n FROM companies
    GROUP BY company_key HAVING n > 1
  `)
  if (dupKeys.rows.length > 0) {
    fail("Validation failed: duplicate companies.company_key")
  }

  const confidences = await tempClient.execute(
    `SELECT DISTINCT confidence AS v FROM companies`
  )
  for (const row of confidences.rows) {
    const value = String(row.v)
    if (!CONFIDENCE_VALUES.has(value)) {
      fail(`Validation failed: invalid confidence value ${value}`)
    }
  }

  const statuses = await tempClient.execute(
    `SELECT DISTINCT status AS v FROM changelogs`
  )
  for (const row of statuses.rows) {
    const value = String(row.v)
    if (value !== "pending_review" && value !== "reviewed") {
      fail(`Validation failed: invalid changelog status ${value}`)
    }
  }

  for (const col of BOOLEAN_COMPANY_COLUMNS) {
    const bad = await tempClient.execute(
      `SELECT count(*) AS n FROM companies WHERE ${col} NOT IN (0, 1)`
    )
    if (Number(bad.rows[0]?.n ?? 0) > 0) {
      fail(`Validation failed: non-boolean values in companies.${col}`)
    }
  }

  const localClient = openDb(LOCAL_DB)
  try {
    for (const [table, columns] of Object.entries(required)) {
      const present = await tableColumns(localClient, table)
      for (const col of columns) {
        if (!present.has(col)) {
          fail(
            "Local schema is behind prod. Apply migrations before syncing."
          )
        }
      }
    }
  } finally {
    localClient.close()
  }
}

async function printStats(tempClient: Client): Promise<{
  companies: number
  changelogs: number
  snapshots: number
}> {
  const companies = await countTable(tempClient, "companies")
  const changelogs = await countTable(tempClient, "changelogs")
  const snapshots = await countTable(tempClient, "snapshots")

  console.log(
    `counts companies=${companies} changelogs=${changelogs} snapshots=${snapshots}`
  )

  const statusRows = await tempClient.execute(`
    SELECT status, count(*) AS n FROM changelogs
    GROUP BY status ORDER BY status
  `)
  for (const row of statusRows.rows) {
    console.log(`changelog_status ${String(row.status)}=${Number(row.n)}`)
  }

  const ai = await tempClient.execute(
    `SELECT count(*) AS n FROM changelogs WHERE review_notes LIKE 'AI Review%'`
  )
  console.log(`ai_reviewed=${Number(ai.rows[0]?.n ?? 0)}`)

  const proposals = await tempClient.execute(
    `SELECT count(*) AS n FROM changelogs WHERE proposed_changes IS NOT NULL`
  )
  console.log(`proposed_changes_nonnull=${Number(proposals.rows[0]?.n ?? 0)}`)

  const pending = await tempClient.execute(`
    SELECT count(DISTINCT company_id) AS n
    FROM changelogs
    WHERE status = 'pending_review'
  `)
  console.log(`pending_companies=${Number(pending.rows[0]?.n ?? 0)}`)

  return { companies, changelogs, snapshots }
}

function placeholders(n: number): string {
  return Array.from({ length: n }, () => "?").join(", ")
}

async function insertRows(
  tx: Transaction,
  table: string,
  columns: readonly string[],
  rows: Record<string, unknown>[]
): Promise<void> {
  if (rows.length === 0) return
  const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders(columns.length)})`
  for (const row of rows) {
    await tx.execute({
      sql,
      args: columns.map((col) => {
        const value = row[col]
        return value === undefined ? null : (value as string | number | null)
      }),
    })
  }
}

async function applyLocal(
  tmpDir: string,
  tempClient: Client,
  counts: { companies: number; changelogs: number; snapshots: number }
): Promise<void> {
  const backupPath = path.join(tmpDir, "privacy.db.bak")
  copyFileSync(LOCAL_DB, backupPath)
  console.log(`BACKUP=${backupPath}`)

  const companyRows = await selectAll(tempClient, "companies", COMPANY_COLUMNS)
  const changelogRows = await selectAll(
    tempClient,
    "changelogs",
    CHANGELOG_COLUMNS
  )
  const snapshotRows = await selectAll(tempClient, "snapshots", SNAPSHOT_COLUMNS)

  const client = openDb(LOCAL_DB)
  const tx = await client.transaction("write")
  try {
    await tx.execute("DELETE FROM changelogs")
    await tx.execute("DELETE FROM snapshots")
    await tx.execute("DELETE FROM companies")
    await insertRows(tx, "companies", COMPANY_COLUMNS, companyRows)
    await insertRows(tx, "changelogs", CHANGELOG_COLUMNS, changelogRows)
    await insertRows(tx, "snapshots", SNAPSHOT_COLUMNS, snapshotRows)
    await tx.commit()
  } catch (err) {
    await tx.rollback()
    throw err
  } finally {
    tx.close()
    client.close()
  }

  const seedClient = openDb(LOCAL_DB)
  try {
    const result = await seedClient.execute(
      `SELECT ${COMPANY_COLUMNS.join(", ")} FROM companies ORDER BY id`
    )

    const seedRows = result.rows.map((row) => {
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

    writeFileSync(SEED_PATH, `${JSON.stringify(seedRows, null, 2)}\n`, "utf8")
  } finally {
    seedClient.close()
  }

  console.log(
    `SYNCED companies=${counts.companies} changelogs=${counts.changelogs} snapshots=${counts.snapshots} SEED=${SEED_PATH}`
  )
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const apply = args.includes("--apply")
  const help = args.includes("--help")
  const unknown = args.filter((arg) => arg !== "--apply" && arg !== "--help")

  if (help) {
    console.log(USAGE)
    process.exit(0)
  }
  if (unknown.length > 0) {
    console.error(USAGE)
    process.exit(1)
  }

  try {
    await execFile(WRANGLER, ["whoami"], { cwd: REPO_ROOT })
  } catch {
    fail("Cloudflare auth is not valid. Run: bunx wrangler login")
  }

  const tmpDir = mkdtempSync(path.join(tmpdir(), "privacygpt-sync-"))
  const tempDbPath = await pullRemote(tmpDir)
  const tempClient = openDb(tempDbPath)

  try {
    await validateTempDb(tempClient)
    const counts = await printStats(tempClient)

    if (apply) {
      await applyLocal(tmpDir, tempClient, counts)
    }
  } finally {
    tempClient.close()
  }
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err))
})
