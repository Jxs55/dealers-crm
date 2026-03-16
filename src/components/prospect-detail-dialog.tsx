"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Prospect } from "@/types/prospect"

type ProspectDetailDialogProps = {
  prospect: Prospect
}

export function ProspectDetailDialog({ prospect }: ProspectDetailDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Ver detalle</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Posible Cliente</DialogTitle>
          <DialogDescription>
            Información completa del prospecto seleccionado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          <p>
            <span className="font-medium">Nombre:</span> {prospect.name}
          </p>
          <p>
            <span className="font-medium">Tipo de Negocio:</span> {prospect.businessType}
          </p>
          <p>
            <span className="font-medium">Teléfono:</span> {prospect.contactPhone}
          </p>
          <p>
            <span className="font-medium">Ubicación:</span> {prospect.location}
          </p>
          <p>
            <span className="font-medium">Tipo de Empresa:</span> {prospect.companyType}
          </p>
          <p>
            <span className="font-medium">Contactado:</span>{" "}
            {prospect.contacted ? "Sí" : "No"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
