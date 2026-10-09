import type { Lead, LeadInput, User } from "./types"

/**
 * Relative — vite.config.ts proxies /api to the Express server on :5000,
 * so there is no base URL to configure and no CORS in development.
 */
const BASE = "/api"

const TOKEN_KEY = "leadflow.token"
const USER_KEY = "leadflow.user"

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function storeSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

type ApiShape = { success: boolean; message?: string }

async function request<T extends ApiShape>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = getToken()

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  // The server always replies with JSON, but a proxy error or a crash
  // can still produce HTML — don't let that surface as a parse error.
  let body: T
  try {
    body = (await res.json()) as T
  } catch {
    throw new ApiError(res.status, `Server returned a non-JSON response (${res.status})`)
  }

  if (!res.ok || !body.success) {
    throw new ApiError(res.status, body.message ?? `Request failed (${res.status})`)
  }

  return body
}

export const api = {
  register(input: { name: string; email: string; password: string }) {
    return request<{ success: boolean; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  login(input: { email: string; password: string }) {
    return request<{ success: boolean; token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  listLeads() {
    return request<{ success: boolean; leads: Lead[] }>("/leads")
  },

  getLead(id: number) {
    return request<{ success: boolean; lead: Lead }>(`/leads/${id}`)
  },

  createLead(input: LeadInput) {
    return request<{ success: boolean; lead: Lead }>("/leads", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  updateLead(id: number, input: Partial<LeadInput>) {
    return request<{ success: boolean; lead: Lead }>(`/leads/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    })
  },

  deleteLead(id: number) {
    return request<ApiShape>(`/leads/${id}`, { method: "DELETE" })
  },
}
