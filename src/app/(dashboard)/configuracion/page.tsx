import { requireAuthUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default async function ConfiguracionPage() {
  const user = await requireAuthUser()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Ajustes personales del usuario autenticado.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>
            Actualiza tus datos personales y seguridad de acceso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" defaultValue={user.name ?? ""} />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" defaultValue={user.email ?? ""} disabled />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">New Password</FieldLabel>
              <Input id="password" type="password" placeholder="********" />
            </Field>

            <div className="flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
