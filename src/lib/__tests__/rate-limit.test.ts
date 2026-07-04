import { describe, it, expect } from "vitest"
import { checkRateLimit } from "../rate-limit"

const MAX_REQUESTS = 30

describe("checkRateLimit", () => {
  it("allows first request for a new key", () => {
    expect(checkRateLimit("unit-1")).toBe(true)
  })

  it("allows up to MAX_REQUESTS within window", () => {
    const key = "unit-burst"
    for (let i = 0; i < MAX_REQUESTS; i++) {
      expect(checkRateLimit(key)).toBe(true)
    }
  })

  it("blocks requests exceeding MAX_REQUESTS", () => {
    const key = "unit-block"
    for (let i = 0; i < MAX_REQUESTS; i++) {
      checkRateLimit(key)
    }
    expect(checkRateLimit(key)).toBe(false)
  })

  it("handles multiple keys independently", () => {
    const fullKey = "unit-full"
    for (let i = 0; i < MAX_REQUESTS; i++) {
      checkRateLimit(fullKey)
    }
    expect(checkRateLimit(fullKey)).toBe(false)
    expect(checkRateLimit("unit-other")).toBe(true)
  })
})
