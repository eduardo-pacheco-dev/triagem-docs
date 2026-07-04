import { beforeAll, afterAll } from "vitest"

beforeAll(async () => {
  process.env.DATABASE_URL = "file:./prisma/test.db"
  process.env.DIRECT_URL = "file:./prisma/test.db"
})

afterAll(async () => {
  const { prisma } = await import("@/lib/prisma")
  await prisma.$disconnect()
})
