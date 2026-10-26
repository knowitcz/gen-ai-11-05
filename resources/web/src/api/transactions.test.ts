import { describe, expect, it } from 'vitest'
import { getClientTransactions } from '@/api/transactions'
import { json, mockApi, requestedUrls } from '@/test/utils'

const path = '/api/v1/clients/1/transactions'
const empty = json({ summary: { total_incoming: 0, total_outgoing: 0 }, transactions: [] })

describe('transactions API', () => {
  it('asks for all transactions of the client without a filter', async () => {
    const fetchMock = mockApi({ [path]: empty })

    await getClientTransactions(1, {})

    expect(fetchMock).toHaveBeenCalledWith(path, expect.anything())
  })

  it('sends the filter as query parameters', async () => {
    const fetchMock = mockApi({ [path]: empty })

    await getClientTransactions(1, { from: '2026-08-01', to: '2026-08-31', accountId: 2 })

    const [url] = requestedUrls(fetchMock, path)
    expect(Object.fromEntries(url.searchParams)).toEqual({
      from_date: '2026-07-31T22:00:00.000',
      to_date: '2026-08-31T21:59:59.999',
      account_id: '2',
    })
  })
})
