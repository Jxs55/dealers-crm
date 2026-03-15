"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { createDealer } from "@/app/actions"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
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
  formatPhoneDisplay,
  isValidDominicanPhone,
  sanitizePhone,
} from "@/lib/phone"

export function ProspectForm() {
  const router = useRouter()
  const [phoneInput, setPhoneInput] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [formError, setFormError] = useState("")
  const [isSubmitting, startSubmitting] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>Add Prospecto</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Prospecto</DialogTitle>
          <DialogDescription>
            Guarda un posible cliente para contacto comercial.
          </DialogDescription>
        </DialogHeader>

        <form
          action={(formData) => {
            startSubmitting(async () => {
              setFormError("")
              setPhoneError("")

              const phoneValue = String(formData.get("contactPhone") ?? "")
              const sanitizedPhone = sanitizePhone(phoneValue)

              if (!sanitizedPhone) {
                setPhoneError("Phone is required.")
                return
              }

              if (sanitizedPhone.length < 10) {
                setPhoneError("Phone must contain at least 10 digits.")
                return
              }

              if (!isValidDominicanPhone(phoneValue)) {
                setPhoneError("Phone must be a valid Dominican number.")
                return
              }

              const result = await createDealer(formData)

              if (!result.success) {
                setFormError(result.error ?? "Unable to save prospect.")
                return
              }

              setPhoneInput("")
              setIsDialogOpen(false)
              router.refresh()
            })
          }}
          className="grid gap-3"
        >
          <Input name="name" placeholder="Name" required />
          <Input name="businessType" placeholder="Business Type" required />

          <Field>
            <FieldLabel htmlFor="contactPhone">Phone</FieldLabel>
            <Input
              id="contactPhone"
              name="contactPhone"
              placeholder="+1 809 555 1234"
              value={phoneInput}
              onChange={(event) => {
                setPhoneInput(formatPhoneDisplay(event.target.value))
                if (phoneError) {
                  setPhoneError("")
                }
              }}
              inputMode="tel"
              required
            />
            <FieldError>{phoneError}</FieldError>
          </Field>

          <Input name="location" placeholder="Location" required />
          <Input name="companyType" placeholder="Company Type" required />

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Prospecto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
