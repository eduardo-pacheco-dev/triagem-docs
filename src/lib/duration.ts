export function formatDuration(start: Date, end?: Date): string {
  const diffMs = (end ?? new Date()).getTime() - start.getTime()
  const totalMinutes = Math.floor(diffMs / 60_000)

  if (totalMinutes < 1) return "Menos de 1 min"
  if (totalMinutes < 60) return `${totalMinutes} min`

  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (hours < 24) return `${hours}h ${mins}min`

  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  return `${days}d ${remHours}h`
}

export function slaLabel(entry: {
  status: string
  created_at: Date
  updated_at: Date
  started_at?: Date
  completed_at?: Date
}): { wait: string; service?: string; total?: string } {
  const now = new Date()

  if (entry.status === "waiting") {
    return { wait: formatDuration(entry.created_at, now) }
  }

  const wait = formatDuration(entry.created_at, entry.started_at ?? entry.updated_at)

  if (entry.status === "in_review") {
    const start = entry.started_at ?? entry.created_at
    return { wait, service: formatDuration(start, now) }
  }

  if (entry.status === "approved" || entry.status === "rejected") {
    const start = entry.started_at ?? entry.created_at
    const service = formatDuration(start, entry.completed_at ?? entry.updated_at)
    const total = formatDuration(entry.created_at, entry.completed_at ?? entry.updated_at)
    return { wait, service, total }
  }

  return { wait }
}
