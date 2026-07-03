import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const requestTypes = [
  "Instalação",
  "Manutenção Preventiva",
  "Auditoria",
]

async function main() {
  for (const name of requestTypes) {
    await prisma.requestType.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  console.log("Seed completed: request types inserted")

  const hash = await bcrypt.hash("admin", 10)
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: { passwordHash: hash },
    create: {
      username: "admin",
      passwordHash: hash,
    },
  })
  console.log('Admin user "admin" created with default password')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
