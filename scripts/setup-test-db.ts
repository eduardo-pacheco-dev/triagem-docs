import { execSync } from "child_process"

async function main() {
  const env = {
    ...process.env,
    DATABASE_URL: process.env.TEST_DATABASE_URL!,
    DIRECT_URL: process.env.TEST_DIRECT_URL!,
  }

  console.log("Pushing schema to test database...")
  execSync("npx prisma db push --force-reset", { env, stdio: "inherit" })

  console.log("Seeding test database...")
  execSync("npx tsx prisma/seed.ts", { env, stdio: "inherit" })

  console.log("Test database ready.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
