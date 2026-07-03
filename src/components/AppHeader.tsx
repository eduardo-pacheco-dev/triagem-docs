"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
} from "@carbon/react"
import { Logout } from "@carbon/icons-react"

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const authed = !!session

  return (
    <Header aria-label="Check-in de Documentos">
      <HeaderName as={Link} href="/" prefix="IBM">
        Document Intake
      </HeaderName>
      <HeaderNavigation aria-label="Navegação principal">
        <HeaderMenuItem as={Link} href="/" isActive={pathname === "/"}>
          Check-in
        </HeaderMenuItem>
        {authed && (
          <>
            <HeaderMenuItem as={Link} href="/admin" isActive={pathname === "/admin"}>
              Fila
            </HeaderMenuItem>
            <HeaderMenuItem
              as={Link}
              href="/admin/configuracoes"
              isActive={pathname.startsWith("/admin/configuracoes")}
            >
              Configurações
            </HeaderMenuItem>
          </>
        )}
      </HeaderNavigation>
      <HeaderGlobalBar>
        {authed && (
          <HeaderGlobalAction
            aria-label="Sair"
            onClick={() => signOut({ callbackUrl: "/login" })}
            tooltipAlignment="end"
          >
            <Logout />
          </HeaderGlobalAction>
        )}
      </HeaderGlobalBar>
    </Header>
  )
}
