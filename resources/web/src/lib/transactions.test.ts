import { describe, expect, it } from 'vitest'
import { directionOf } from '@/lib/transactions'
import type { Transaction } from '@/types/transaction'

function transaction(source: number | null, target: number | null): Transaction {
  const type = source === null ? 'DEPOSIT' : target === null ? 'WITHDRAWAL' : 'TRANSFER'
  return { id: 1, source_account_id: source, target_account_id: target, amount: 100, date: '2026-08-01T08:00:00', type }
}

describe('directionOf', () => {
  const aliceAccounts = new Set([1, 2])

  it('treats deposits as incoming and withdrawals as outgoing', () => {
    expect(directionOf(transaction(null, 1), aliceAccounts)).toBe('incoming')
    expect(directionOf(transaction(1, null), aliceAccounts)).toBe('outgoing')
  })

  it('evaluates transfers against the given accounts', () => {
    expect(directionOf(transaction(5, 1), aliceAccounts)).toBe('incoming')
    expect(directionOf(transaction(1, 3), aliceAccounts)).toBe('outgoing')
    expect(directionOf(transaction(1, 2), aliceAccounts)).toBe('internal')
  })

  it('makes a transfer between own accounts incoming or outgoing for a single account', () => {
    expect(directionOf(transaction(1, 2), new Set([2]))).toBe('incoming')
    expect(directionOf(transaction(1, 2), new Set([1]))).toBe('outgoing')
  })
})
