import { describe, expect, it } from "vitest"
import { coerceFieldChanges } from "../company-fields"

describe("coerceFieldChanges", () => {
  it("skips unknown fields", () => {
    const { updates, skipped } = coerceFieldChanges([
      { field: "companyName", newValue: "Hacked" },
      { field: "retentionPeriod", newValue: "30 days" },
    ])
    expect(updates).toEqual({ retentionPeriod: "30 days" })
    expect(skipped).toEqual(["companyName"])
  })

  it("coerces boolean strings for boolean fields", () => {
    const { updates, skipped } = coerceFieldChanges([
      { field: "trainsOnDataByDefault", newValue: " FALSE " },
      { field: "optOutAvailable", newValue: "true" },
    ])
    expect(updates).toEqual({
      trainsOnDataByDefault: false,
      optOutAvailable: true,
    })
    expect(skipped).toEqual([])
  })

  it("skips boolean fields with non-boolean values", () => {
    const { updates, skipped } = coerceFieldChanges([
      { field: "humanReviewOfChats", newValue: "yes" },
    ])
    expect(updates).toEqual({})
    expect(skipped).toEqual(["humanReviewOfChats"])
  })

  it("skips entries whose newValue is not a string", () => {
    const { updates, skipped } = coerceFieldChanges([
      { field: "retentionPeriod", newValue: 30 },
    ])
    expect(updates).toEqual({})
    expect(skipped).toEqual(["retentionPeriod"])
  })

  it("throws when the payload is not an array", () => {
    expect(() => coerceFieldChanges({ field: "optOutHow" })).toThrow(
      "proposedChanges must be an array"
    )
  })
})
