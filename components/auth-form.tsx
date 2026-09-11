"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import { Loader2, Zap } from "lucide-react"

export function AuthForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    setLoading(true)
    const result = await signIn.email({ email, password })
    setLoading(false)
    if (result.error) {
      setError("We could not sign you in. Check your credentials and try again.")
      return
    }
    router.push("/")
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="size-5" />
          </div>
          <div>
            <p className="font-mono text-lg font-semibold">UtilBill</p>
            <p className="text-xs text-muted-foreground">Utility billing console</p>
          </div>
        </div>
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 space-y-1">
            <h1 className="text-xl font-semibold">Sign in to your workspace</h1>
            <p className="text-sm text-muted-foreground">Accounts are created by an authorized system administrator.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-1.5 text-sm">
              <span>Email</span>
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3" />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span>Password</span>
              <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3" />
            </label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <button disabled={loading} className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {loading && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
