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

export async function fetchRequestTypes(): Promise<RequestType[]> {
  const raws = await request<RawRequestType[]>(`/request_types?_sort=name&_order=asc`)
  return raws.map(toRequestType)
}