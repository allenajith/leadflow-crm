import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { fullDate, timeAgo } from "@/lib/format"
import { STAGE_COLOR, STAGE_LABEL } from "@/lib/types"
import type { Lead, LeadInput } from "@/lib/types"
import { SideBox } from "@/components/layout/Chrome"
import { LeadFormDialog } from "@/components/leads/LeadFormDialog"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const editing = params.get("edit") === "1"

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.getLead(Number(id))
      setLead(res.lead)
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not load lead")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  function setEditing(open: boolean) {
    const next = new URLSearchParams(params)
    if (open) next.set("edit", "1")
    else next.delete("edit")
    setParams(next, { replace: true })
  }

  async function handleSave(input: LeadInput) {
    if (!lead) return
    const res = await api.updateLead(lead.id, input)
    setLead(res.lead)
    toast.success("lead updated")
  }

  async function handleDelete() {
    if (!lead) return
    setConfirmingDelete(false)
    try {
      await api.deleteLead(lead.id)
      toast.success(`removed ${lead.name}`)
      navigate("/leads", { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "could not delete lead")
    }
  }

  if (loading) return <p className="p-2 text-[11px] text-meta">loading...</p>

  if (error || !lead) {
    return (
      <div className="border border-destructive bg-[#fff0f0] p-2 text-[11px] text-destructive">
        {error ?? "lead not found"}
        <Link to="/leads" className="ml-2 underline">
          back to pipeline
        </Link>
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      <div className="min-w-0 flex-1">
        <p className="mb-2 text-[10px] text-meta">
          <Link to="/leads">pipeline</Link> &rsaquo; {lead.name}
        </p>

        <div className="flex items-baseline gap-2">
          <h1 className="text-[17px] font-bold">{lead.name}</h1>
          <span
            className="px-[5px] py-[1px] text-[10px] font-bold text-white"
            style={{ background: STAGE_COLOR[lead.status] }}
          >
            {STAGE_LABEL[lead.status]}
          </span>
        </div>

        <p className="rdt-tagline mt-[2px]">
          added {timeAgo(lead.createdAt)} &middot; last touched{" "}
          {timeAgo(lead.updatedAt)}
        </p>

        <table className="mt-3 w-full max-w-[420px] text-[12px]">
          <tbody>
            <Row label="company" value={lead.company} />
            <Row
              label="email"
              value={<a href={`mailto:${lead.email}`}>{lead.email}</a>}
            />
            <Row
              label="phone"
              value={
                lead.phone ? (
                  <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                ) : (
                  <span className="text-meta">none</span>
                )
              }
            />
            <Row label="created" value={fullDate(lead.createdAt)} />
            <Row label="updated" value={fullDate(lead.updatedAt)} />
          </tbody>
        </table>
      </div>

      <aside className="w-[300px] shrink-0">
        <SideBox title="actions">
          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setEditing(true)}
            >
              edit lead
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="w-full"
              onClick={() => setConfirmingDelete(true)}
            >
              delete lead
            </Button>
          </div>
        </SideBox>
      </aside>

      <LeadFormDialog
        open={editing}
        onOpenChange={setEditing}
        lead={lead}
        onSubmit={handleSave}
      />

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent className="border border-header-edge bg-page">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[13px]">
              delete {lead.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[11px]">
              This removes the lead permanently. There is no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-[11px]">cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-destructive text-[11px] text-white hover:bg-destructive/90"
            >
              delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr className="border-b border-rule">
      <td className="w-[90px] py-[4px] align-top text-[10px] font-bold uppercase text-meta">
        {label}
      </td>
      <td className="py-[4px]">{value}</td>
    </tr>
  )
}
