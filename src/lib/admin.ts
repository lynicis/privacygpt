"use server"

import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { getDb } from "./db"
import { companies, changelogs } from "./db/schema"
import { eq } from "drizzle-orm"

export function checkAdminAuth(headers: Headers) {
  const authHeader = headers.get("authorization")

  const username = process.env.ADMIN_USERNAME || "admin"
  const password = process.env.ADMIN_PASSWORD || "adminpassword"

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
      await checkAdminAuthFn()

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
        try {
          const fieldChanges = JSON.parse(changelog.proposedChanges)
          const updateData: Record<string, any> = {}
          for (const change of fieldChanges) {
            updateData[change.field] = change.newValue
          }
          if (Object.keys(updateData).length > 0) {
            await db
              .update(companies)
              .set(updateData)
              .where(eq(companies.id, changelog.companyId))
          }
        } catch (e) {
          console.error("Failed to apply proposed changes", e)
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
      console.error(`Failed to review changelog ${data.id}:`, error)
      throw new Error(`Failed to review changelog: ${data.id}`)
    }
  })
