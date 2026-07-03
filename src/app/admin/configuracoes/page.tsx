"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Tile,
  Form,
  Stack,
  TextInput,
  Button,
  InlineNotification,
  Loading,
  Tag,
} from "@carbon/react"
import { Add, TrashCan, ArrowLeft } from "@carbon/icons-react"
import { supabase } from "@/lib/supabase/client"
import { AppHeader } from "@/components/AppHeader"
import {
  fetchRequestTypes,
  type RequestType,
} from "@/lib/queue"
import { addRequestType, deleteRequestType } from "@/lib/queue-actions"

export default function ConfigPage() {
  const [types, setTypes] = useState<RequestType[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetchRequestTypes()
      .then((rows) => mounted && setTypes(rows))
      .catch((err) => setError(err.message))
      .finally(() => mounted && setLoading(false))

    const channel = supabase
      .channel("request_types_admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "request_types" },
        () => {
          fetchRequestTypes().then((rows) => mounted && setTypes(rows))
        },
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) return
    setBusy(true)
    try {
      await addRequestType(name)
      setName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar tipo.")
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: string) {
    setError(null)
    try {
      await deleteRequestType(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover tipo.")
    }
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main" style={{ maxWidth: 800 }}>
        <div style={{ marginBottom: "1rem" }}>
          <Link href="/admin">
            <Button kind="ghost" renderIcon={ArrowLeft} size="sm">
              Voltar para a fila
            </Button>
          </Link>
        </div>

        <h1 className="admin-title">Configurações</h1>
        <p className="admin-subtitle" style={{ marginBottom: "2rem" }}>
          Gerencie os tipos de solicitação disponíveis no formulário público.
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

        <Tile className="checkin-card" style={{ maxWidth: "100%", marginTop: 0 }}>
          <h2 style={{ fontSize: "1.125rem", margin: "0 0 1rem", fontWeight: 500 }}>
            Novo tipo de solicitação
          </h2>
          <Form onSubmit={handleAdd}>
            <Stack gap={5} orientation="horizontal">
              <TextInput
                id="new_type"
                labelText="Nome do tipo"
                placeholder="Ex.: Vistoria Técnica"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div style={{ alignSelf: "end" }}>
                <Button type="submit" renderIcon={Add} disabled={busy}>
                  Adicionar
                </Button>
              </div>
            </Stack>
          </Form>
        </Tile>

        <Tile className="checkin-card" style={{ maxWidth: "100%", marginTop: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", margin: "0 0 1rem", fontWeight: 500 }}>
            Tipos cadastrados
          </h2>
          {loading ? (
            <div style={{ position: "relative", minHeight: 100 }}>
              <Loading withOverlay={false} />
            </div>
          ) : types.length === 0 ? (
            <p style={{ color: "#525252" }}>Nenhum tipo cadastrado.</p>
          ) : (
            <Stack gap={3}>
              {types.map((t) => (
                <div key={t.id} className="type-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Tag type="blue">{t.name}</Tag>
                    <span style={{ color: "#525252", fontSize: "0.75rem" }}>
                      Adicionado em {new Date(t.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <Button
                    kind="danger--ghost"
                    size="sm"
                    renderIcon={TrashCan}
                    onClick={() => handleDelete(t.id)}
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </Stack>
          )}
        </Tile>
      </main>
    </div>
  )
}
