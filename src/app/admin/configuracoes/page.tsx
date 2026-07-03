"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Tile,
  Form,
  Stack,
  TextInput,
  PasswordInput,
  Button,
  InlineNotification,
  Loading,
  Tag,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@carbon/react"
import { Add, TrashCan, ArrowLeft, Settings, UserAvatar } from "@carbon/icons-react"
import { supabase } from "@/lib/supabase/client"
import { AppHeader } from "@/components/AppHeader"
import {
  type RequestType,
} from "@/lib/queue"
import { fetchRequestTypes, addRequestType, deleteRequestType, changePassword } from "@/lib/queue-server"

function GeralTab() {
  const [types, setTypes] = useState<RequestType[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetchRequestTypes()
      .then((rows) => mounted && setTypes(rows))
      .catch(() => setError("Erro ao carregar tipos."))
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
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("[Realtime] request_types channel error")
        }
      })

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
      const rows = await fetchRequestTypes()
      setTypes(rows)
    } catch {
      setError("Erro ao adicionar tipo.")
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: string) {
    setError(null)
    try {
      await deleteRequestType(id)
      const rows = await fetchRequestTypes()
      setTypes(rows)
    } catch {
      setError("Erro ao remover tipo.")
    }
  }

  return (
    <div>
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
    </div>
  )
}

function PerfilTab() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError("As senhas não conferem.")
      return
    }

    setBusy(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar senha.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {error && (
        <InlineNotification
          kind="error"
          lowContrast
          title="Erro"
          subtitle={error}
          onCloseButtonClick={() => setError(null)}
        />
      )}
      {success && (
        <InlineNotification
          kind="success"
          lowContrast
          title="Senha alterada com sucesso!"
          hideCloseButton
        />
      )}

      <Tile className="checkin-card" style={{ maxWidth: "100%", marginTop: 0 }}>
        <h2 style={{ fontSize: "1.125rem", margin: "0 0 1rem", fontWeight: 500 }}>
          Alterar senha
        </h2>
        <Form onSubmit={handleSubmit}>
          <Stack gap={6}>
            <PasswordInput
              id="current_password"
              labelText="Senha atual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <PasswordInput
              id="new_password"
              labelText="Nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <PasswordInput
              id="confirm_password"
              labelText="Confirmar nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <Button type="submit" disabled={busy}>
              {busy ? "Salvando..." : "Salvar senha"}
            </Button>
          </Stack>
        </Form>
      </Tile>
    </div>
  )
}

export default function ConfigPage() {
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

        <Tabs>
          <TabList aria-label="Configurações">
            <Tab renderIcon={Settings}>Geral</Tab>
            <Tab renderIcon={UserAvatar}>Perfil</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <GeralTab />
            </TabPanel>
            <TabPanel>
              <PerfilTab />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </main>
    </div>
  )
}
