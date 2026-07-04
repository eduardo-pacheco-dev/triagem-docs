import { describe, it, expect } from "vitest"
import { formatDuration, slaLabel } from "../duration"

describe("formatDuration", () => {
  it("returns 'Menos de 1 min' for less than 1 minute", () => {
    const start = new Date()
    const end = new Date(start.getTime() + 30_000)
    expect(formatDuration(start, end)).toBe("Menos de 1 min")
  })

  it("returns minutes for less than 60 minutes", () => {
    const start = new Date()
    const end = new Date(start.getTime() + 5 * 60_000)
    expect(formatDuration(start, end)).toBe("5 min")
  })

  it("returns hours and minutes for less than 24 hours", () => {
    const start = new Date()
    const end = new Date(start.getTime() + 2 * 3_600_000 + 15 * 60_000)
    expect(formatDuration(start, end)).toBe("2h 15min")
  })

  it("returns days and hours for 24+ hours", () => {
    const start = new Date()
    const end = new Date(start.getTime() + 3 * 24 * 3_600_000 + 5 * 3_600_000)
    expect(formatDuration(start, end)).toBe("3d 5h")
  })

  it("uses current time when end is not provided", () => {
    const start = new Date(Date.now() - 10 * 60_000)
    const result = formatDuration(start)
    expect(result).toBe("10 min")
  })

  it("handles exactly 1 minute", () => {
    const start = new Date()
    const end = new Date(start.getTime() + 60_000)
    expect(formatDuration(start, end)).toBe("1 min")
  })

  it("handles exactly 1 hour", () => {
    const start = new Date()
    const end = new Date(start.getTime() + 3_600_000)
    expect(formatDuration(start, end)).toBe("1h 0min")
  })
})

describe("slaLabel", () => {
  const base = {
    created_at: new Date(Date.now() - 30 * 60_000),
    updated_at: new Date(),
  }

  it("returns only wait for waiting status", () => {
    const result = slaLabel({ ...base, status: "waiting" })
    expect(result).toHaveProperty("wait")
    expect(result.service).toBeUndefined()
    expect(result.total).toBeUndefined()
  })

  it("returns wait and service for in_review status", () => {
    const result = slaLabel({
      ...base,
      status: "in_review",
      started_at: new Date(Date.now() - 15 * 60_000),
    })
    expect(result).toHaveProperty("wait")
    expect(result).toHaveProperty("service")
    expect(result.total).toBeUndefined()
  })

  it("returns wait, service and total for approved status", () => {
    const result = slaLabel({
      ...base,
      status: "approved",
      started_at: new Date(Date.now() - 20 * 60_000),
      completed_at: new Date(Date.now() - 5 * 60_000),
    })
    expect(result).toHaveProperty("wait")
    expect(result).toHaveProperty("service")
    expect(result).toHaveProperty("total")
  })

  it("returns wait, service and total for rejected status", () => {
    const result = slaLabel({
      ...base,
      status: "rejected",
      started_at: new Date(Date.now() - 20 * 60_000),
      completed_at: new Date(Date.now() - 5 * 60_000),
    })
    expect(result).toHaveProperty("wait")
    expect(result).toHaveProperty("service")
    expect(result).toHaveProperty("total")
  })

  it("falls back to created_at when started_at is undefined for in_review", () => {
    const result = slaLabel({
      ...base,
      status: "in_review",
    })
    expect(result).toHaveProperty("wait")
    expect(result).toHaveProperty("service")
  })

  it("returns only wait for unknown status", () => {
    const result = slaLabel({
      ...base,
      status: "unknown_status",
    })
    expect(result).toEqual({ wait: expect.any(String) })
  })
})

describe("statusLabel", () => {
  it("has Portuguese labels for all queue statuses", async () => {
    const { statusLabel } = await import("../queue")
    expect(statusLabel.waiting).toBe("Aguardando Análise")
    expect(statusLabel.in_review).toBe("Em Análise")
    expect(statusLabel.approved).toBe("Aprovado")
    expect(statusLabel.rejected).toBe("Recusado")
  })
})
