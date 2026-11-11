import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { LEAD_STAGES, STAGE_COLOR, STAGE_LABEL } from "@/lib/types"
import type { Lead, LeadInput, LeadStatus } from "@/lib/types"
import { SideBox } from "@/components/layout/Chrome"
import { LeadRow } from "@/components/leads/LeadRow"
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

export function Leads() {
  const [params, setParams] = useSearchParams()
  const view = params.get("view")
  const search = params.get("q") ?? ""
  const stage = params.get("stage") ?? "all"

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const [creating, setCreating] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Lead | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await api.listLeads()
      setLeads(res.leads)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "could not load leads")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(
    () =>
      leads.filter((lead) => {
        const inView =
          view === "closed"
            ? lead.status === "CLOSED"
            : lead.status !== "CLOSED"
        const inStage = stage === "all" || lead.status === stage
        const needle = search.trim().toLowerCase()
        const matchesSearch =
          !needle ||
          [lead.name, lead.company, lead.email, lead.phone ?? ""].some((value) =>
            value.toLowerCase().includes(needle)
          )
        return inView && inStage && matchesSearch
      }),
    [leads, search, stage, view]
  )

  const counts = useMemo(() => {
    const base = Object.fromEntries(LEAD_STAGES.map((s) => [s, 0])) as Record<
      LeadStatus,
      number
    >
    for (const l of leads) base[l.status] += 1
    return base
  }, [leads])

  async function handleStage(id: number, status: LeadStatus) {
    const before = leads
    // Optimistic — the arrows should feel instant, like reddit's did.
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, status } : l)))
    setBusyId(id)
    try {
      await api.updateLead(id, { status })
    } catch (err) {
      setLeads(before)
      toast.error(err instanceof Error ? err.message : "could not update stage")
    } finally {
      setBusyId(null)
    }
  }

  async function handleCreate(input: LeadInput) {
    const res = await api.createLead(input)
    setLeads((cur) => [res.lead, ...cur])
    toast.success("lead submitted")
  }

  async function confirmDelete() {
    const lead = pendingDelete
    if (!lead) return
    setPendingDelete(null)
    setBusyId(lead.id)
    try {
      await api.deleteLead(lead.id)
      setLeads((cur) => cur.filter((l) => l.id !== lead.id))
      toast.success(`removed ${lead.name}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "could not delete lead")
    } finally {
      setBusyId(null)
    }
  }

  function updateListParams(next: { q?: string; stage?: string }) {
    const nextParams = new URLSearchParams(params)
    if (next.q?.trim()) nextParams.set("q", next.q.trim())
    else nextParams.delete("q")
    if (next.stage && next.stage !== "all") nextParams.set("stage", next.stage)
    else nextParams.delete("stage")
    setParams(nextParams, { replace: true })
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-col gap-2 border-b border-rule pb-2 sm:flex-row">
          <label className="min-w-0 flex-1">
            <span className="sr-only">search leads</span>
            <input
              value={search}
              onChange={(e) => {
                updateListParams({ q: e.target.value, stage })
              }}
              placeholder="search name, company or email"
              className="w-full border border-input bg-white px-[5px] py-[3px] text-[12px] outline-none focus:border-header-edge"
            />
          </label>
          <label className="shrink-0">
            <span className="sr-only">filter by stage</span>
            <select
              value={stage}
              onChange={(e) => updateListParams({ q: search, stage: e.target.value })}
              className="w-full border border-input bg-white px-[5px] py-[3px] text-[12px] outline-none focus:border-header-edge sm:w-[130px]"
            >
              <option value="all">all stages</option>
              {LEAD_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {loading && <p className="p-2 text-[11px] text-meta">loading...</p>}

        {loadError && (
          <div className="border border-destructive bg-[#fff0f0] p-2 text-[11px] text-destructive">
            {loadError}
            <button onClick={() => void load()} className="ml-2 underline">
              retry
            </button>
          </div>
        )}

        {!loading && !loadError && visible.length === 0 && (
          <p className="p-2 text-[11px] text-meta">
            {search || stage !== "all"
              ? "nothing matched your search."
              : view === "closed"
                ? "nothing closed yet."
              : "no leads in the pipeline. submit one on the right."}
          </p>
        )}

        <div className="divide-y divide-[#f0f0f0]">
          {visible.map((lead, i) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              rank={i + 1}
              alt={i % 2 === 1}
              busy={busyId === lead.id}
              onStage={handleStage}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      </div>

      <aside className="w-full shrink-0 md:w-[300px]">
        <SideBox title="submit a lead">
          <Button size="sm" className="w-full" onClick={() => setCreating(true)}>
            new lead
          </Button>
        </SideBox>

        <SideBox title="pipeline">
          <table className="w-full text-[11px]">
            <tbody>
              {LEAD_STAGES.map((s) => (
                <tr key={s}>
                  <td className="py-[2px]">
                    <span
                      className="inline-block h-[8px] w-[8px] align-middle"
                      style={{ background: STAGE_COLOR[s] }}
                    />
                    <span className="ml-[6px] align-middle">{STAGE_LABEL[s]}</span>
                  </td>
                  <td className="py-[2px] text-right tabular-nums">{counts[s]}</td>
                </tr>
              ))}
              <tr className="border-t border-rule font-bold">
                <td className="py-[2px]">total</td>
                <td className="py-[2px] text-right tabular-nums">{leads.length}</td>
              </tr>
            </tbody>
          </table>
        </SideBox>

        <SideBox title="about">
          <p className="text-[11px] leading-relaxed text-[#333]">
            The arrows move a lead along the pipeline. Up advances a stage, down
            walks it back &mdash; the same gesture as an upvote, pointed at
            something useful.
          </p>
        </SideBox>
      </aside>

      <LeadFormDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={handleCreate}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent className="border border-header-edge bg-page">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[13px]">
              delete {pendingDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[11px]">
              This removes the lead permanently. There is no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-[11px]">cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
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
