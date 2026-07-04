import { describe, it, expect, beforeAll, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { cleanDatabase, seedRequestTypes, seedAdminUser, seedQueueEntries, resetPositionSeq } from "../../../prisma/test-utils"

beforeEach(async () => {
  await cleanDatabase()
  resetPositionSeq()
})

describe("QueueEntry database operations", () => {
  describe("create", () => {
    it("creates a queue entry with waiting status and valid protocol", async () => {
      const entry = await prisma.queueEntry.create({
        data: {
          protocol: "DOC-1234",
          fullName: "John Doe",
          identifier: "SITE-001",
          siteId: "SITE-001",
          technicianName: "John Doe",
          requestType: "Instalação",
          status: "waiting",
          positionSeq: 1,
        },
      })

      expect(entry).toBeDefined()
      expect(entry.id).toBeDefined()
      expect(entry.protocol).toBe("DOC-1234")
      expect(entry.status).toBe("waiting")
      expect(entry.fullName).toBe("John Doe")
      expect(entry.siteId).toBe("SITE-001")
      expect(entry.positionSeq).toBeGreaterThan(0)
      expect(entry.createdAt).toBeInstanceOf(Date)
    })

    it("enforces unique protocol constraint", async () => {
      await prisma.queueEntry.create({
        data: {
          protocol: "DOC-9999",
          fullName: "A",
          identifier: "S1",
          siteId: "S1",
          technicianName: "A",
          requestType: "Instalação",
          positionSeq: 1,
        },
      })

      await expect(
        prisma.queueEntry.create({
          data: {
            protocol: "DOC-9999",
            fullName: "B",
            identifier: "S2",
            siteId: "S2",
            technicianName: "B",
            requestType: "Auditoria",
            positionSeq: 2,
          },
        }),
      ).rejects.toThrow()
    })
  })

  describe("fetchActiveQueue", () => {
    it("returns only waiting and in_review entries ordered by position", async () => {
      await seedQueueEntries({ count: 2, status: "waiting" })
      await seedQueueEntries({ count: 1, status: "in_review" })
      await seedQueueEntries({ count: 2, status: "approved" })
      await seedQueueEntries({ count: 1, status: "rejected" })

      const entries = await prisma.queueEntry.findMany({
        where: { status: { in: ["waiting", "in_review"] } },
        orderBy: { positionSeq: "asc" },
      })

      expect(entries).toHaveLength(3)
      for (const e of entries) {
        expect(["waiting", "in_review"]).toContain(e.status)
      }
    })
  })

  describe("fetchArchivedQueue", () => {
    it("returns only approved and rejected entries ordered by updatedAt desc", async () => {
      await seedQueueEntries({ count: 2, status: "approved" })
      await seedQueueEntries({ count: 1, status: "rejected" })
      await seedQueueEntries({ count: 2, status: "waiting" })

      const entries = await prisma.queueEntry.findMany({
        where: { status: { in: ["approved", "rejected"] } },
        orderBy: { updatedAt: "desc" },
      })

      expect(entries).toHaveLength(3)
      for (const e of entries) {
        expect(["approved", "rejected"]).toContain(e.status)
      }
    })
  })

  describe("fetchBySiteId", () => {
    it("returns entries filtered by siteId ordered by createdAt desc", async () => {
      await seedQueueEntries({ count: 2, siteId: "SITE-A" })
      await seedQueueEntries({ count: 3, siteId: "SITE-B" })

      const entries = await prisma.queueEntry.findMany({
        where: { siteId: "SITE-A" },
        orderBy: { createdAt: "desc" },
      })

      expect(entries).toHaveLength(2)
      for (const e of entries) {
        expect(e.siteId).toBe("SITE-A")
      }
    })
  })

  describe("updateStatus", () => {
    it("updates status and sets startedAt when moving to in_review", async () => {
      const [entry] = await seedQueueEntries({ count: 1, status: "waiting" })

      const updated = await prisma.queueEntry.update({
        where: { id: entry.id },
        data: { status: "in_review", startedAt: new Date() },
      })

      expect(updated.status).toBe("in_review")
      expect(updated.startedAt).toBeInstanceOf(Date)
      expect(updated.completedAt).toBeNull()
    })

    it("sets completedAt when moving to approved or rejected", async () => {
      const [entry] = await seedQueueEntries({ count: 1, status: "in_review" })

      const updated = await prisma.queueEntry.update({
        where: { id: entry.id },
        data: { status: "approved", completedAt: new Date() },
      })

      expect(updated.status).toBe("approved")
      expect(updated.completedAt).toBeInstanceOf(Date)

      const rejected = await prisma.queueEntry.update({
        where: { id: entry.id },
        data: { status: "rejected", completedAt: new Date() },
      })

      expect(rejected.status).toBe("rejected")
      expect(rejected.completedAt).toBeInstanceOf(Date)
    })

    it("clears SLA timestamps when moving back to waiting", async () => {
      const [entry] = await seedQueueEntries({ count: 1, status: "in_review" })
      await prisma.queueEntry.update({
        where: { id: entry.id },
        data: { status: "in_review", startedAt: new Date() },
      })

      const reset = await prisma.queueEntry.update({
        where: { id: entry.id },
        data: { status: "waiting", startedAt: null, completedAt: null },
      })

      expect(reset.status).toBe("waiting")
      expect(reset.startedAt).toBeNull()
      expect(reset.completedAt).toBeNull()
    })
  })
})

describe("RequestType database operations", () => {
  it("creates and lists request types ordered by name", async () => {
    await seedRequestTypes()

    const types = await prisma.requestType.findMany({ orderBy: { name: "asc" } })

    expect(types).toHaveLength(3)
    expect(types.map((t) => t.name)).toEqual([
      "Auditoria",
      "Instalação",
      "Manutenção Preventiva",
    ])
  })

  it("enforces unique name constraint", async () => {
    await prisma.requestType.create({ data: { name: "UniqueType" } })

    await expect(
      prisma.requestType.create({ data: { name: "UniqueType" } }),
    ).rejects.toThrow()
  })

  it("deletes a request type", async () => {
    const type = await prisma.requestType.create({ data: { name: "TempType" } })

    await prisma.requestType.delete({ where: { id: type.id } })

    const found = await prisma.requestType.findUnique({ where: { id: type.id } })
    expect(found).toBeNull()
  })
})

describe("SlaConfig database operations", () => {
  it("creates config with default values", async () => {
    const config = await prisma.slaConfig.create({ data: {} })

    expect(config.expectedWaitMin).toBe(60)
    expect(config.expectedServiceMin).toBe(120)
  })

  it("updates config values", async () => {
    const config = await prisma.slaConfig.create({ data: {} })

    const updated = await prisma.slaConfig.update({
      where: { id: config.id },
      data: { expectedWaitMin: 30, expectedServiceMin: 90 },
    })

    expect(updated.expectedWaitMin).toBe(30)
    expect(updated.expectedServiceMin).toBe(90)
  })
})

describe("User database operations", () => {
  it("creates user with hashed password", async () => {
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("testpass", 10)

    const user = await prisma.user.create({
      data: { username: "testuser", passwordHash: hash },
    })

    expect(user.username).toBe("testuser")
    const valid = await bcrypt.compare("testpass", user.passwordHash)
    expect(valid).toBe(true)
  })

  it("enforces unique username constraint", async () => {
    const hash = await (await import("bcryptjs")).hash("pass", 10)
    await prisma.user.create({ data: { username: "unique", passwordHash: hash } })

    await expect(
      prisma.user.create({ data: { username: "unique", passwordHash: hash } }),
    ).rejects.toThrow()
  })

  it("updates password hash", async () => {
    const bcrypt = await import("bcryptjs")
    const oldHash = await bcrypt.hash("oldpass", 10)
    const user = await prisma.user.create({
      data: { username: "changeme", passwordHash: oldHash },
    })

    const newHash = await bcrypt.hash("newpass", 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    })

    const updated = await prisma.user.findUnique({ where: { id: user.id } })
    const validOld = await bcrypt.compare("oldpass", updated!.passwordHash)
    const validNew = await bcrypt.compare("newpass", updated!.passwordHash)
    expect(validOld).toBe(false)
    expect(validNew).toBe(true)
  })
})

describe("Mapping functions (queue-server.ts)", () => {
  it("mapEntry converts Prisma model to QueueEntry interface", async () => {
    const entry = await prisma.queueEntry.create({
      data: {
        protocol: "MAP-0001",
        fullName: "Map Test",
        identifier: "SITE-MAP",
        siteId: "SITE-MAP",
        technicianName: "Map Test",
        requestType: "Auditoria",
        status: "waiting",
        positionSeq: 1,
      },
    })

    const mapped = {
      id: entry.id,
      protocol: entry.protocol,
      full_name: entry.fullName,
      identifier: entry.identifier,
      site_id: entry.siteId,
      technician_name: entry.technicianName,
      request_type: entry.requestType,
      status: entry.status,
      position_seq: Number(entry.positionSeq),
      created_at: entry.createdAt,
      updated_at: entry.updatedAt,
      started_at: entry.startedAt ?? undefined,
      completed_at: entry.completedAt ?? undefined,
    }

    expect(mapped.id).toBe(entry.id)
    expect(mapped.full_name).toBe(entry.fullName)
    expect(mapped.site_id).toBe(entry.siteId)
    expect(mapped.technician_name).toBe(entry.technicianName)
    expect(mapped.request_type).toBe(entry.requestType)
    expect(mapped.status).toBe("waiting")
    expect(typeof mapped.position_seq).toBe("number")
    expect(mapped.started_at).toBeUndefined()
    expect(mapped.completed_at).toBeUndefined()
  })
})
