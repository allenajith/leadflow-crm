import { Link } from "react-router-dom"
import { cn } from "cn"
import { timeAgo } from "@/lib/format"
import { STAGE_COLOR, STAGE_LABEL, nextStage, prevStage } from "@/lib/types"
import type { Lead, LeadStatus } from "@/lib/types"

type Props = {
  lead: Lead
  rank: number
  alt: boolean
  busy: boolean
  onStage: (id: number, status: LeadStatus) => void
  onDelete: (lead: Lead) => void
}

/**
 * One entry in the listing — old.reddit's `.thing`.
 *
 * The vote arrows become pipeline controls: up advances the lead a stage,
 * down walks it back, and the "score" slot shows the current stage.
 */
export function LeadRow({ lead, rank, alt, busy, onStage, onDelete }: Props) {
  const up = nextStage(lead.status)
  const down = prevStage(lead.status)

  return (
    <div
      className={cn(
        "flex items-start gap-1 px-1 py-[6px]",
        alt && "bg-row-alt"
      )}
    >
      <div className="w-7 pt-[2px] text-right text-[14px] text-meta tabular-nums">
        {rank}
      </div>

      {/* .midcol — the arrows and score */}
      <div className="flex w-[38px] shrink-0 flex-col items-center pt-[1px]">
        <Arrow
          dir="up"
          title={up ? `advance to ${STAGE_LABEL[up]}` : "already closed"}
          disabled={!up || busy}
          onClick={() => up && onStage(lead.id, up)}
        />
        <div
          className="py-[1px] text-[10px] font-bold leading-tight"
          style={{ color: STAGE_COLOR[lead.status] }}
        >
          {STAGE_LABEL[lead.status]}
        </div>
        <Arrow
          dir="down"
          title={down ? `back to ${STAGE_LABEL[down]}` : "already new"}
          disabled={!down || busy}
          onClick={() => down && onStage(lead.id, down)}
        />
      </div>

      <div className="min-w-0 flex-1">
        {/* The title line — lead name, then company in parens like reddit's domain */}
        <div className="leading-snug">
          <Link
            to={`/leads/${lead.id}`}
            className="text-[13px] visited:text-link-visited"
          >
            {lead.name}
          </Link>{" "}
          <span className="text-[10px] text-meta">({lead.company})</span>
        </div>

        <div className="rdt-tagline">
          added {timeAgo(lead.createdAt)} &middot;{" "}
          <a href={`mailto:${lead.email}`} className="text-meta underline">
            {lead.email}
          </a>
          {lead.phone ? ` · ${lead.phone}` : ""}
        </div>

        <div className="rdt-actions mt-[2px] flex gap-2">
          <Link to={`/leads/${lead.id}`}>details</Link>
          <Link to={`/leads/${lead.id}?edit=1`}>edit</Link>
          <button
            type="button"
            onClick={() => onDelete(lead)}
            disabled={busy}
            className="text-meta hover:underline disabled:opacity-50"
          >
            delete
          </button>
        </div>
      </div>
    </div>
  )
}

function Arrow({
  dir,
  title,
  disabled,
  onClick,
}: {
  dir: "up" | "down"
  title: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-0 w-0 border-x-[7px] border-x-transparent transition-colors",
        dir === "up"
          ? "border-b-[7px] border-b-[#c6c6c6] hover:border-b-reddit-orange"
          : "border-t-[7px] border-t-[#c6c6c6] hover:border-t-[#5f99cf]",
        disabled && "cursor-default opacity-30 hover:border-b-[#c6c6c6] hover:border-t-[#c6c6c6]"
      )}
    />
  )
}
