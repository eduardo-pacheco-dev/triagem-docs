"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { useSession, signOut } from "next-auth/react"
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SideNav,
  SideNavItems,
  SideNavLink,
} from "@carbon/react"
import {
  Logout,
  Login,
  Document,
  List,
  Settings,
} from "@carbon/icons-react"

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const authed = !!session

  return (
    <>
      <Header aria-label="IBM Document Intake">
        <HeaderName as={Link} href="/" prefix="IBM">
          Document Intake
        </HeaderName>
        <HeaderGlobalBar>
          {authed ? (
            <HeaderGlobalAction
              aria-label="Sair"
              onClick={() => signOut({ callbackUrl: "/login" })}
              tooltipAlignment="end"
            >
              <Logout />
            </HeaderGlobalAction>
          ) : (
            <HeaderGlobalAction
              aria-label="Entrar"
              tooltipAlignment="end"
              onClick={() => router.push("/login")}
            >
              <Login />
            </HeaderGlobalAction>
          )}
        </HeaderGlobalBar>
      </Header>
      {authed && (
        <SideNav
          isFixedNav
          aria-label="Navegação principal"
          expanded
        >
          <SideNavItems>
            <SideNavLink
              as={Link}
              href="/"
              renderIcon={Document}
              isActive={pathname === "/"}
            >
              Check-in
            </SideNavLink>
            <SideNavLink
              as={Link}
              href="/admin"
              renderIcon={List}
              isActive={pathname === "/admin"}
            >
              Fila
            </SideNavLink>
            <SideNavLink
              as={Link}
              href="/admin/configuracoes"
              renderIcon={Settings}
              isActive={pathname.startsWith("/admin/configuracoes")}
            >
              Configurações
            </SideNavLink>
          </SideNavItems>
        </SideNav>
      )}
    </>
  )
}
