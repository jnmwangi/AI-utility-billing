"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import type { Customer, CustomerStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const STATUSES: CustomerStatus[] = ["ACTIVE", "SUSPENDED", "TERMINATED"]

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer
}) {
  const { addCustomer, updateCustomer } = useStore()
  const editing = Boolean(customer)

  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", status: "ACTIVE" as CustomerStatus })

  useEffect(() => {
    if (open) {
      setForm(
        customer
          ? { name: customer.name, email: customer.email, phone: customer.phone, address: customer.address, status: customer.status }
          : { name: "", email: "", phone: "", address: "", status: "ACTIVE" },
      )
    }
  }, [open, customer])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required.")
      return
    }
    if (editing && customer) {
      updateCustomer(customer.id, form)
      toast.success(`Updated ${form.name}.`)
    } else {
      const created = addCustomer(form)
      toast.success(`Created ${created.name} (${created.id}).`)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit customer" : "New customer"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the account master data." : "Create a customer account record."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Service address</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Maple St" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Billing status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CustomerStatus })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save changes" : "Create customer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
