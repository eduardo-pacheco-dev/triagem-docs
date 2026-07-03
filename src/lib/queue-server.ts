"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { QueueEntry, QueueStatus, RequestType } from "./queue"

export async function createCheckIn(input: {
  site_id: string
  technician_name: string
  request_type: string
}) {
  const n = Math.floor(1000 + Math.random() * 9000)
  const protocol = `DOC-${n}`

  try {
    const entry = await prisma.queueEntry.create({
      data: {
        protocol,
        siteId: input.site_id.trim(),
        technicianName: input.technician_name.trim(),
        requestType: input.request_type.trim(),
        fullName: input.technician_name.trim(),
        identifier: input.site_id.trim(),
        status: "waiting",
      },
    })

    revalidatePath("/")
    revalidatePath("/admin")
    return entry as unknown as QueueEntry
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
      throw new Error("Protocolo duplicado. Tente novamente.")
    }
    throw error
  }
}

export async function fetchActiveQueue(): Promise<QueueEntry[]> {
  const entries = await prisma.queueEntry.findMany({
    orderBy: { positionSeq: "asc" },
  })
  return entries as unknown as QueueEntry[]
}

export async function fetchBySiteId(siteId: string): Promise<QueueEntry[]> {
  const entries = await prisma.queueEntry.findMany({
    where: { siteId: siteId.trim() },
    orderBy: { createdAt: "desc" },
  })
  return entries as unknown as QueueEntry[]
}

export async function updateStatus(id: string, status: QueueStatus) {
  await prisma.queueEntry.update({
    where: { id },
    data: { status },
  })
  revalidatePath("/admin")
}

export async function fetchRequestTypes(): Promise<RequestType[]> {
  const types = await prisma.requestType.findMany({
    orderBy: { name: "asc" },
  })
  return types as unknown as RequestType[]
}

export async function addRequestType(name: string): Promise<RequestType> {
  const type = await prisma.requestType.create({
    data: { name: name.trim() },
  })
  revalidatePath("/admin/configuracoes")
  return type as unknown as RequestType
}

export async function deleteRequestType(id: string) {
  await prisma.requestType.delete({
    where: { id },
  })
  revalidatePath("/admin/configuracoes")
}
