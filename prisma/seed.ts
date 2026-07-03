import { PrismaClient } from "@prisma/client"

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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
