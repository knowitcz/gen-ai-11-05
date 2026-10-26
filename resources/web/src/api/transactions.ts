import { getJson } from '@/api/http'
import { dayEnd, dayStart } from '@/lib/dates'
import type { TransactionFilter, TransactionHistory } from '@/types/transaction'

export function getClientTransactions(
  clientId: number,
  filter: TransactionFilter,
  signal?: AbortSignal,
): Promise<TransactionHistory> {
  const query = new URLSearchParams()
  if (filter.from) query.set('from_date', dayStart(filter.from))
  if (filter.to) query.set('to_date', dayEnd(filter.to))
  if (filter.accountId !== undefined) query.set('account_id', String(filter.accountId))
  const suffix = query.size > 0 ? `?${query}` : ''
  return getJson<TransactionHistory>(`/clients/${clientId}/transactions${suffix}`, signal)
}
