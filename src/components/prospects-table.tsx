"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { updateDealerContacted, deleteMultipleDealers } from "@/app/actions"
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
import { toast } from "sonner"
import { AutoRefresh } from "./auto-refresh"
import { Trash2 } from "lucide-react"

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, startDeleting] = useTransition()

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

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProspects.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProspects.map((p) => p.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return
    const confirm = window.confirm(`¿Estás seguro de eliminar ${selectedIds.size} prospecto(s)?`)
    if (!confirm) return

    startDeleting(async () => {
      const result = await deleteMultipleDealers(Array.from(selectedIds))
      if (result.success) {
        toast.success(`${selectedIds.size} prospecto(s) eliminado(s)`)
        setSelectedIds(new Set())
        router.refresh()
      } else {
        toast.error(result.error || "Error al eliminar")
      }
    })
  }

  const filterButtonStyle = (mode: FilterMode) =>
    mode === filterMode ? "default" : "outline"

  const selectedProspectsData = useMemo(() => {
    return prospects.filter(p => selectedIds.has(p.id))
  }, [prospects, selectedIds])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
      <AutoRefresh interval={5000} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Posibles Clientes</h1>
          <p className="text-base text-muted-foreground">
            Gestiona prospectos que podrían contratar tu ERP.
          </p>
        </div>
        
        {selectedIds.size > 0 ? (
          <div className="flex flex-wrap items-center gap-2 animate-in fade-in zoom-in p-2 bg-muted/50 rounded-lg border">
            <span className="text-sm px-2 font-medium">{selectedIds.size} seleccionados</span>
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected} disabled={isDeleting}>
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar
            </Button>
            <ProspectsExportDialog prospects={selectedProspectsData} />
            <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <ProspectsImportDialog />
            <ProspectsExportDialog prospects={filteredProspects} />
            <ProspectForm />
          </div>
        )}
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
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={filteredProspects.length > 0 && selectedIds.size === filteredProspects.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Seleccionar todos"
                />
              </TableHead>
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
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No hay prospectos que coincidan con los filtros.
                </TableCell>
              </TableRow>
            ) : (
              filteredProspects.map((prospect) => (
                <TableRow
                  key={prospect.id}
                  className={`cursor-pointer ${selectedIds.has(prospect.id) ? 'bg-muted/50' : ''}`}
                  onDoubleClick={() => {
                    setSelectedProspect(prospect)
                    setIsDetailOpen(true)
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(prospect.id)}
                      onCheckedChange={() => toggleSelect(prospect.id)}
                      aria-label={`Seleccionar ${prospect.name}`}
                    />
                  </TableCell>
                  <TableCell>{prospect.name}</TableCell>
                  <TableCell>{prospect.businessType}</TableCell>
                  <TableCell>{prospect.contactPhone}</TableCell>
                  <TableCell>{prospect.location}</TableCell>
                  <TableCell>{prospect.companyType}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
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
                        aria-label={`Marcar ${prospect.name} como contactado`}
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
        Doble click sobre un prospecto para ver detalle, editar, enviar WhatsApp
 o eliminar.
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
