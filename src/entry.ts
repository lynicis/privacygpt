import handler from "@tanstack/react-start/server-entry"
import { handleWatchdogQueueMessage, runWatchdog } from "./lib/watchdog"
import { reviewChangelogWithAI } from "./lib/ai-reviewer"

export default {
  fetch: handler.fetch,
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
