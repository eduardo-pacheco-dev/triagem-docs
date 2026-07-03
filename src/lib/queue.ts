import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

export type QueueStatus = "waiting" | "in_review" | "approved" | "rejected"

export interface QueueEntry {
  id: string
  protocol: string
  full_name: string
  identifier: string
  site_id: string
  technician_name: string
  request_type: string
  status: QueueStatus
  position_seq: number
  created_at: string
  updated_at: string
}

export interface RequestType {
  id: string
  name: string
  created_at: string
}

export const statusLabel: Record<QueueStatus, string> = {
  waiting: "Aguardando Análise",
  in_review: "Em Análise",
  approved: "Aprovado",
  rejected: "Recusado",
}

export async function fetchActiveQueue(): Promise<QueueEntry[]> {
  const { data, error } = await supabase
    .from("queue_entries")
    .select("*")
    .order("position_seq", { ascending: true })

  if (error) throw error
  return (data ?? []) as QueueEntry[]
}

export async function fetchBySiteId(siteId: string): Promise<QueueEntry[]> {
  const { data, error } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("site_id", siteId.trim())
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as QueueEntry[]
}

export async function fetchRequestTypes(): Promise<RequestType[]> {
  const { data, error } = await supabase
    .from("request_types")
    .select("*")
    .order("name", { ascending: true })

  if (error) throw error
  return (data ?? []) as RequestType[]
}
