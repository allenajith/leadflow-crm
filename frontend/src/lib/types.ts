// Mirrors server/prisma/schema.prisma

export const LEAD_STAGES = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED"] as const

export type LeadStatus = (typeof LEAD_STAGES)[number]

export type Lead = {
  id: number
  name: string
  company: string
  email: string
  phone: string | null
  status: LeadStatus
  createdAt: string
  updatedAt: string
  userId: number
}

export type User = {
  id: number
  name: string
  email: string
}

/** Fields the create/update endpoints accept. */
export type LeadInput = {
  name: string
  company: string
  email: string
  phone: string
  status: LeadStatus
}

export const STAGE_LABEL: Record<LeadStatus, string> = {
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  CLOSED: "closed",
}

export const STAGE_COLOR: Record<LeadStatus, string> = {
  NEW: "var(--color-stage-new)",
  CONTACTED: "var(--color-stage-contacted)",
  QUALIFIED: "var(--color-stage-qualified)",
  CLOSED: "var(--color-stage-closed)",
}

/** One step along the pipeline, or null at either end. */
export function nextStage(status: LeadStatus): LeadStatus | null {
  const i = LEAD_STAGES.indexOf(status)
  return i < LEAD_STAGES.length - 1 ? LEAD_STAGES[i + 1] : null
}

export function prevStage(status: LeadStatus): LeadStatus | null {
  const i = LEAD_STAGES.indexOf(status)
  return i > 0 ? LEAD_STAGES[i - 1] : null
}
