"use client"

import bcrypt from "bcryptjs"
import { API_URL } from "@/lib/api"
import { SESSION_COOKIE, SESSION_USER_COOKIE } from "@/lib/session-constants"

interface RawUser {
  id: string
  username: string
  password_hash: string
  created_at: string
}

export async function login(username: string, password: string): Promise<boolean> {
  if (typeof document === "undefined") return false

  const res = await fetch(`${API_URL}/users?username=${encodeURIComponent(username.trim())}`)
  if (!res.ok) return false

  const users = (await res.json()) as RawUser[]
  const user = users[0]
  if (!user) return false

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return false

  const maxAge = 60 * 60 * 24 * 7
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${maxAge}; samesite=lax`
  document.cookie = `${SESSION_USER_COOKIE}=${encodeURIComponent(user.username)}; path=/; max-age=${maxAge}; samesite=lax`
  return true
}

export function logout(): void {
  if (typeof document === "undefined") return
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`
  document.cookie = `${SESSION_USER_COOKIE}=; path=/; max-age=0`
}

export function isAuthenticated(): boolean {
  if (typeof document === "undefined") return false
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${SESSION_COOKIE}=1`))
}

export function getCurrentUsername(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_USER_COOKIE}=`))
  if (!match) return null
  return decodeURIComponent(match.slice(SESSION_USER_COOKIE.length + 1))
}