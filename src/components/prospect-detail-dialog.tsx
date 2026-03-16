"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { deleteDealer, updateDealer } from "@/app/actions"
import { OpenWhatsAppButton } from "@/components/open-whatsapp-button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  formatPhoneDisplay,
  isValidDominicanPhone,
  sanitizePhone,
} from "@/lib/phone"
import type { MessageTemplate } from "@/types/message-template"
import type { Prospect } from "@/types/prospect"
import { Button } from "./ui/button"

type ProspectDetailDialogProps = {
  prospect: Prospect | null
  templates: MessageTemplate[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormState = {
  id: string
  name: string
  businessType: string
  contactPhone: string
  location: string
  companyType: string
}

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  businessType: "",
  contactPhone: "",
  location: "",
  companyType: "",
}

export function ProspectDetailDialog({
  prospect,
  templates,
  open,
  onOpenChange,
}: ProspectDetailDialogProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, startSaving] = useTransition()
  const [isDeleting, startDeleting] = useTransition()
  const [formError, setFormError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [formValues, setFormValues] = useState<FormState>(EMPTY_FORM)

  useEffect(() => {
    if (!prospect) {
      setFormValues(EMPTY_FORM)
      setIsEditing(false)
      setFormError("")
      setPhoneError("")
      return
    }

    setFormValues({
      id: prospect.id,
      name: prospect.name,
      businessType: prospect.businessType,
      contactPhone: formatPhoneDisplay(prospect.contactPhone),
      location: prospect.location,
      companyType: prospect.companyType,
    })
    setIsEditing(false)
    setFormError("")
    setPhoneError("")
  }, [prospect])

  if (!prospect) {
    return null
  }

  function handleSave() {
    setFormError("")
    setPhoneError("")

    const sanitizedPhone = sanitizePhone(formValues.contactPhone)

    if (!sanitizedPhone) {
      setPhoneError("El teléfono es obligatorio.")
      return
    }

    if (!isValidDominicanPhone(formValues.contactPhone)) {
      setPhoneError("El teléfono debe ser dominicano y válido.")
      return
    }

    startSaving(async () => {
      const response = await updateDealer(formValues)

      if (!response.success) {
        setFormError(response.error ?? "No se pudo actualizar el prospecto.")
        return
      }

      toast.success("Prospecto actualizado.")
      setIsEditing(false)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!prospect) {
      return
    }

    const prospectId = prospect.id
    const shouldDelete = window.confirm("¿Deseas eliminar este prospecto?")

    if (!shouldDelete) {
      return
    }

    startDeleting(async () => {
      const response = await deleteDealer(prospectId)

      if (!response.success) {
        toast.error(response.error ?? "No se pudo eliminar el prospecto.")
        return
      }

      toast.success("Prospecto eliminado.")
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalle de Posible Cliente</DialogTitle>
          <DialogDescription>
            Información completa del prospecto seleccionado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {isEditing ? (
            <div className="grid gap-3">
              <Input
                value={formValues.name}
                onChange={(event) =>
                  setFormValues((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder="Nombre"
              />
              <Input
                value={formValues.businessType}
                onChange={(event) =>
                  setFormValues((previous) => ({
                    ...previous,
                    businessType: event.target.value,
                  }))
                }
                placeholder="Tipo de negocio"
              />
              <Field>
                <FieldLabel htmlFor="prospectPhone">Teléfono</FieldLabel>
                <Input
                  id="prospectPhone"
                  value={formValues.contactPhone}
                  onChange={(event) => {
                    setFormValues((previous) => ({
                      ...previous,
                      contactPhone: formatPhoneDisplay(event.target.value),
                    }))

                    if (phoneError) {
                      setPhoneError("")
                    }
                  }}
                  placeholder="+1 809 555 1234"
                />
                <FieldError>{phoneError}</FieldError>
              </Field>
              <Input
                value={formValues.location}
                onChange={(event) =>
                  setFormValues((previous) => ({
                    ...previous,
                    location: event.target.value,
                  }))
                }
                placeholder="Ubicación"
              />
              <Input
                value={formValues.companyType}
                onChange={(event) =>
                  setFormValues((previous) => ({
                    ...previous,
                    companyType: event.target.value,
                  }))
                }
                placeholder="Tipo de empresa"
              />
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            </div>
          ) : (
            <div className="grid gap-3 text-sm">
              <p>
                <span className="font-medium">Nombre:</span> {prospect.name}
              </p>
              <p>
                <span className="font-medium">Tipo de negocio:</span> {prospect.businessType}
              </p>
              <p>
                <span className="font-medium">Teléfono:</span> {prospect.contactPhone}
              </p>
              <p>
                <span className="font-medium">Ubicación:</span> {prospect.location}
              </p>
              <p>
                <span className="font-medium">Tipo de empresa:</span> {prospect.companyType}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">Estado:</span>
                {prospect.contacted ? (
                  <Badge className="border-transparent bg-chart-2/20 text-chart-2">
                    Contactado
                  </Badge>
                ) : (
                  <Badge variant="secondary">Pendiente</Badge>
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || isSaving}>
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
          <div className="flex flex-wrap justify-end gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
                <OpenWhatsAppButton prospect={prospect} templates={templates} />
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
