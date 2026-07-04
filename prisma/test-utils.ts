import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function cleanDatabase() {
  await prisma.queueEntry.deleteMany()
  await prisma.requestType.deleteMany()
  await prisma.slaConfig.deleteMany()
  await prisma.user.deleteMany()
}

export async function seedRequestTypes() {
  const types = ["Instalação", "Manutenção Preventiva", "Auditoria"]
  for (const name of types) {
    await prisma.requestType.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  return prisma.requestType.findMany({ orderBy: { name: "asc" } })
}

export async function seedAdminUser() {
  const hash = await bcrypt.hash("admin", 10)
  return prisma.user.upsert({
    where: { username: "admin" },
    update: { passwordHash: hash },
    create: { username: "admin", passwordHash: hash },
  })
}

let _positionSeq = 0

export async function seedQueueEntries(overrides: Partial<{
  count: number
  siteId: string
  status: string
}> = {}) {
  const { count = 3, siteId, status } = overrides
  const entries = []

  for (let i = 0; i < count; i++) {
    _positionSeq++
    const entry = await prisma.queueEntry.create({
      data: {
        protocol: `TEST-${1000 + i}_${Date.now()}`,
        fullName: `Technician ${i + 1}`,
        identifier: siteId ?? `SITE-${(i % 3) + 1}`,
        siteId: siteId ?? `SITE-${(i % 3) + 1}`,
        technicianName: `Technician ${i + 1}`,
        requestType: "Instalação",
        status: status ?? "waiting",
        positionSeq: _positionSeq,
      },
    })
    entries.push(entry)
  }

  return entries
}

export function resetPositionSeq() {
  _positionSeq = 0
}
