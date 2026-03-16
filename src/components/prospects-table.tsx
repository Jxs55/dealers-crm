"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { updateDealerContacted } from "@/app/actions"
import { ProspectDetailDialog } from "@/components/prospect-detail-dialog"
import { ProspectsExportDialog } from "@/components/prospects-export-dialog"
import { ProspectForm } from "@/components/prospect-form"
import { ProspectsImportDialog } from "@/components/prospects-import-dialog"
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
import type { MessageTemplate } from "@/types/message-template"
import type { Prospect } from "@/types/prospect"

type FilterMode = "all" | "contacted" | "not-contacted"

type ProspectsTableProps = {
  prospects: Prospect[]
  templates: MessageTemplate[]
}

export function ProspectsTable({ prospects, templates }: ProspectsTableProps) {
  const router = useRouter()
  const [filterMode, setFilterMode] = useState<FilterMode>("all")
  const [search, setSearch] = useState("")
  const [isUpdating, startUpdating] = useTransition()
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Posibles Clientes</h1>
          <p className="text-base text-muted-foreground">
            Gestiona prospectos que podrían contratar tu ERP.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProspectsImportDialog />
          <ProspectsExportDialog prospects={filteredProspects} />
          <ProspectForm />
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button variant={filterButtonStyle("all")} onClick={() => setFilterMode("all")}>
            Todos
          </Button>
          <Button
            variant={filterButtonStyle("contacted")}
            onClick={() => setFilterMode("contacted")}
          >
            Contactados
          </Button>
          <Button
            variant={filterButtonStyle("not-contacted")}
            onClick={() => setFilterMode("not-contacted")}
          >
            Pendientes
          </Button>
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre"
          className="w-full md:w-72"
        />
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table className="min-w-250">
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo de negocio</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Tipo de empresa</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProspects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No hay prospectos que coincidan con los filtros.
                </TableCell>
              </TableRow>
            ) : (
              filteredProspects.map((prospect) => (
                <TableRow
                  key={prospect.id}
                  className="cursor-pointer"
                  onDoubleClick={() => {
                    setSelectedProspect(prospect)
                    setIsDetailOpen(true)
                  }}
                >
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
                          Contactado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendiente</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Doble click sobre un prospecto para ver detalle, editar, enviar WhatsApp o eliminar.
      </p>

      <ProspectDetailDialog
        prospect={selectedProspect}
        templates={templates}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  )
}
