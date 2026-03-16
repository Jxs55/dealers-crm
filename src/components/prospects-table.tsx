"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { deleteMultipleDealers, updateDealerContacted } from "@/app/actions"
import { ProspectDetailDialog } from "@/components/prospect-detail-dialog"
import { ProspectForm } from "@/components/prospect-form"
import { ProspectsExportDialog } from "@/components/prospects-export-dialog"
import { ProspectsImportDialog } from "@/components/prospects-import-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { renderMessageTemplate } from "@/lib/message-template"
import type { MessageTemplate } from "@/types/message-template"
import type { Prospect } from "@/types/prospect"
import { Instagram, MessageCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AutoRefresh } from "./auto-refresh"

type StatusFilterMode = "all" | "contacted" | "not-contacted"
type ContactFilterMode =
  | "all"
  | "has-whatsapp"
  | "has-instagram"
  | "has-both"
  | "no-contact"

type ProspectsTableProps = {
  prospects: Prospect[]
  templates: MessageTemplate[]
}

function getWhatsAppUrl(phone: string, message: string) {
  return `https://web.whatsapp.com/send?phone=${phone.replace(/\D/g, "")}&text=${encodeURIComponent(message)}`
}

function getWhatsAppDesktopUrl(phone: string, message: string) {
  return `whatsapp://send?phone=${phone.replace(/\D/g, "")}&text=${encodeURIComponent(message)}`
}

function openOrReuseWhatsAppTab(url: string) {
  const whatsappTab = window.open("", "crm-whatsapp-tab")

  if (!whatsappTab) {
    window.open(url, "_blank")
    return
  }

  whatsappTab.location.href = url
  whatsappTab.focus()
}

function openWhatsAppWithFallback(phone: string, message: string) {
  const desktopUrl = getWhatsAppDesktopUrl(phone, message)
  const webUrl = getWhatsAppUrl(phone, message)
  let switchedContext = false

  const onVisibilityChange = () => {
    if (document.hidden) {
      switchedContext = true
    }
  }

  window.addEventListener("visibilitychange", onVisibilityChange)
  window.location.href = desktopUrl

  window.setTimeout(() => {
    window.removeEventListener("visibilitychange", onVisibilityChange)

    if (!switchedContext) {
      openOrReuseWhatsAppTab(webUrl)
    }
  }, 900)
}

function getInstagramUrl(handle: string) {
  return `https://instagram.com/${handle}`
}

export function ProspectsTable({ prospects, templates }: ProspectsTableProps) {
  const router = useRouter()
  const [statusFilterMode, setStatusFilterMode] = useState<StatusFilterMode>("all")
  const [contactFilterMode, setContactFilterMode] = useState<ContactFilterMode>("all")
  const [search, setSearch] = useState("")
  const [isUpdating, startUpdating] = useTransition()
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, startDeleting] = useTransition()

  const defaultMessage = useMemo(() => {
    if (templates.length === 0) {
      return "Hola"
    }

    const firstTemplate = templates[0]
    return firstTemplate.messageTemplate
  }, [templates])

  const filteredProspects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return prospects.filter((prospect) => {
      const hasWhatsapp = Boolean(prospect.phone)
      const hasInstagram = Boolean(prospect.instagram)

      const matchesStatusFilter =
        statusFilterMode === "all" ||
        (statusFilterMode === "contacted" && prospect.contacted) ||
        (statusFilterMode === "not-contacted" && !prospect.contacted)

      const matchesContactFilter =
        contactFilterMode === "all" ||
        (contactFilterMode === "has-whatsapp" && hasWhatsapp) ||
        (contactFilterMode === "has-instagram" && hasInstagram) ||
        (contactFilterMode === "has-both" && hasWhatsapp && hasInstagram) ||
        (contactFilterMode === "no-contact" && !hasWhatsapp && !hasInstagram)

      const matchesSearch =
        normalizedSearch.length === 0 || prospect.name.toLowerCase().includes(normalizedSearch)

      return matchesStatusFilter && matchesContactFilter && matchesSearch
    })
  }, [contactFilterMode, prospects, search, statusFilterMode])

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProspects.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProspects.map((prospect) => prospect.id)))
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
    if (selectedIds.size === 0) {
      return
    }

    const shouldDelete = window.confirm(
      `¿Estás seguro de eliminar ${selectedIds.size} prospecto(s)?`
    )

    if (!shouldDelete) {
      return
    }

    startDeleting(async () => {
      const result = await deleteMultipleDealers(Array.from(selectedIds))

      if (!result.success) {
        toast.error(result.error || "Error al eliminar")
        return
      }

      toast.success(`${selectedIds.size} prospecto(s) eliminado(s)`)
      setSelectedIds(new Set())
      router.refresh()
    })
  }

  const statusFilterButtonStyle = (mode: StatusFilterMode) =>
    mode === statusFilterMode ? "default" : "outline"

  const selectedProspectsData = useMemo(
    () => prospects.filter((prospect) => selectedIds.has(prospect.id)),
    [prospects, selectedIds]
  )

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
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 p-2">
            <span className="px-2 text-sm font-medium">{selectedIds.size} seleccionados</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              <Trash2 className="mr-1 h-4 w-4" />
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
          <Button
            variant={statusFilterButtonStyle("all")}
            onClick={() => setStatusFilterMode("all")}
          >
            Todos
          </Button>
          <Button
            variant={statusFilterButtonStyle("contacted")}
            onClick={() => setStatusFilterMode("contacted")}
          >
            Contactados
          </Button>
          <Button
            variant={statusFilterButtonStyle("not-contacted")}
            onClick={() => setStatusFilterMode("not-contacted")}
          >
            Pendientes
          </Button>
        </div>

        <div className="grid w-full gap-3 md:w-auto md:grid-cols-[220px_240px]">
          <Select
            value={contactFilterMode}
            onValueChange={(value) => setContactFilterMode(value as ContactFilterMode)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Filter by: Todos</SelectItem>
              <SelectItem value="has-whatsapp">Has WhatsApp</SelectItem>
              <SelectItem value="has-instagram">Has Instagram</SelectItem>
              <SelectItem value="has-both">Has Both</SelectItem>
              <SelectItem value="no-contact">No Contact Method</SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <TooltipProvider>
          <Table className="min-w-280">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12.5">
                  <Checkbox
                    checked={
                      filteredProspects.length > 0 &&
                      selectedIds.size === filteredProspects.length
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Seleccionar todos"
                  />
                </TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo de negocio</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Tipo de empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProspects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                    No hay prospectos que coincidan con los filtros.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProspects.map((prospect) => {
                  const hasWhatsapp = Boolean(prospect.phone)
                  const hasInstagram = Boolean(prospect.instagram)

                  return (
                    <TableRow
                      key={prospect.id}
                      className={`cursor-pointer ${selectedIds.has(prospect.id) ? "bg-muted/50" : ""}`}
                      onDoubleClick={() => {
                        setSelectedProspect(prospect)
                        setIsDetailOpen(true)
                      }}
                    >
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(prospect.id)}
                          onCheckedChange={() => toggleSelect(prospect.id)}
                          aria-label={`Seleccionar ${prospect.name}`}
                        />
                      </TableCell>
                      <TableCell>{prospect.name}</TableCell>
                      <TableCell>{prospect.businessType}</TableCell>
                      <TableCell>{prospect.phone}</TableCell>
                      <TableCell>{prospect.phone}</TableCell>
                      <TableCell>{prospect.instagram ? `@${prospect.instagram}` : "-"}</TableCell>
                      <TableCell>{prospect.location}</TableCell>
                      <TableCell>{prospect.companyType}</TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
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
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {hasWhatsapp ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-9 w-9 hover:bg-chart-2/10"
                                  asChild
                                >
                                  <a
                                    href={getWhatsAppUrl(
                                      prospect.phone,
                                      renderMessageTemplate(defaultMessage, prospect)
                                    )}
                                    onClick={(event) => {
                                      event.preventDefault()
                                      openWhatsAppWithFallback(
                                        prospect.phone,
                                        renderMessageTemplate(defaultMessage, prospect)
                                      )
                                    }}
                                    target="crm-whatsapp-tab"
                                  >
                                    <MessageCircle className="h-4 w-4 text-chart-2" />
                                    <span className="sr-only">Open WhatsApp</span>
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Open WhatsApp</TooltipContent>
                            </Tooltip>
                          ) : null}

                          {hasInstagram ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-9 w-9 hover:bg-chart-5/10"
                                  asChild
                                >
                                  <a
                                    href={getInstagramUrl(prospect.instagram!)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Instagram className="h-4 w-4 text-chart-5" />
                                    <span className="sr-only">Open Instagram</span>
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Open Instagram</TooltipContent>
                            </Tooltip>
                          ) : null}

                          {!hasWhatsapp && !hasInstagram ? (
                            <Badge variant="secondary">No contact method</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>

      <p className="text-sm text-muted-foreground">
        Doble click sobre un prospecto para ver detalle, editar, contactar o eliminar.
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
