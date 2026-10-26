import { Link, useNavigate } from 'react-router'
import { getClients } from '@/api/clients'
import { ErrorState, LoadingState } from '@/components/RequestStates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRequest } from '@/hooks/use-request'
import type { Client } from '@/types/client'

export function ClientsPage() {
  const { state, retry } = useRequest(getClients, 'clients')

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Clients</h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {state.status === 'loading' && <LoadingState label="Loading clients" />}
        {state.status === 'error' && <ErrorState message="Clients could not be loaded." onRetry={retry} />}
        {state.status === 'success' && <ClientsTable clients={state.data} />}
      </CardContent>
    </Card>
  )
}

function ClientsTable({ clients }: { clients: Client[] }) {
  const navigate = useNavigate()

  if (clients.length === 0) {
    return <p className="py-6 text-center text-muted-foreground">No clients found.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Number</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>National ID number</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow
            key={client.id}
            className="cursor-pointer"
            onClick={() => navigate(`/clients/${client.id}`)}
          >
            <TableCell>{client.id}</TableCell>
            <TableCell className="font-medium">{client.name}</TableCell>
            <TableCell>{client.national_number}</TableCell>
            <TableCell className="text-right">
              <Link
                to={`/clients/${client.id}`}
                className="text-primary underline-offset-4 hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                Detail
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
