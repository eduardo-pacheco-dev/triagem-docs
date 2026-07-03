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
  created_at: Date
  updated_at: Date
}

export interface RequestType {
  id: string
  name: string
  created_at: Date
}

export const statusLabel: Record<QueueStatus, string> = {
  waiting: "Aguardando Análise",
  in_review: "Em Análise",
  approved: "Aprovado",
  rejected: "Recusado",
}
