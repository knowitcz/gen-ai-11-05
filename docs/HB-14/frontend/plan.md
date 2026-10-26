# HB-14: Transactions Screen — Frontend Plan

Builds on the client screens from [HB-13](../../HB-13/frontend/plan.md) and on the assumptions of the [frontend review](review.md).

## Definition of Done
- DEV: the client detail shows the transactions, their summary and the filter, connected to the API.
- QA: the new parts have tests, including the filter and the direction of transfers.
- OPS: the build in `resources/web/dist/` is updated.

## API
`GET /api/v1/clients/{client_id}/transactions?from_date&to_date&account_id`

```typescript
interface TransactionHistory {
  summary: { total_incoming: number; total_outgoing: number }
  transactions: Array<{
    id: number
    source_account_id: number | null
    target_account_id: number | null
    amount: number
    date: string // ISO date-time without an offset, stored in UTC
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'
  }>
}
```

- The transactions come newest first.
- `404` when the client has no accounts or the account does not belong to the client.
- The client's accounts (names for the table, options for the filter) come from `GET /api/v1/client/{id}`, which the detail already loads.

## Screen
A "Transactions" card under the accounts card on `/clients/:id`:

```text
+----------------------------------------------------------------------+
| Transactions                                                         |
|  From [ 2026-08-01 ]   To [ 2026-08-31 ]   Account [ All accounts v ] |
|                                                         [ Reset ]    |
|  +---------------------------+  +---------------------------+        |
|  | Incoming          +2,000  |  | Outgoing            −450  |        |
|  +---------------------------+  +---------------------------+        |
|  Date              Type        From             To            Amount |
|  20 Aug 2026 16:00 TRANSFER    Alice - Cash     Account #3      −150 |
|  12 Aug 2026 18:20 WITHDRAWAL  Alice - Cash     —               −450 |
|  8 Aug 2026 11:15  TRANSFER    Account #5       Alice - Cash    +400 |
|  1 Aug 2026 08:30  DEPOSIT     —                Alice - Cash  +2,000 |
+----------------------------------------------------------------------+
```

- The filter is kept in the URL (`?from=2026-08-01&to=2026-08-31&account=2`), so a filtered view survives a refresh and can be shared.
- Changing the filter reloads the transactions right away; "Reset" clears it.

## Rules
- **Summary:** shown exactly as returned. It is not recalculated on the client — a wrong total is reported as a bug.
- **Direction of a row** is evaluated against the client's accounts, or against the filtered account when the account filter is set:
  - money comes from outside into them → incoming, `+amount`,
  - money goes from them outside → outgoing, `−amount`,
  - between two of them → internal, amount without a sign.
- **Account names:** the client's own accounts by name, any other account as "Account #id" — nothing more is known about it.
- **Dates:** the API values are UTC and are displayed in the user's time zone. The filter dates are days in the user's time zone; `from` is sent as the start and `to` as the end of the day, converted to UTC.
- **Validation:** "From" after "To" shows an error at the filter and sends no request.

## Screen States
| State                    | Behaviour                                                   |
|--------------------------|-------------------------------------------------------------|
| Loading                  | skeleton in place of the summary and the table              |
| Error                    | message + "Try again"                                       |
| No transactions          | "No transactions yet." / "No transactions match the filter." |
| Client without accounts  | the card is not shown (the API would answer 404)            |
| Invalid range            | error at the filter, the previous result is not shown        |

## Components
- `api/transactions.ts` — `getClientTransactions(clientId, filter)`, builds the query.
- `lib/dates.ts` — day ↔ UTC conversions and date-time formatting.
- `lib/transactions.ts` — direction of a row relative to a set of accounts.
- `components/TransactionsSection.tsx` — filter, summary and table; used by `ClientDetailPage`.

## Tests
- Query building: no filter, each filter, day boundaries converted to UTC.
- Direction: deposit, withdrawal, transfer in, out and internal, with and without the account filter.
- Section: rows with names and signs, summary as returned, the filter updates the request and the URL, invalid range, empty result, error with retry.

Tests run in a fixed time zone (`Europe/Prague`) so that the date conversions are deterministic.
