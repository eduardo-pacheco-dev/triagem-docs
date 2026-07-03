"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Tile,
  Grid,
  Column,
  Loading,
  Tag,
  Button,
  InlineNotification,
} from "@carbon/react"
import { ArrowLeft } from "@carbon/icons-react"
import { AppHeader } from "@/components/AppHeader"
import { fetchDashboard } from "@/lib/queue-server"
import { slaLabel, formatDuration } from "@/lib/duration"

interface DashboardData {
  total: number
  waiting: number
  inReview: number
  approved: number
  rejected: number
  avgWaitMin: number
  avgServiceMin: number
  recent: Array<{
    id: string
    protocol: string
    site_id: string
    technician_name: string
    request_type: string
    status: string
    created_at: Date
    updated_at: Date
    started_at?: Date
    completed_at?: Date
  }>
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <Tile style={{ textAlign: "center", padding: "1.5rem" }}>
      <div style={{ fontSize: "2rem", fontWeight: 300, color: color ?? "var(--ibm-blue)" }}>
        {value}
      </div>
      <div style={{ fontSize: "0.875rem", color: "#525252", marginTop: "0.25rem" }}>{label}</div>
    </Tile>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => setError("Erro ao carregar dashboard."))
      .finally(() => setLoading(false))
  }, [])

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

        <h1 className="admin-title">Dashboard</h1>
        <p className="admin-subtitle" style={{ marginBottom: "1.5rem" }}>
          Visão geral das solicitações.
        </p>

        {error && (
          <InlineNotification kind="error" lowContrast title="Erro" subtitle={error} />
        )}

        {loading ? (
          <div style={{ position: "relative", minHeight: 200 }}>
            <Loading withOverlay={false} />
          </div>
        ) : data ? (
          <>
            <Grid narrow style={{ marginBottom: "1.5rem" }}>
              <Column sm={2} md={2} lg={2}>
                <StatCard label="Total" value={data.total} color="#161616" />
              </Column>
              <Column sm={2} md={2} lg={2}>
                <StatCard label="Aguardando" value={data.waiting} color="#6f6f6f" />
              </Column>
              <Column sm={2} md={2} lg={2}>
                <StatCard label="Em análise" value={data.inReview} color="var(--ibm-blue)" />
              </Column>
              <Column sm={2} md={2} lg={2}>
                <StatCard label="Aprovados" value={data.approved} color="#24a148" />
              </Column>
              <Column sm={2} md={2} lg={2}>
                <StatCard label="Recusados" value={data.rejected} color="#da1e28" />
              </Column>
              <Column sm={2} md={2} lg={2}>
                <StatCard label="Espera média" value={data.avgWaitMin > 0 ? `${data.avgWaitMin} min` : "-"} />
              </Column>
              <Column sm={2} md={2} lg={2}>
                <StatCard
                  label="Atendimento médio"
                  value={data.avgServiceMin > 0 ? `${data.avgServiceMin} min` : "-"}
                />
              </Column>
            </Grid>

            <Tile style={{ padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", margin: "0 0 1rem", fontWeight: 500 }}>
                Últimas solicitações
              </h2>
              {data.recent.length === 0 ? (
                <p style={{ color: "#525252" }}>Nenhuma solicitação recente.</p>
              ) : (
                <div>
                  {data.recent.map((entry, i) => {
                    const { wait, service } = slaLabel(entry)
                    return (
                      <div
                        key={entry.id}
                        style={{
                          display: "flex",
                          gap: "1rem",
                          alignItems: "center",
                          padding: "0.5rem 0",
                          borderBottom: i < data.recent.length - 1 ? "1px solid #e0e0e0" : "none",
                          flexWrap: "wrap",
                        }}
                      >
                        <span className="mono" style={{ minWidth: 100 }}>
                          #{entry.protocol}
                        </span>
                        <span className="mono" style={{ minWidth: 120 }}>
                          {entry.site_id}
                        </span>
                        <span style={{ minWidth: 100 }}>{entry.technician_name}</span>
                        <Tag type={entry.status === "approved" ? "green" : entry.status === "rejected" ? "red" : entry.status === "in_review" ? "blue" : "gray"} size="sm">
                          {entry.status === "waiting" ? "Aguardando" : entry.status === "in_review" ? "Em análise" : entry.status === "approved" ? "Aprovado" : "Recusado"}
                        </Tag>
                        <span style={{ color: "#525252", fontSize: "0.875rem", marginLeft: "auto" }}>
                          {wait}{service ? ` / ${service}` : ""}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </Tile>
          </>
        ) : null}
      </main>
    </div>
  )
}
