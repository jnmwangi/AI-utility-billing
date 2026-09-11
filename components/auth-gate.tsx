"use client"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useSession } from "@/lib/auth-client"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const { data, isPending } = useSession(); const publicRoute = pathname === "/sign-in"
  useEffect(() => { if (!isPending && !data?.user && !publicRoute) router.replace("/sign-in") }, [data, isPending, publicRoute, router])
  if (publicRoute) return <>{children}</>
  if (isPending || !data?.user) return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Checking workspace access…</div>
  return <>{children}</>
}
