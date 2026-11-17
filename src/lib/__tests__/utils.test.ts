import { describe, expect, it } from "vitest"
import { positiveInt } from "../utils"

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
