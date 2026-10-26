import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { ApiError, getClient } from '@/api/clients'
import { ErrorState, LoadingState } from '@/components/RequestStates'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRequest } from '@/hooks/use-request'
import { formatAmount } from '@/lib/format'
import type { ClientDetail } from '@/types/client'

function parseClientId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  return Number(value)
}

export function ClientDetailPage() {
  const clientId = parseClientId(useParams().id)

  return (
    <div className="flex flex-col gap-4">
      <BackToList />
      {clientId === null ? <ClientNotFound /> : <ClientDetailContent clientId={clientId} />}
    </div>
  )
}

function ClientDetailContent({ clientId }: { clientId: number }) {
  const { state, retry } = useRequest((signal) => getClient(clientId, signal), clientId)

  if (state.status === 'loading') return <LoadingState label="Loading client" />
  if (state.status === 'error') {
    if (state.error instanceof ApiError && state.error.status === 404) return <ClientNotFound />
    return <ErrorState message="The client could not be loaded." onRetry={retry} />
  }
  return <ClientCard client={state.data} />
}

function ClientCard({ client }: { client: ClientDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>{client.name}</h1>
        </CardTitle>
        <CardDescription>
          <dl className="flex flex-wrap gap-x-6 gap-y-1">
            <div className="flex gap-1">
              <dt>Number:</dt>
              <dd>{client.id}</dd>
            </div>
            <div className="flex gap-1">
              <dt>National ID number:</dt>
              <dd>{client.national_number}</dd>
            </div>
          </dl>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <h2 className="font-heading font-medium">Accounts</h2>
        {client.accounts.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">The client has no accounts.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {client.accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{account.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatAmount(account.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function ClientNotFound() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Client not found.</h1>
        </CardTitle>
        <CardDescription>The client does not exist or the link is wrong.</CardDescription>
      </CardHeader>
    </Card>
  )
}

function BackToList() {
  return (
    <Link to="/clients" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" />
      Back to list
    </Link>
  )
}
