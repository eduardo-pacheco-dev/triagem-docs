"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { useEffect, useState } from "react"
import { isAuthenticated, logout } from "@/lib/session"
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
  Dashboard,
  Document,
  List,
  Settings,
} from "@carbon/icons-react"

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    setAuthed(isAuthenticated())
  }, [pathname])

  function handleLogout() {
    logout()
    setAuthed(false)
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      <Header aria-label="AFL Engenharia">
        <HeaderName as={Link} href="/" prefix="AFL">
          Triagem Docs
        </HeaderName>
        <HeaderGlobalBar>
          {authed ? (
            <HeaderGlobalAction
              aria-label="Sair"
              onClick={handleLogout}
              tooltipAlignment="end"
            >
              <Logout />
            </HeaderGlobalAction>
          ) : pathname !== "/login" && (
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
              href="/admin/dashboard"
              renderIcon={Dashboard}
              isActive={pathname.startsWith("/admin/dashboard")}
            >
              Dashboard
            </SideNavLink>
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
              href="/admin/arquivados"
              renderIcon={Document}
              isActive={pathname.startsWith("/admin/arquivados")}
            >
              Arquivados
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
