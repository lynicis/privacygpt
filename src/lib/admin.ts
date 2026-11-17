"use server"

import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { getDb } from "./db"
import { companies, changelogs } from "./db/schema"
import type { Company } from "./db/schema"
import { eq } from "drizzle-orm"
import { coerceFieldChanges } from "./company-fields"

export function checkAdminAuth(headers: Headers) {
  const authHeader = headers.get("authorization")

  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD

  if (!username || !password) {
    throw new Response("Admin credentials are not configured", {
      status: 500,
    })
  }

  const expectedAuth =
    "Basic " + Buffer.from(`${username}:${password}`).toString("base64")

  if (!authHeader || authHeader !== expectedAuth) {
    throw new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Portal"',
      },
    })
  }
  return { success: true }
}

export const checkAdminAuthFn = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const headers = getRequestHeaders()
      return checkAdminAuth(headers)
    } catch (error) {
      if (error instanceof Response) {
        throw error
      }
      console.error("Auth check failed:", error)
      throw new Error("Internal Server Error during auth check")
    }
  }
)

export const reviewChangelogFn = createServerFn({ method: "POST" })
  .validator((input: { id: number; reviewNotes: string }) => input)
  .handler(async ({ data }) => {
    try {
      // Check auth
      checkAdminAuth(getRequestHeaders())

      const db = await getDb()

      // 1. Fetch changelog to apply potential proposed changes
      const results = await db
        .select()
        .from(changelogs)
        .where(eq(changelogs.id, data.id))
        .limit(1)

      if (results.length === 0) throw new Error("Changelog not found")
      const changelog = results[0]

      // 2. Apply proposed changes to companies table
      if (changelog.proposedChanges) {
        const { updates, skipped } = coerceFieldChanges(
          JSON.parse(changelog.proposedChanges)
        )
        if (skipped.length) {
          console.warn(
            `[admin] Skipped AI fields for changelog ${data.id}: ${skipped.join(", ")}`
          )
        }
        if (Object.keys(updates).length > 0) {
          // coerceFieldChanges narrowed every entry to the column's runtime type
          await db
            .update(companies)
            .set(updates as Partial<Company>)
            .where(eq(companies.id, changelog.companyId))
        }
      }

      // 3. Update the changelog status
      await db
        .update(changelogs)
        .set({
          status: "reviewed",
          reviewNotes: data.reviewNotes,
          reviewedAt: new Date().toISOString(),
        })
        .where(eq(changelogs.id, data.id))

      return { success: true }
    } catch (error) {
      if (error instanceof Response) throw error
      console.error(`Failed to review changelog ${data.id}:`, error)
      throw new Error(`Failed to review changelog: ${data.id}`)
    }
  })
