import type { Transaction } from '@/types/transaction'

export type Direction = 'incoming' | 'outgoing' | 'internal'

/** Direction of the money relative to the given accounts (the client's, or the filtered one). */
export function directionOf(transaction: Transaction, accountIds: ReadonlySet<number>): Direction {
  const fromInside = transaction.source_account_id !== null && accountIds.has(transaction.source_account_id)
  const toInside = transaction.target_account_id !== null && accountIds.has(transaction.target_account_id)
  if (fromInside && toInside) return 'internal'
  return toInside ? 'incoming' : 'outgoing'
}
