"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Papa from "papaparse"
import * as XLSX from "xlsx"

import { importProspectsBatch } from "@/app/actions"
import {
  mapPdfLineToProspect,
  mapRecordToProspect,
} from "@/lib/prospect-import"
import { isValidDominicanPhone, sanitizePhone } from "@/lib/phone"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Prospect, ProspectImportInput, ProspectImportRow } from "@/types/prospect"

type PreviewRow = ProspectImportRow & {
  errors: string[]
  duplicatePhone: boolean
  duplicateName: boolean
  excluded: boolean
}

type ProspectsImportDialogProps = {
  existingProspects: Prospect[]
}

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

function makeLocalId(index: number) {
  return `row-${index}-${Math.random().toString(36).slice(2, 9)}`
}

function computePreviewRows(
  rows: ProspectImportRow[],
  existingProspects: Prospect[]
): PreviewRow[] {
  const existingPhoneSet = new Set(existingProspects.map((item) => sanitizePhone(item.contactPhone)))
  const existingNameSet = new Set(existingProspects.map((item) => normalizeName(item.name)))

  const phoneCounts = new Map<string, number>()
  const nameCounts = new Map<string, number>()

  for (const row of rows) {
    const sanitized = sanitizePhone(row.contactPhone)
    const normalizedName = normalizeName(row.name)

    if (sanitized) {
      phoneCounts.set(sanitized, (phoneCounts.get(sanitized) ?? 0) + 1)
    }

    if (normalizedName) {
      nameCounts.set(normalizedName, (nameCounts.get(normalizedName) ?? 0) + 1)
    }
  }

  return rows.map((row) => {
    const errors: string[] = []
    const sanitized = sanitizePhone(row.contactPhone)
    const normalizedName = normalizeName(row.name)

    if (!row.name.trim()) {
      errors.push("Nombre requerido")
    }

    if (!row.businessType.trim()) {
      errors.push("Tipo de negocio requerido")
    }

    if (!row.location.trim()) {
      errors.push("Ubicación requerida")
    }

    if (!row.companyType.trim()) {
      errors.push("Tipo de empresa requerido")
    }

    if (!row.contactPhone.trim()) {
      errors.push("Teléfono requerido")
    }

    if (/[A-Za-z]/.test(row.contactPhone)) {
      errors.push("Solo dígitos permitidos")
    }

    if (sanitized.length < 10) {
      errors.push("Mínimo 10 dígitos")
    }

    if (!isValidDominicanPhone(row.contactPhone)) {
      errors.push("Formato dominicano inválido")
    }

    const duplicatePhone =
      (sanitized.length > 0 && (phoneCounts.get(sanitized) ?? 0) > 1) ||
      existingPhoneSet.has(sanitized)

    const duplicateName =
      (normalizedName.length > 0 && (nameCounts.get(normalizedName) ?? 0) > 1) ||
      existingNameSet.has(normalizedName)

    const excluded = errors.length > 0 || duplicatePhone || duplicateName

    return {
      ...row,
      errors,
      duplicatePhone,
      duplicateName,
      excluded,
    }
  })
}

async function parseCsv(file: File) {
  const text = await file.text()
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
  })

  return result.data.map((record, index) => ({
    localId: makeLocalId(index),
    ...mapRecordToProspect(record),
  }))
}

async function parseXlsx(file: File) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array" })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet)

  return data.map((record, index) => ({
    localId: makeLocalId(index),
    ...mapRecordToProspect(record),
  }))
}

async function parsePdf(file: File) {
  const pdfjs = await import("pdfjs-dist")
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

  const data = new Uint8Array(await file.arrayBuffer())
  const document = await pdfjs.getDocument({ data }).promise

  const parsedRows: ProspectImportRow[] = []

  for (let pageIndex = 1; pageIndex <= document.numPages; pageIndex++) {
    const page = await document.getPage(pageIndex)
    const textContent = await page.getTextContent()
    const items = textContent.items as Array<{ str: string; transform: number[] }>

    const linesByY = new Map<number, Array<{ x: number; text: string }>>()

    for (const item of items) {
      const y = Math.round(item.transform[5])
      const x = item.transform[4]
      const current = linesByY.get(y) ?? []
      current.push({ x, text: item.str })
      linesByY.set(y, current)
    }

    const sortedLines = [...linesByY.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) =>
        parts
          .sort((a, b) => a.x - b.x)
          .map((part) => part.text)
          .join(" ")
          .trim()
      )

    for (const line of sortedLines) {
      if (/name|nombre|telefono|teléfono|phone/i.test(line)) {
        continue
      }

      const mapped = mapPdfLineToProspect(line)
      if (!mapped) {
        continue
      }

      parsedRows.push({
        localId: makeLocalId(parsedRows.length),
        ...mapped,
      })
    }
  }

  return parsedRows
}

async function parseFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase()

  if (extension === "csv") {
    return parseCsv(file)
  }

  if (extension === "xlsx") {
    return parseXlsx(file)
  }

  if (extension === "pdf") {
    return parsePdf(file)
  }

  throw new Error("Unsupported file type. Use CSV, XLSX or PDF.")
}

export function ProspectsImportDialog({ existingProspects }: ProspectsImportDialogProps) {
  const router = useRouter()
  const [rows, setRows] = useState<ProspectImportRow[]>([])
  const [open, setOpen] = useState(false)
  const [parseError, setParseError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isParsing, startParsing] = useTransition()
  const [isImporting, startImporting] = useTransition()

  const previewRows = useMemo(
    () => computePreviewRows(rows, existingProspects),
    [rows, existingProspects]
  )

  const validRows = previewRows.filter((row) => !row.excluded)
  const excludedRows = previewRows.filter((row) => row.excluded)

  const handleCellEdit = (
    localId: string,
    field: keyof ProspectImportInput,
    value: string
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.localId === localId
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    )
  }

  const handleFileUpload = (file: File | undefined) => {
    if (!file) {
      return
    }

    startParsing(async () => {
      setParseError("")
      setSuccessMessage("")

      try {
        const parsed = await parseFile(file)
        setRows(parsed)
      } catch (error) {
        setRows([])
        setParseError(
          error instanceof Error
            ? error.message
            : "Unable to parse file for import preview."
        )
      }
    })
  }

  const handleConfirmImport = () => {
    startImporting(async () => {
      setParseError("")
      setSuccessMessage("")

      const payload: ProspectImportRow[] = validRows.map((row) => ({
        localId: row.localId,
        name: row.name,
        businessType: row.businessType,
        contactPhone: row.contactPhone,
        location: row.location,
        companyType: row.companyType,
      }))

      if (payload.length === 0) {
        setParseError("No valid rows to import.")
        return
      }

      const result = await importProspectsBatch(payload)

      if (!result.success) {
        setParseError(result.error ?? "Import failed.")
        return
      }

      setSuccessMessage(
        `Import completed. Inserted: ${result.insertedCount ?? 0}. Excluded: ${excludedRows.length + (result.skippedCount ?? 0)}.`
      )
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setRows([])
          setParseError("")
          setSuccessMessage("")
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Importar</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Importar Posibles Clientes</DialogTitle>
          <DialogDescription>
            Sube CSV, Excel o PDF, revisa el preview y confirma el import.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Input
            type="file"
            accept=".csv,.xlsx,.pdf"
            onChange={(event) => handleFileUpload(event.target.files?.[0])}
          />

          {isParsing ? <p className="text-sm text-muted-foreground">Parsing file...</p> : null}

          {parseError ? <p className="text-sm text-destructive">{parseError}</p> : null}
          {successMessage ? <p className="text-sm text-chart-2">{successMessage}</p> : null}

          {rows.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Total: {previewRows.length}</Badge>
                <Badge className="border-transparent bg-chart-2/20 text-chart-2">
                  Válidos: {validRows.length}
                </Badge>
                <Badge variant="destructive">Excluidos: {excludedRows.length}</Badge>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo de Negocio</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Tipo de Empresa</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row) => (
                      <TableRow
                        key={row.localId}
                        className={row.excluded ? "bg-destructive/5" : ""}
                      >
                        <TableCell>
                          <Input
                            value={row.name}
                            onChange={(event) =>
                              handleCellEdit(row.localId, "name", event.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.businessType}
                            onChange={(event) =>
                              handleCellEdit(row.localId, "businessType", event.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.contactPhone}
                            onChange={(event) =>
                              handleCellEdit(row.localId, "contactPhone", event.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.location}
                            onChange={(event) =>
                              handleCellEdit(row.localId, "location", event.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.companyType}
                            onChange={(event) =>
                              handleCellEdit(row.localId, "companyType", event.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {row.errors.length > 0 ? (
                              <Badge variant="destructive">Invalid data</Badge>
                            ) : null}
                            {row.duplicatePhone ? (
                              <Badge variant="destructive">Duplicate phone</Badge>
                            ) : null}
                            {row.duplicateName ? (
                              <Badge variant="destructive">Duplicate name</Badge>
                            ) : null}
                            {!row.excluded ? (
                              <Badge className="border-transparent bg-chart-2/20 text-chart-2">
                                Ready
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            onClick={handleConfirmImport}
            disabled={isImporting || validRows.length === 0}
          >
            {isImporting ? "Importando..." : "Confirm Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
