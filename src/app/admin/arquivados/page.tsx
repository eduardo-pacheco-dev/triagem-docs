"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Button,
  Tag,
  InlineNotification,
  Loading,
} from "@carbon/react"
import { Restart, ArrowLeft } from "@carbon/icons-react"
import { supabase } from "@/lib/supabase/client"
import { AppHeader } from "@/components/AppHeader"
import {
  statusLabel,
  type QueueEntry,
  type QueueStatus,
} from "@/lib/queue"
import { fetchArchivedQueue, updateStatus } from "@/lib/queue-server"
import { slaLabel } from "@/lib/duration"

const statusTagType: Record<QueueStatus, "green" | "red"> = {
  approved: "green",
  rejected: "red",
} as Partial<Record<QueueStatus, "green" | "red">> as Record<QueueStatus, "green" | "red">

function formatDate(iso: Date) {
  return new Date(iso).toLocaleString("pt-BR")
}

export default function ArchivedPage() {
  const [entries, setEntries] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let mounted = true
    fetchArchivedQueue()
      .then((rows) => mounted && setEntries(rows))
      .catch(() => setError("Erro ao carregar arquivados."))
      .finally(() => mounted && setLoading(false))

    const channel = supabase
      .channel("queue_entries_archived")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_entries" },
        () => {
          fetchArchivedQueue().then((rows) => mounted && setEntries(rows))
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("[Realtime] archived channel error")
        }
      })

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  async function handleReopen(id: string) {
    setPending((p) => ({ ...p, [id]: true }))
    try {
      await updateStatus(id, "waiting")
      const rows = await fetchArchivedQueue()
      setEntries(rows)
    } catch {
      setError("Falha ao reabrir.")
    } finally {
      setPending((p) => ({ ...p, [id]: false }))
    }
  }

  const headers = [
    { key: "protocol", header: "Protocolo" },
    { key: "site_id", header: "SITE ID" },
    { key: "technician_name", header: "Técnico" },
    { key: "request_type", header: "Tipo" },
    { key: "statusRaw", header: "Status" },
    { key: "sla", header: "SLA" },
    { key: "updated_at", header: "Concluído em" },
    { key: "actions", header: "Ações" },
  ]

  const rows = entries.map((e) => {
    const { wait, service, total } = slaLabel(e)
    return {
      id: e.id,
      protocol: e.protocol,
      site_id: e.site_id,
      technician_name: e.technician_name,
      request_type: e.request_type,
      statusRaw: e.status,
      sla: total || `${wait} / ${service}`,
      updated_at: formatDate(e.updated_at),
      _entry: e,
    }
  })

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main" style={{ maxWidth: 1200 }}>
        <div style={{ marginBottom: "1rem" }}>
          <Link href="/admin">
            <Button kind="ghost" renderIcon={ArrowLeft} size="sm">
              Voltar para a fila
            </Button>
          </Link>
        </div>

        <h1 className="admin-title">Arquivados</h1>
        <p className="admin-subtitle" style={{ marginBottom: "1.5rem" }}>
          Solicitações concluídas (aprovadas ou recusadas).
        </p>

        {error && (
          <InlineNotification
            kind="error"
            lowContrast
            title="Erro"
            subtitle={error}
            onCloseButtonClick={() => setError(null)}
          />
        )}

        {loading ? (
          <div style={{ position: "relative", minHeight: 200 }}>
            <Loading withOverlay={false} />
          </div>
        ) : (
          <DataTable rows={rows} headers={headers} isSortable>
            {({ rows: r, headers: h, getHeaderProps, getRowProps, getTableProps, onInputChange }) => (
              <TableContainer
                title="Solicitações arquivadas"
                description={`${entries.length} solicitação(ões) concluída(s)`}
              >
                <TableToolbar>
                  <TableToolbarContent>
                    <TableToolbarSearch
                      onChange={(e) => onInputChange(e as React.ChangeEvent<HTMLInputElement>)}
                      placeholder="Buscar..."
                    />
                  </TableToolbarContent>
                </TableToolbar>
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {h.map((header) => {
                        const { key: hk, ...hp } = getHeaderProps({ header })
                        return (
                          <TableHeader key={hk} {...hp}>
                            {header.header}
                          </TableHeader>
                        )
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {r.map((row) => {
                      const found = rows.find((x) => x.id === row.id)
                      if (!found) return null
                      const entry = found._entry
                      const busy = !!pending[entry.id]
                      const { key: rk, ...rp } = getRowProps({ row })
                      return (
                        <TableRow key={rk} {...rp}>
                          {row.cells.map((cell) => {
                            if (cell.info.header === "protocol") {
                              return (
                                <TableCell key={cell.id}>
                                  <span className="mono">#{cell.value}</span>
                                </TableCell>
                              )
                            }
                            if (cell.info.header === "site_id") {
                              return (
                                <TableCell key={cell.id}>
                                  <span className="mono">{cell.value}</span>
                                </TableCell>
                              )
                            }
                            if (cell.info.header === "sla") {
                              return (
                                <TableCell key={cell.id}>
                                  <span style={{ color: "#525252", fontSize: "0.875rem" }}>{cell.value}</span>
                                </TableCell>
                              )
                            }
                            if (cell.info.header === "statusRaw") {
                              return (
                                <TableCell key={cell.id}>
                                  <Tag type={statusTagType[entry.status]}>
                                    {statusLabel[entry.status]}
                                  </Tag>
                                </TableCell>
                              )
                            }
                            if (cell.info.header === "actions") {
                              return (
                                <TableCell key={cell.id}>
                                  <Button
                                    size="sm"
                                    kind="ghost"
                                    renderIcon={Restart}
                                    disabled={busy}
                                    onClick={() => handleReopen(entry.id)}
                                  >
                                    Reabrir
                                  </Button>
                                </TableCell>
                              )
                            }
                            return <TableCell key={cell.id}>{cell.value}</TableCell>
                          })}
                        </TableRow>
                      )
                    })}
                    {r.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={headers.length}
                          style={{ textAlign: "center", color: "#525252", padding: "2rem" }}
                        >
                          Nenhuma solicitação arquivada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
        )}
      </main>
    </div>
  )
}
