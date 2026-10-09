import { Navigate, Route, Routes } from "react-router-dom"
import { Chrome } from "@/components/layout/Chrome"
import { RequireAuth } from "@/lib/auth"
import { Login } from "@/pages/Login"
import { Register } from "@/pages/Register"
import { Leads } from "@/pages/Leads"
import { LeadDetail } from "@/pages/LeadDetail"

export default function App() {
  return (
    <Chrome>
      <Routes>
        <Route path="/" element={<Navigate to="/leads" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/leads"
          element={
            <RequireAuth>
              <Leads />
            </RequireAuth>
          }
        />
        <Route
          path="/leads/:id"
          element={
            <RequireAuth>
              <LeadDetail />
            </RequireAuth>
          }
        />
        <Route
          path="*"
          element={
            <p className="p-2 text-[11px] text-meta">
              there doesn't seem to be anything here.
            </p>
          }
        />
      </Routes>
    </Chrome>
  )
}
