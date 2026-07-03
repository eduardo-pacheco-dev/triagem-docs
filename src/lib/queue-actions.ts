"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { QueueEntry, QueueStatus, RequestType } from "./queue"

export async function createCheckIn(input: {
  site_id: string
  technician_name: string
  request_type: string
}) {
  const supabase = await createServerClient()

  const n = Math.floor(1000 + Math.random() * 9000)
  const protocol = `DOC-${n}`

  const { data, error } = await supabase
    .from("queue_entries")
    .insert({
      protocol,
      site_id: input.site_id.trim(),
      technician_name: input.technician_name.trim(),
      request_type: input.request_type.trim(),
      full_name: input.technician_name.trim(),
      identifier: input.site_id.trim(),
      status: "waiting",
    })
    .select("*")
    .single()

  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      throw new Error("Protocolo duplicado. Tente novamente.")
    }
    throw error
  }

  revalidatePath("/")
  revalidatePath("/admin")
  return data as QueueEntry
}

export async function updateStatus(id: string, status: QueueStatus) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from("queue_entries")
    .update({ status })
    .eq("id", id)

  if (error) throw error
  revalidatePath("/admin")
}

export async function addRequestType(name: string): Promise<RequestType> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("request_types")
    .insert({ name: name.trim() })
    .select("*")
    .single()

  if (error) throw error
  revalidatePath("/admin/configuracoes")
  return data as RequestType
}

export async function deleteRequestType(id: string) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from("request_types")
    .delete()
    .eq("id", id)

  if (error) throw error
  revalidatePath("/admin/configuracoes")
}
