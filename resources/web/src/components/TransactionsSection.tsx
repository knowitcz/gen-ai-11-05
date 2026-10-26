import { useSearchParams } from 'react-router'
import { getClientTransactions } from '@/api/transactions'
import { ErrorState, LoadingState } from '@/components/RequestStates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRequest } from '@/hooks/use-request'
import { formatDateTime, isDay, parseApiDateTime } from '@/lib/dates'
import { formatAmount } from '@/lib/format'
import { directionOf, type Direction } from '@/lib/transactions'
import { cn } from '@/lib/utils'
import type { Account, ClientDetail } from '@/types/client'
import type { Transaction, TransactionFilter, TransactionHistory } from '@/types/transaction'

const MINUS = '−'

/** The filter lives in the URL; values that are not valid days or not the client's accounts are ignored. */
function readFilter(params: URLSearchParams, accounts: Account[]): TransactionFilter {
  const from = params.get('from')
  const to = params.get('to')
  const accountId = Number(params.get('account'))
  return {
    from: isDay(from) ? from : undefined,
    to: isDay(to) ? to : undefined,
    accountId: accounts.some((account) => account.id === accountId) ? accountId : undefined,
  }
}

export function TransactionsSection({ client }: { client: ClientDetail }) {
  const [params, setParams] = useSearchParams()
  const filter = readFilter(params, client.accounts)
  const invalidRange = filter.from !== undefined && filter.to !== undefined && filter.from > filter.to
  const isFiltered = filter.from !== undefined || filter.to !== undefined || filter.accountId !== undefined

  function updateParam(name: 'from' | 'to' | 'account', value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(name, value)
        else next.delete(name)
        return next
      },
      { replace: true },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Transactions</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="transactions-from">From</Label>
            <Input
              id="transactions-from"
              type="date"
              value={filter.from ?? ''}
              aria-invalid={invalidRange}
              onChange={(event) => updateParam('from', event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="transactions-to">To</Label>
            <Input
              id="transactions-to"
              type="date"
              value={filter.to ?? ''}
              aria-invalid={invalidRange}
              onChange={(event) => updateParam('to', event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="transactions-account">Account</Label>
            <select
              id="transactions-account"
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={filter.accountId ?? ''}
              onChange={(event) => updateParam('account', event.target.value)}
            >
              <option value="">All accounts</option>
              {client.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <Button variant="outline" disabled={!isFiltered} onClick={() => setParams({}, { replace: true })}>
            Reset
          </Button>
        </div>
        {invalidRange ? (
          <p role="alert" className="text-sm text-destructive">
            "From" must not be after "To".
          </p>
        ) : (
          <TransactionsResult client={client} filter={filter} isFiltered={isFiltered} />
        )}
      </CardContent>
    </Card>
  )
}

function TransactionsResult({
  client,
  filter,
  isFiltered,
}: {
  client: ClientDetail
  filter: TransactionFilter
  isFiltered: boolean
}) {
  const { state, retry } = useRequest(
    (signal) => getClientTransactions(client.id, filter, signal),
    `${client.id}|${filter.from ?? ''}|${filter.to ?? ''}|${filter.accountId ?? ''}`,
  )

  if (state.status === 'loading') return <LoadingState label="Loading transactions" />
  if (state.status === 'error') return <ErrorState message="Transactions could not be loaded." onRetry={retry} />

  const perspective = new Set(
    filter.accountId !== undefined ? [filter.accountId] : client.accounts.map((account) => account.id),
  )
  return (
    <>
      <Summary history={state.data} />
      <TransactionsTable
        transactions={state.data.transactions}
        accounts={client.accounts}
        perspective={perspective}
        emptyText={isFiltered ? 'No transactions match the filter.' : 'No transactions yet.'}
      />
    </>
  )
}

// The totals are shown as the API returns them; recalculating them here would hide backend bugs.
function Summary({ history }: { history: TransactionHistory }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <SummaryTile label="Incoming" value={`+${formatAmount(history.summary.total_incoming)}`} />
      <SummaryTile label="Outgoing" value={`${MINUS}${formatAmount(history.summary.total_outgoing)}`} />
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between rounded-lg border px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-heading text-xl font-semibold tabular-nums" aria-label={`${label} total`}>
        {value}
      </span>
    </div>
  )
}

function TransactionsTable({
  transactions,
  accounts,
  perspective,
  emptyText,
}: {
  transactions: Transaction[]
  accounts: Account[]
  perspective: ReadonlySet<number>
  emptyText: string
}) {
  if (transactions.length === 0) {
    return <p className="py-6 text-center text-muted-foreground">{emptyText}</p>
  }

  const accountName = (id: number | null) => {
    if (id === null) return '—'
    return accounts.find((account) => account.id === id)?.name ?? `Account #${id}`
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="whitespace-nowrap">{formatDateTime(parseApiDateTime(transaction.date))}</TableCell>
            <TableCell>
              <Badge variant="outline">{transaction.type}</Badge>
            </TableCell>
            <TableCell>{accountName(transaction.source_account_id)}</TableCell>
            <TableCell>{accountName(transaction.target_account_id)}</TableCell>
            <AmountCell amount={transaction.amount} direction={directionOf(transaction, perspective)} />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function AmountCell({ amount, direction }: { amount: number; direction: Direction }) {
  const sign = { incoming: '+', outgoing: MINUS, internal: '' }[direction]
  return (
    <TableCell
      className={cn(
        'text-right tabular-nums',
        direction === 'incoming' && 'text-emerald-700 dark:text-emerald-400',
        direction === 'internal' && 'text-muted-foreground',
      )}
    >
      {sign}
      {formatAmount(amount)}
    </TableCell>
  )
}
