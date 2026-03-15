import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const activeClients = [
  {
    company: "Auto Norte SRL",
    contact: "María Hernández",
    phone: "18095551234",
    plan: "Pro",
    status: "Activo",
  },
  {
    company: "Caribe Motors",
    contact: "Luis Gómez",
    phone: "18295552345",
    plan: "Enterprise",
    status: "Activo",
  },
]

export default function ClientesActivosPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">Clientes Activos</h1>
        <p className="text-sm text-muted-foreground">
          Empresas que ya usan tu ERP con plan vigente.
        </p>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeClients.map((client) => (
              <TableRow key={client.company}>
                <TableCell>{client.company}</TableCell>
                <TableCell>{client.contact}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>{client.plan}</TableCell>
                <TableCell>
                  <Badge className="border-transparent bg-chart-2/20 text-chart-2">
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline">Ver detalle</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
