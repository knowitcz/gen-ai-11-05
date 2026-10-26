export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'

export interface Transaction {
  id: number
  source_account_id: number | null
  target_account_id: number | null
  amount: number
  /** ISO date-time without an offset; the backend stores UTC. */
  date: string
  type: TransactionType
}

export interface TransactionSummary {
  total_incoming: number
  total_outgoing: number
}

export interface TransactionHistory {
  summary: TransactionSummary
  transactions: Transaction[]
}

/** Days are `YYYY-MM-DD` in the user's time zone. */
export interface TransactionFilter {
  from?: string
  to?: string
  accountId?: number
}
