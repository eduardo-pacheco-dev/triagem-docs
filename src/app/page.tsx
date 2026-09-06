"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Form,
  Stack,
  TextInput,
  Button,
  InlineNotification,
  Tile,
  Tag,
  ComboBox,
  Checkbox,
  Modal,
} from "@carbon/react"
import { ArrowRight, Restart, Search } from "@carbon/icons-react"
import {
  statusLabel,
  type QueueEntry,
  type RequestType,
} from "@/lib/queue"
import { createCheckIn, fetchRequestTypes } from "@/lib/api"

export default function CheckInPage() {
  const router = useRouter()

  const [siteId, setSiteId] = useState("")
  const [technicianName, setTechnicianName] = useState("")
  const [requestType, setRequestType] = useState<RequestType | null>(null)
  const [types, setTypes] = useState<RequestType[]>([])
  const [loading, setLoading] = useState(false)
  const [entry, setEntry] = useState<QueueEntry | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [checkedIn, setCheckedIn] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [searchSiteId, setSearchSiteId] = useState("")

  useEffect(() => {
    let mounted = true
    function load() {
      fetchRequestTypes()
        .then((rows) => mounted && setTypes(rows))
        .catch(() => {})
    }
    load()
    const timer = setInterval(load, 4000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!siteId.trim() || !technicianName.trim() || !requestType) {
      setError("Preencha o SITE ID, o nome do técnico e escolha um tipo de solicitação.")
      return
    }
    if (!checkedIn) {
      setShowModal(true)
      return
    }
    setLoading(true)
    try {
      const created = await createCheckIn({
        site_id: siteId,
        technician_name: technicianName,
        request_type: requestType.name,
      })
      setEntry(created)
    } catch (err) {
      setError("Erro ao entrar na fila.")
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setEntry(null)
    setSiteId("")
    setTechnicianName("")
    setRequestType(null)
    setCheckedIn(false)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchSiteId.trim()) return
    router.push(`/status/${searchSiteId.trim()}`)
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <section className="hero">
          <span className="hero-eyebrow">AFL Engenharia</span>
          <h1 className="hero-title">Triagem Docs</h1>
          <p className="hero-subtitle">
            Realize o check-in e entre na fila de análise de documentos.
            Acompanhe sua posição a qualquer momento pelo SITE ID.
          </p>
        </section>

        <div className="card-list">
          <Tile className="checkin-card">
            <h1 className="checkin-title">Solicitar Avaliação</h1>
            <p className="checkin-subtitle">
              Preencha os dados abaixo para entrar na fila de análise. Um número de
              protocolo será gerado.
            </p>

            {!entry ? (
              <Form onSubmit={handleSubmit}>
                <Stack gap={6}>
                  {error && (
                    <InlineNotification
                      kind="error"
                      lowContrast
                      title="Não foi possível prosseguir"
                      subtitle={error}
                      hideCloseButton
                    />
                  )}
                  <TextInput
                    id="site_id"
                    labelText="SITE ID"
                    placeholder="Ex.: SITE-0421"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    required
                  />
                  <TextInput
                    id="technician_name"
                    labelText="Nome do Técnico"
                    placeholder="Ex.: Maria Silva"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    required
                  />
                  <ComboBox
                    id="request_type"
                    titleText="Tipo de Solicitação"
                    placeholder="Selecione um tipo"
                    items={types}
                    itemToString={(item: RequestType | null) => (item ? item.name : "")}
                    selectedItem={requestType}
                    onChange={({ selectedItem }) =>
                      setRequestType(selectedItem ?? null)
                    }
                  />
                  <Checkbox
                    id="checkin_confirm"
                    labelText="Realizado Check-in e QCP3"
                    checked={checkedIn}
                    onChange={(e, { checked }) => setCheckedIn(checked)}
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    renderIcon={ArrowRight}
                    size="lg"
                  >
                    {loading ? "Registrando..." : "Solicitar Avaliação"}
                  </Button>
                </Stack>
              </Form>
            ) : (
              <Stack gap={6}>
                <InlineNotification
                  kind="success"
                  lowContrast
                  title="Solicitação registrada com sucesso!"
                  subtitle="Guarde seu número de protocolo e SITE ID para acompanhamento."
                  hideCloseButton
                />
                <div>
                  <div className="field-label">Protocolo</div>
                  <div className="protocol-code">#{entry.protocol}</div>
                </div>
                <div>
                  <div className="field-label">SITE ID</div>
                  <div className="mono" style={{ fontSize: "1rem" }}>
                    {entry.site_id}
                  </div>
                </div>
                <div>
                  <div className="field-label">Status atual</div>
                  <Tag type="blue" size="md">
                    {statusLabel[entry.status]}
                  </Tag>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Button
                    renderIcon={Search}
                    onClick={() => router.push(`/status/${entry.site_id}`)}
                  >
                    Ver acompanhamento
                  </Button>
                  <Button kind="tertiary" renderIcon={Restart} onClick={reset}>
                    Nova solicitação
                  </Button>
                </div>
              </Stack>
            )}
          </Tile>

          <Tile className="checkin-card">
            <h2 className="checkin-title">
              Acompanhar Status
            </h2>
            <p className="checkin-subtitle">
              Já solicitou uma avaliação? Consulte o andamento pelo SITE ID.
            </p>
            <Form onSubmit={handleSearch}>
              <Stack gap={6}>
                <TextInput
                  id="search_site_id"
                  labelText="SITE ID"
                  placeholder="Ex.: SITE-0421"
                  value={searchSiteId}
                  onChange={(e) => setSearchSiteId(e.target.value)}
                  required
                />
                <Button type="submit" kind="secondary" renderIcon={Search} size="lg">
                  Buscar Status
                </Button>
              </Stack>
            </Form>
          </Tile>
        </div>
      </main>

      <Modal
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        modalHeading="Check-in obrigatório"
        primaryButtonText="Entendi"
        onRequestSubmit={() => setShowModal(false)}
      >
        <p style={{ marginBottom: "1rem" }}>
          É necessário realizar o <strong>Check-in</strong> e o <strong>QCP3</strong> antes de solicitar a avaliação.
        </p>
        <p style={{ color: "#525252", fontSize: "0.875rem" }}>
          Certifique-se de que ambos os procedimentos foram concluídos e marque a opção no formulário.
        </p>
      </Modal>
    </div>
  );
}
