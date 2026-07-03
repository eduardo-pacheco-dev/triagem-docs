"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { revalidatePath } from "next/cache"
import type { QueueEntry, QueueStatus, RequestType } from "./queue"

const VALID_STATUSES = ["waiting", "in_review", "approved", "rejected"] as const

const createSchema = z.object({
  site_id: z.string().min(1, "SITE ID é obrigatório").max(100),
  technician_name: z.string().min(1, "Nome do técnico é obrigatório").max(200),
  request_type: z.string().min(1, "Tipo de solicitação é obrigatório").max(200),
})

const statusSchema = z.enum(VALID_STATUSES)

const nameSchema = z.string().min(1, "Nome é obrigatório").max(200)

function mapEntry(e: Awaited<ReturnType<typeof prisma.queueEntry.findFirst>>): QueueEntry | null {
  if (!e) return null
  return {
    id: e.id,
    protocol: e.protocol,
    full_name: e.fullName,
    identifier: e.identifier,
    site_id: e.siteId,
    technician_name: e.technicianName,
    request_type: e.requestType,
    status: e.status as QueueStatus,
    position_seq: Number(e.positionSeq),
    created_at: e.createdAt,
    updated_at: e.updatedAt,
    started_at: e.startedAt ?? undefined,
    completed_at: e.completedAt ?? undefined,
  }
}

function mapEntryList(entries: Awaited<ReturnType<typeof prisma.queueEntry.findMany>>): QueueEntry[] {
  return entries
    .filter((e): e is NonNullable<typeof e> => e != null)
    .map((e) => ({
      id: e.id,
      protocol: e.protocol,
      full_name: e.fullName,
      identifier: e.identifier,
      site_id: e.siteId,
      technician_name: e.technicianName,
      request_type: e.requestType,
      status: e.status as QueueStatus,
      position_seq: Number(e.positionSeq),
      created_at: e.createdAt,
      updated_at: e.updatedAt,
      started_at: e.startedAt ?? undefined,
      completed_at: e.completedAt ?? undefined,
    }))
}

function mapType(t: Awaited<ReturnType<typeof prisma.requestType.findFirst>>): RequestType | null {
  if (!t) return null
  return {
    id: t.id,
    name: t.name,
    created_at: t.createdAt,
  }
}

function mapTypeList(types: Awaited<ReturnType<typeof prisma.requestType.findMany>>): RequestType[] {
  return types.map((t) => ({
    id: t.id,
    name: t.name,
    created_at: t.createdAt,
  }))
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
}

export async function createCheckIn(input: z.infer<typeof createSchema>) {
  const h = await headers()
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown"
  if (!checkRateLimit(`createCheckIn:${ip}`)) {
    throw new Error("Muitas solicitações. Aguarde um minuto.")
  }

  const parsed = createSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0].message)
  }

  const { site_id, technician_name, request_type } = parsed.data
  const n = Math.floor(1000 + Math.random() * 9000)
  const protocol = `DOC-${n}`

  try {
    const entry = await prisma.queueEntry.create({
      data: {
        protocol,
        siteId: site_id.trim(),
        technicianName: technician_name.trim(),
        requestType: request_type.trim(),
        fullName: technician_name.trim(),
        identifier: site_id.trim(),
        status: "waiting",
      },
    })

    revalidatePath("/")
    revalidatePath("/admin")
    return mapEntry(entry)!
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
      throw new Error("Erro ao gerar protocolo. Tente novamente.")
    }
    console.error("[createCheckIn]", error)
    throw new Error("Erro ao registrar solicitação.")
  }
}

export async function fetchActiveQueue(): Promise<QueueEntry[]> {
  const entries = await prisma.queueEntry.findMany({
    where: { status: { in: ["waiting", "in_review"] } },
    orderBy: { positionSeq: "asc" },
  })
  return mapEntryList(entries)
}

export async function fetchArchivedQueue(): Promise<QueueEntry[]> {
  const entries = await prisma.queueEntry.findMany({
    where: { status: { in: ["approved", "rejected"] } },
    orderBy: { updatedAt: "desc" },
  })
  return mapEntryList(entries)
}

export async function fetchBySiteId(siteId: string): Promise<{
  entries: QueueEntry[]
  position: number | null
}> {
  const entries = await prisma.queueEntry.findMany({
    where: { siteId: siteId.trim() },
    orderBy: { createdAt: "desc" },
  })
  const latest = entries[0]
  let position: number | null = null
  if (latest && (latest.status === "waiting" || latest.status === "in_review")) {
    const ahead = await prisma.queueEntry.count({
      where: {
        status: { in: ["waiting", "in_review"] },
        positionSeq: { lt: latest.positionSeq },
      },
    })
    position = ahead + 1
  }
  return { entries: mapEntryList(entries), position }
}

export async function updateStatus(id: string, status: string) {
  await requireAdmin()

  const parsedStatus = statusSchema.safeParse(status)
  if (!parsedStatus.success) {
    throw new Error("Status inválido.")
  }

  try {
    const current = await prisma.queueEntry.findUnique({ where: { id } })
    if (!current) throw new Error("Entry not found")

    const slaData: {
      startedAt?: Date | null
      completedAt?: Date | null
    } = {}

    if (parsedStatus.data === "in_review" && !current.startedAt) {
      slaData.startedAt = new Date()
    }
    if ((parsedStatus.data === "approved" || parsedStatus.data === "rejected") && !current.completedAt) {
      slaData.completedAt = new Date()
    }
    if (parsedStatus.data === "waiting") {
      slaData.startedAt = null
      slaData.completedAt = null
    }

    const data = { status: parsedStatus.data, ...slaData }

    const entry = await prisma.queueEntry.update({
      where: { id },
      data,
    })
    revalidatePath("/admin")
    revalidatePath("/admin/arquivados")
    return mapEntry(entry)
  } catch (error) {
    console.error("[updateStatus]", error)
    throw new Error("Erro ao atualizar status.")
  }
}

export async function fetchRequestTypes(): Promise<RequestType[]> {
  const types = await prisma.requestType.findMany({
    orderBy: { name: "asc" },
  })
  return mapTypeList(types)
}

export async function addRequestType(name: string): Promise<RequestType> {
  await requireAdmin()

  const h = await headers()
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown"
  if (!checkRateLimit(`addRequestType:${ip}`)) {
    throw new Error("Muitas solicitações. Aguarde um minuto.")
  }

  const parsed = nameSchema.safeParse(name)
  if (!parsed.success) {
    throw new Error("Nome do tipo inválido.")
  }

  try {
    const type = await prisma.requestType.create({
      data: { name: parsed.data.trim() },
    })
    revalidatePath("/admin/configuracoes")
    return mapType(type)!
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
      throw new Error("Este tipo já existe.")
    }
    console.error("[addRequestType]", error)
    throw new Error("Erro ao adicionar tipo.")
  }
}

export async function deleteRequestType(id: string) {
  await requireAdmin()

  try {
    await prisma.requestType.delete({
      where: { id },
    })
    revalidatePath("/admin/configuracoes")
  } catch (error) {
    console.error("[deleteRequestType]", error)
    throw new Error("Erro ao remover tipo.")
  }
}

export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })
  if (!user) throw new Error("User not found")

  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash)
  if (!valid) throw new Error("Senha atual incorreta.")

  const parsed = z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres").safeParse(data.newPassword)
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const hash = await bcrypt.hash(parsed.data, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash },
  })
}
