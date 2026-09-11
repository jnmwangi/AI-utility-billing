"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { signOut, useSession } from "@/lib/auth-client"
import { FileText, Gauge, LayoutDashboard, Receipt, Settings2, SlidersHorizontal, Users, Zap } from "lucide-react"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers & Meters", icon: Users },
  { href: "/readings", label: "Readings", icon: Gauge },
  { href: "/invoices", label: "Invoices & Payments", icon: Receipt },
  { href: "/tariffs", label: "Tariffs", icon: SlidersHorizontal },
  { href: "/users", label: "User management", icon: Settings2 },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="size-4" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-mono text-sm font-semibold tracking-tight text-sidebar-foreground">UtilBill</span>
            <span className="text-[11px] text-muted-foreground">Billing Console</span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-medium text-sidebar-foreground">{session?.user.name}</p><p className="truncate text-[11px] text-muted-foreground">{session?.user.email}</p></div><button aria-label="Sign out" onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.assign('/sign-in') } })} className="text-[11px] text-muted-foreground hover:text-foreground">Sign out</button></div>
          <p className="flex items-center gap-2 text-[11px] text-muted-foreground"><FileText className="size-3.5" /> Role-based workspace</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center gap-2 border-b border-border bg-sidebar px-4 md:hidden">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="size-4" strokeWidth={2.5} />
          </div>
          <span className="font-mono text-sm font-semibold">UtilBill</span>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-sidebar px-2 py-2 md:hidden">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border px-5 py-6 sm:flex-row sm:items-center sm:justify-between md:px-8">
      <div className="space-y-1">
        <h1 className="text-balance text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-pretty text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  )
}
