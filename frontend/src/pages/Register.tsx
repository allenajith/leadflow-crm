import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim() || !password) {
      setError("all fields are required")
      return
    }

    setBusy(true)
    try {
      await register(name, email, password)
      navigate("/leads", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not register")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[340px] pt-8">
      <div className="rdt-side-box">
        <div className="rdt-side-box-title text-[#113355]">create an account</div>
        <form onSubmit={handleSubmit} className="space-y-2 p-3">
          <label className="block">
            <span className="mb-[2px] block text-[10px] font-bold uppercase text-meta">
              username
            </span>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </label>

          <label className="block">
            <span className="mb-[2px] block text-[10px] font-bold uppercase text-meta">
              email
            </span>
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-[2px] block text-[10px] font-bold uppercase text-meta">
              password
            </span>
            <input
              type="password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && (
            <p className="border border-destructive bg-[#fff0f0] px-2 py-1 text-[11px] text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="sm" disabled={busy} className="w-full">
            {busy ? "creating..." : "create account"}
          </Button>

          <p className="pt-1 text-center text-[10px] text-meta">
            already registered? <Link to="/login">log in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  "w-full border border-input bg-white px-[5px] py-[3px] text-[12px] outline-none focus:border-header-edge"
