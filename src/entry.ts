import handler from "@tanstack/react-start/server-entry"
import { handleWatchdogQueueMessage, runWatchdog } from "./lib/watchdog"
import { reviewChangelogWithAI } from "./lib/ai-reviewer"

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}

const HTML_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ")

export default {
  async fetch(request: Request) {
    const response = await handler.fetch(request)
    const headers = new Headers(response.headers)
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      if (!headers.has(key)) {
        headers.set(key, value)
      }
    }
    const contentType = headers.get("content-type") ?? ""
    if (
      contentType.includes("text/html") &&
      !headers.has("Content-Security-Policy")
    ) {
      headers.set("Content-Security-Policy", HTML_CSP)
    }
    if (new URL(request.url).pathname === "/admin") {
      headers.set("Cache-Control", "private, no-store")
      headers.set("X-Robots-Tag", "noindex, nofollow")
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  },
  async scheduled(
    _event: ScheduledController,
    env: Env,
    _ctx: ExecutionContext
  ) {
    await runWatchdog(env)
  },
  async queue(batch: MessageBatch<unknown>, env: Env, _ctx: ExecutionContext) {
    const queueName = batch.queue

    if (queueName === "privacygpt-ai-review-queue") {
      for (const message of batch.messages) {
        const body = message.body as { changelogId: number }
        try {
          await reviewChangelogWithAI(body.changelogId, env)
          message.ack()
        } catch (err) {
          console.error(
            `[ai-review] Failed for changelog ${body.changelogId}:`,
            err
          )
          message.retry()
        }
      }
    } else if (queueName === "privacygpt-watchdog-queue") {
      for (const message of batch.messages) {
        const body = message.body as { companyId?: number } | null
        try {
          await handleWatchdogQueueMessage(body, env)
          message.ack()
        } catch (err) {
          console.error(
            `[watchdog] Failed for company ${body?.companyId}:`,
            err
          )
          message.retry()
        }
      }
    } else {
      console.warn(`[queue] Unknown queue: ${queueName}`)
    }
  },
}
