# HB-14: Frontend Review of the Transaction Listing

Review of [analysis-developers.md](../analysis/analysis-developers.md) and [analysis-testers.md](../analysis/analysis-testers.md) from the point of view of the screen that shows the transactions on the client detail.

## Verdict
The screen can be built, but the analysis leaves the frontend to guess in several places. The most serious one is the summary: as specified, its totals do not match the transactions the screen lists.

## Findings

### Must be clarified before implementation

1. **Two different response shapes.** The developers' analysis returns `source_account_id` + `target_account_id` + `type`, the testers' analysis returns a single `account_id`. The frontend needs one contract; the developers' one is assumed below.

2. **The summary ignores transfers.** `total_incoming` is the sum of deposits and `total_outgoing` the sum of withdrawals only. The list, however, contains transfers too:
   - a transfer from another client increases the client's money but is not in `total_incoming`,
   - a transfer to another client decreases it but is not in `total_outgoing`,
   - with the account filter, a transfer between the client's own accounts is incoming for one account and outgoing for the other.

   The user then sees totals that cannot be reconciled with the rows above them. The analysis must define the totals from the point of view of the client (or of the filtered account), including transfers.

3. **Direction of a transfer.** A `TRANSFER` row says nothing about whether the money came in or went out for this client. The frontend can derive it from the client's account ids, but the rule belongs to the analysis (or the API should return a direction / signed amount).

4. **Counterparty accounts.** Rows carry account ids only. The client's own accounts can be named from `GET /api/v1/client/{id}`, but the other side of a transfer to another client is an account the frontend knows nothing about. What may be shown — its name, its owner, only "external account"? This is also a privacy question.

5. **Date filter semantics.** `from_date` / `to_date` are "timestamps", the Gherkin scenarios use dates (`2023-01-31`). A date picker yields a day:
   - is `to_date` inclusive? `2023-01-31` read as midnight drops the whole last day,
   - in which time zone are the dates interpreted and returned? `date` in the response has no defined format or offset.

### Should be specified

6. **Order of the transactions.** Not specified. A statement is expected newest first.
7. **Amount type and currency.** `Float/Integer` is undecided, the testers' example uses `1500.00`, account balances are integers. No currency is given, so none can be displayed.
8. **Errors.** Not specified for a non-existent client, an `account_id` belonging to another client, `from_date` after `to_date`, or an invalid date. The frontend needs the status codes to show the right message — and should validate the date range itself anyway.
9. **`type` is a plain `string`.** It should be the enumeration `DEPOSIT | WITHDRAWAL | TRANSFER`, so the frontend can type and label it.
10. **URL consistency.** The endpoint is `/clients/{client_id}/transactions` (plural) while the existing client endpoints are `/client` and `/client/{id}` (singular); the `/api/v1` prefix is not mentioned.

### Worth knowing

11. **No pagination.** Fine for the workshop data, a risk for a real statement.
12. **Summary is not a balance change.** Initial balances are not transactions, so `incoming − outgoing` does not explain the account balance shown on the same screen. The screen should not suggest it does.
13. **The task says "user", the analysis says "client".** The analysis is right — the screen belongs to the client detail.

## Assumptions for the Frontend
Until the analysis is updated, the screen will:
- use the developers' response shape,
- show the summary exactly as returned, without recalculating it — a wrong total is a backend bug to report, not to hide,
- derive the direction of a transfer from the client's account ids and show the counterparty as "Other account #id" when it is not the client's,
- send `from_date` as the start and `to_date` as the end of the selected day in the user's time zone, and refuse a range where "from" is after "to",
- sort the transactions newest first on the client if the API does not.
