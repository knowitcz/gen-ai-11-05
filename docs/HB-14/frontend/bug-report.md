# Bug: Transaction summary ignores transfers

## Summary
`GET /api/v1/clients/{client_id}/transactions` returns `summary.total_incoming` and `summary.total_outgoing` that do not include transfers. The totals on the client detail therefore do not match the transactions listed under them.

## Environment
- Backend: `HB-14: Implement transactions observation feature`, default data from `resources/data/default_transactions.sql`
- Frontend: client detail, Transactions section

## Steps to Reproduce
1. Start the application with a fresh database.
2. Open `/clients/1` (Alice).
3. In the Transactions filter select the account "Alice - Savings" (`/clients/1?account=2`).

## Expected Result
The summary reflects the money that came into and went out of the selected account:

| Transaction                           | Incoming | Outgoing |
|---------------------------------------|---------:|---------:|
| 10 Jul — transfer Alice - Cash → Savings | 1,000 |          |
| 3 Sep — transfer Savings → Alice - Cash  |       |      500 |
| 1 Oct — withdrawal from Savings (30 Sep 23:30 UTC) |  |      200 |
| **Total**                             | **1,000** | **700** |

## Actual Result
Incoming **0**, outgoing **200** — only the withdrawal is counted.

The same happens for all of Alice's accounts (`/clients/1`): the summary shows incoming 8,000 and outgoing 2,500, while the transfers from Charlie's and Bob's accounts (+400, +100) and the transfer to Bob's account (−150) are listed but not counted. Expected: incoming 8,500, outgoing 2,650 (the transfers between Alice's own accounts move no money in or out of the client).

## Cause
`TransactionRepository.get_summary` counts a transaction as incoming only when `source_account_id IS NULL` (a deposit) and as outgoing only when `target_account_id IS NULL` (a withdrawal). This follows the analysis literally ("Sum of DEPOSITS / WITHDRAWALS") — the analysis does not define how transfers count, see finding 2 of the [frontend review](review.md).

## Suggested Fix
Compute the totals relative to the requested accounts (the client's accounts, or the filtered one):
- incoming — the target is one of them and the source is not,
- outgoing — the source is one of them and the target is not.

Update the analysis accordingly. The frontend shows the summary as returned and needs no change.

## Severity
Major — the screen shows wrong totals to the user, with no error.
