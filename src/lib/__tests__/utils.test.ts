import { describe, expect, it } from "vitest"
import { formatDateTime, positiveInt } from "../utils"

describe("formatDateTime", () => {
  it("formats ISO timestamps deterministically in UTC", () => {
    expect(formatDateTime("2026-06-23T14:05:00.000Z")).toBe(
      "Jun 23, 2026 at 2:05 PM UTC"
    )
    expect(formatDateTime("2026-01-01T00:00:00.000Z")).toBe(
      "Jan 1, 2026 at 12:00 AM UTC"
    )
  })
})

describe("positiveInt", () => {
  it("falls back for non-numeric input", () => {
    expect(positiveInt("abc", 1)).toBe(1)
    expect(positiveInt(undefined, 1)).toBe(1)
    expect(positiveInt(null, 1)).toBe(1)
  })

  it("rejects zero and negative values", () => {
    expect(positiveInt(0, 1)).toBe(1)
    expect(positiveInt(-5, 1)).toBe(1)
  })

  it("clamps to the maximum", () => {
    expect(positiveInt(5000, 20, 1000)).toBe(1000)
  })

  it("accepts numeric strings", () => {
    expect(positiveInt("3", 1)).toBe(3)
  })
})
