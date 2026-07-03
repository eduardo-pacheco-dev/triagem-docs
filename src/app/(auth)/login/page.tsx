"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import {
  Form,
  Stack,
  TextInput,
  Button,
  InlineNotification,
  Tile,
} from "@carbon/react"
import { PasswordInput } from "@carbon/react"
import { Login as LoginIcon } from "@carbon/icons-react"
import { AppHeader } from "@/components/AppHeader"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.ok) {
      router.push("/admin")
      router.refresh()
    } else {
      setError("Usuário ou senha inválidos.")
    }
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">
        <Tile className="checkin-card" style={{ maxWidth: 440 }}>
          <h1 className="checkin-title" style={{ fontSize: "1.75rem" }}>
            Acessar Painel
          </h1>
          <p className="checkin-subtitle">
            Área restrita. Utilize suas credenciais para continuar.
          </p>
          <Form onSubmit={handleSubmit}>
            <Stack gap={6}>
              {error && (
                <InlineNotification
                  kind="error"
                  lowContrast
                  title="Falha no login"
                  subtitle={error}
                  hideCloseButton
                />
              )}
              <TextInput
                id="username"
                labelText="Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
              <PasswordInput
                id="password"
                labelText="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <Button type="submit" renderIcon={LoginIcon} size="lg" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </Stack>
          </Form>
        </Tile>
      </main>
    </div>
  )
}
