import bcrypt from "bcryptjs"
import type { QueueEntry, QueueStatus, RequestType } from "./queue"

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

export class ApiError extends Error {}

interface RawQueueEntry {
  id: string | number
  protocol: string
  full_name: string
  identifier: string
  site_id: string
  technician_name: string
  request_type: string
  status: string
  position_seq: number
  created_at: string
  updated_at: string
  started_at?: string | null
  completed_at?: string | null
}

interface RawRequestType {
  id: string | number
  name: string
  created_at: string
}

interface RawSlaConfig {
  id: string | number
  expected_wait_min: number
  expected_service_min: number
  updated_at: string
}

export interface SlaConfig {
  id: string
  expectedWaitMin: number
  expectedServiceMin: number
  updatedAt: Date
}

function toQueueEntry(raw: RawQueueEntry): QueueEntry {
  return {
    id: String(raw.id),
    protocol: raw.protocol,
    full_name: raw.full_name,
    identifier: raw.identifier,
    site_id: raw.site_id,
    technician_name: raw.technician_name,
    request_type: raw.request_type,
    status: raw.status as QueueStatus,
    position_seq: Number(raw.position_seq),
    created_at: new Date(raw.created_at),
    updated_at: new Date(raw.updated_at),
    started_at: raw.started_at ? new Date(raw.started_at) : undefined,
    completed_at: raw.completed_at ? new Date(raw.completed_at) : undefined,
  }
}

function toRequestType(raw: RawRequestType): RequestType {
  return {
    id: String(raw.id),
    name: raw.name,
    created_at: new Date(raw.created_at),
  }
}

function toSlaConfig(raw: RawSlaConfig): SlaConfig {
  return {
    id: String(raw.id),
    expectedWaitMin: Number(raw.expected_wait_min),
    expectedServiceMin: Number(raw.expected_service_min),
    updatedAt: new Date(raw.updated_at),
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  if (!res.ok) throw new ApiError(`HTTP ${res.status}`)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function createCheckIn(input: {
  site_id: string
  technician_name: string
  request_type: string
}): Promise<QueueEntry> {
  const n = Math.floor(1000 + Math.random() * 9000)
  const protocol = `DOC-${n}`
  const now = new Date().toISOString()
  const all = await request<RawQueueEntry[]>("/queue_entries")
  const seq = all.reduce((max, e) => Math.max(max, Number(e.position_seq)), 0) + 1

  const raw = await request<RawQueueEntry>("/queue_entries", {
    method: "POST",
    body: JSON.stringify({
      id: crypto.randomUUID(),
      protocol,
      full_name: input.technician_name.trim(),
      identifier: input.site_id.trim(),
      site_id: input.site_id.trim(),
      technician_name: input.technician_name.trim(),
      request_type: input.request_type.trim(),
      status: "waiting",
      position_seq: seq,
      created_at: now,
      updated_at: now,
      started_at: null,
      completed_at: null,
    }),
  })
  return toQueueEntry(raw)
}

export async function fetchActiveQueue(): Promise<QueueEntry[]> {
  const raws = await request<RawQueueEntry[]>("/queue_entries")
  return raws
    .map(toQueueEntry)
    .filter((e) => e.status === "waiting" || e.status === "in_review")
    .sort((a, b) => a.position_seq - b.position_seq)
}

export async function fetchArchivedQueue(): Promise<QueueEntry[]> {
  const raws = await request<RawQueueEntry[]>("/queue_entries")
  return raws
    .map(toQueueEntry)
    .filter((e) => e.status === "approved" || e.status === "rejected")
    .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
}

export async function fetchBySiteId(siteId: string): Promise<{
  entries: QueueEntry[]
  position: number | null
}> {
  const raws = await request<RawQueueEntry[]>(
    `/queue_entries?site_id=${encodeURIComponent(siteId.trim())}`,
  )
  const entries = raws
    .map(toQueueEntry)
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())

  const latest = entries[0]
  let position: number | null = null
  if (latest && (latest.status === "waiting" || latest.status === "in_review")) {
    const all = await request<RawQueueEntry[]>("/queue_entries")
    const ahead = all
      .map(toQueueEntry)
      .filter(
        (e) =>
          (e.status === "waiting" || e.status === "in_review") &&
          e.position_seq < latest.position_seq,
      ).length
    position = ahead + 1
  }

  return { entries, position }
}

export async function updateStatus(id: string, status: QueueStatus): Promise<QueueEntry> {
  const raw = await request<RawQueueEntry>(`/queue_entries/${id}`)
  const current = toQueueEntry(raw)
  const now = new Date().toISOString()

  const patch: Partial<RawQueueEntry> = { status, updated_at: now }
  if (status === "in_review" && !current.started_at) {
    patch.started_at = now
  }
  if ((status === "approved" || status === "rejected") && !current.completed_at) {
    patch.completed_at = now
  }
  if (status === "waiting") {
    patch.started_at = null
    patch.completed_at = null
  }

  const updated = await request<RawQueueEntry>(`/queue_entries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  })
  return toQueueEntry(updated)
}

export async function fetchRequestTypes(): Promise<RequestType[]> {
  const raws = await request<RawRequestType[]>(`/request_types?_sort=name&_order=asc`)
  return raws.map(toRequestType)
}

export async function addRequestType(name: string): Promise<RequestType> {
  const clean = name.trim()
  if (!clean) throw new Error("Nome do tipo inválido.")

  const existing = await fetchRequestTypes()
  if (existing.some((t) => t.name.toLowerCase() === clean.toLowerCase())) {
    throw new Error("Este tipo já existe.")
  }

  const raw = await request<RawRequestType>("/request_types", {
    method: "POST",
    body: JSON.stringify({
      id: crypto.randomUUID(),
      name: clean,
      created_at: new Date().toISOString(),
    }),
  })
  return toRequestType(raw)
}

export async function deleteRequestType(id: string): Promise<void> {
  await request(`/request_types/${encodeURIComponent(id)}`, { method: "DELETE" })
}

export async function fetchSlaConfig(): Promise<SlaConfig> {
  const raws = await request<RawSlaConfig[]>("/sla_config")
  const first = raws[0]
  if (!first) throw new Error("Configuração SLA não encontrada.")
  return toSlaConfig(first)
}

export async function updateSlaConfig(data: {
  expectedWaitMin: number
  expectedServiceMin: number
}): Promise<void> {
  const config = await fetchSlaConfig()
  await request(`/sla_config/${encodeURIComponent(config.id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      expected_wait_min: data.expectedWaitMin,
      expected_service_min: data.expectedServiceMin,
      updated_at: new Date().toISOString(),
    }),
  })
}

export async function fetchDashboard() {
  const raws = await request<RawQueueEntry[]>("/queue_entries")
  const entries = raws.map(toQueueEntry)

  const total = entries.length
  const waiting = entries.filter((e) => e.status === "waiting").length
  const inReview = entries.filter((e) => e.status === "in_review").length
  const approved = entries.filter((e) => e.status === "approved").length
  const rejected = entries.filter((e) => e.status === "rejected").length

  const done = entries.filter((e) => e.started_at && e.completed_at)
  let avgWaitSec = 0
  let avgServiceSec = 0
  if (done.length > 0) {
    const waitSum = done.reduce(
      (acc, e) => acc + (e.started_at!.getTime() - e.created_at.getTime()),
      0,
    )
    const serviceSum = done.reduce(
      (acc, e) => acc + (e.completed_at!.getTime() - e.started_at!.getTime()),
      0,
    )
    avgWaitSec = Math.round(waitSum / done.length / 1000)
    avgServiceSec = Math.round(serviceSum / done.length / 1000)
  }

  const recent = [...entries]
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    .slice(0, 10)

  return {
    total,
    waiting,
    inReview,
    approved,
    rejected,
    avgWaitMin: Math.round(avgWaitSec / 60),
    avgServiceMin: Math.round(avgServiceSec / 60),
    recent,
  }
}

interface RawUser {
  id: string | number
  username: string
  password_hash: string
  created_at: string
}

export async function changePassword(username: string, data: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  const res = await request<RawUser[]>(`/users?username=${encodeURIComponent(username)}`)
  const user = res[0]
  if (!user) throw new Error("User not found")

  const valid = await bcrypt.compare(data.currentPassword, user.password_hash)
  if (!valid) throw new Error("Senha atual incorreta.")

  if (data.newPassword.length < 6) {
    throw new Error("A nova senha deve ter no mínimo 6 caracteres")
  }

  const hash = await bcrypt.hash(data.newPassword, 10)
  await request(`/users/${encodeURIComponent(String(user.id))}`, {
    method: "PATCH",
    body: JSON.stringify({ password_hash: hash }),
  })
}