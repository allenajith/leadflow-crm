import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LEAD_STAGES, STAGE_LABEL } from "@/lib/types"
import type { Lead, LeadInput } from "@/lib/types"

const EMPTY: LeadInput = {
  name: "",
  company: "",
  email: "",
  phone: "",
  status: "NEW",
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present when editing, absent when creating. */
  lead?: Lead | null
  onSubmit: (input: LeadInput) => Promise<void>
}

export function LeadFormDialog({ open, onOpenChange, lead, onSubmit }: Props) {
  const [form, setForm] = useState<LeadInput>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Refill whenever the dialog opens, so a cancelled edit doesn't linger.
  useEffect(() => {
    if (!open) return
    setError(null)
    setForm(
      lead
        ? {
            name: lead.name,
            company: lead.company,
            email: lead.email,
            phone: lead.phone ?? "",
            status: lead.status,
          }
        : EMPTY
    )
  }, [open, lead])

  const set = <K extends keyof LeadInput>(key: K, value: LeadInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() || !form.company.trim() || !form.email.trim()) {
      setError("name, company and email are required")
      return
    }

    setSaving(true)
    try {
      await onSubmit({ ...form, phone: form.phone.trim() })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[460px] border border-header-edge bg-page">
        <DialogHeader>
          <DialogTitle className="text-[13px] font-bold">
            {lead ? "edit lead" : "submit a new lead"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2">
          <Field label="name">
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              autoFocus
            />
          </Field>

          <Field label="company">
            <input
              className={inputCls}
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
            />
          </Field>

          <Field label="email">
            <input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>

          <Field label="phone">
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="optional"
            />
          </Field>

          <Field label="stage">
            <select
              className={inputCls}
              value={form.status}
              onChange={(e) => set("status", e.target.value as LeadInput["status"])}
            >
              {LEAD_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>

          {error && (
            <p className="border border-destructive bg-[#fff0f0] px-2 py-1 text-[11px] text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "saving..." : lead ? "save" : "submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const inputCls =
  "w-full border border-input bg-white px-[5px] py-[3px] text-[12px] outline-none focus:border-header-edge"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-[2px] block text-[10px] font-bold text-meta uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}
