import { Link, useLocation, useSearchParams } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "@/lib/auth"
import { cn } from "cn"

/**
 * The old.reddit page frame: a thin grey user bar, the blue tab bar with
 * the logo, then the content well.
 */
export function Chrome({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [params] = useSearchParams()

  const onList = pathname === "/leads"
  const view = params.get("view")

  return (
    <div className="min-h-screen bg-page">
      {/* #header-bottom-right — the "username | logout" strip */}
      <div className="bg-topbar border-b border-rule">
        <div className="mx-auto flex max-w-[1000px] items-center justify-end gap-2 px-2 py-[3px] text-[10px]">
          {user ? (
            <>
              <span className="font-bold text-black">{user.name}</span>
              <span className="text-meta">|</span>
              <span className="text-meta">{user.email}</span>
              <span className="text-meta">|</span>
              <button
                type="button"
                onClick={logout}
                className="text-link hover:underline"
              >
                logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-link hover:underline">
              login or register
            </Link>
          )}
        </div>
      </div>

      {/* #sr-header-area / .tabmenu */}
      <div className="rdt-tabbar">
        <div className="mx-auto flex max-w-[1000px] items-end gap-3 px-2 pt-2">
          <Link to="/leads" className="flex items-baseline gap-1 pb-1 no-underline">
            <span className="text-[18px] font-bold tracking-tight text-reddit-orange">
              leadflow
            </span>
            <span className="text-[10px] text-[#113355]">crm</span>
          </Link>

          {user && (
            <nav className="flex items-end gap-[2px]">
              <Tab to="/leads" active={onList && view !== "closed"}>
                pipeline
              </Tab>
              <Tab to="/leads?view=closed" active={onList && view === "closed"}>
                closed
              </Tab>
            </nav>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-[1000px] px-2 py-3">{children}</main>
    </div>
  )
}

function Tab({
  to,
  active,
  children,
}: {
  to: string
  active: boolean
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className={cn(
        "border border-b-0 border-header-edge px-2 py-[2px] text-[11px] no-underline",
        active
          ? "relative top-px bg-page font-bold text-black"
          : "bg-header-blue text-[#113355] hover:underline"
      )}
    >
      {children}
    </Link>
  )
}

/** The bordered box that sat down the right-hand side of every page. */
export function SideBox({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="rdt-side-box mb-3">
      <div className="rdt-side-box-title text-[#113355]">{title}</div>
      <div className="p-2">{children}</div>
    </div>
  )
}
