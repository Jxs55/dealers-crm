"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { updateDealerContacted } from "@/app/actions"
import { ProspectForm } from "@/components/prospect-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Prospect = {
  id: string
  name: string
  businessType: string
  contactPhone: string
  location: string
  companyType: string
  contacted: boolean
}

type FilterMode = "all" | "contacted" | "not-contacted"

type ProspectsTableProps = {
  prospects: Prospect[]
}

function toWhatsAppUrl(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, "")
  return `https://wa.me/${normalizedPhone}?text=Hola`
}

export function ProspectsTable({ prospects }: ProspectsTableProps) {
  const router = useRouter()
  const [filterMode, setFilterMode] = useState<FilterMode>("all")
  const [search, setSearch] = useState("")
  const [isUpdating, startUpdating] = useTransition()

  const filteredProspects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return prospects.filter((prospect) => {
      const matchesFilter =
        filterMode === "all" ||
        (filterMode === "contacted" && prospect.contacted) ||
        (filterMode === "not-contacted" && !prospect.contacted)

      const matchesSearch =
        normalizedSearch.length === 0 ||
        prospect.name.toLowerCase().includes(normalizedSearch)

      return matchesFilter && matchesSearch
    })
  }, [filterMode, prospects, search])

  const filterButtonStyle = (mode: FilterMode) =>
    mode === filterMode ? "default" : "outline"

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Posibles Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona prospectos que podrían contratar tu ERP.
          </p>
        </div>
        <ProspectForm />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button variant={filterButtonStyle("all")} onClick={() => setFilterMode("all")}>
            All
          </Button>
          <Button
            variant={filterButtonStyle("contacted")}
            onClick={() => setFilterMode("contacted")}
          >
            Contacted
          </Button>
          <Button
            variant={filterButtonStyle("not-contacted")}
            onClick={() => setFilterMode("not-contacted")}
          >
            Not Contacted
          </Button>
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name"
          className="w-full md:w-72"
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Business Type</TableHead>
              <TableHead>Contact Phone</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Company Type</TableHead>
              <TableHead>Contacted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProspects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No prospects match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredProspects.map((prospect) => (
                <TableRow key={prospect.id}>
                  <TableCell>{prospect.name}</TableCell>
                  <TableCell>{prospect.businessType}</TableCell>
                  <TableCell>{prospect.contactPhone}</TableCell>
                  <TableCell>{prospect.location}</TableCell>
                  <TableCell>{prospect.companyType}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={prospect.contacted}
                        disabled={isUpdating}
                        onCheckedChange={(checked) => {
                          startUpdating(async () => {
                            const result = await updateDealerContacted(
                              prospect.id,
                              checked === true
                            )

                            if (result.success) {
                              router.refresh()
                            }
                          })
                        }}
                        aria-label={`Mark ${prospect.name} as contacted`}
                      />
                      {prospect.contacted ? (
                        <Badge className="border-transparent bg-chart-2/20 text-chart-2">
                          Contacted
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not Contacted</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" asChild>
                      <a
                        href={toWhatsAppUrl(prospect.contactPhone)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open WhatsApp
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
