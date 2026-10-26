import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { json, mockApi, networkError, renderAt, requestedUrls } from '@/test/utils'

const alice = {
  id: 1,
  name: 'Alice',
  national_number: '900101/1234',
  accounts: [
    { id: 1, name: 'Alice - Cash', balance: 1000, type: 'CASH', client_id: 1 },
    { id: 2, name: 'Alice - Savings', balance: 5000, type: 'SAVINGS', client_id: 1 },
  ],
}

const history = {
  summary: { total_incoming: 2000, total_outgoing: 450 },
  transactions: [
    { id: 4, source_account_id: 1, target_account_id: 3, amount: 150, date: '2026-08-20T14:00:00', type: 'TRANSFER' },
    { id: 3, source_account_id: 1, target_account_id: 2, amount: 1000, date: '2026-08-15T09:00:00', type: 'TRANSFER' },
    { id: 2, source_account_id: 1, target_account_id: null, amount: 450, date: '2026-08-12T16:20:00', type: 'WITHDRAWAL' },
    { id: 1, source_account_id: null, target_account_id: 1, amount: 2000, date: '2026-08-01T06:30:00', type: 'DEPOSIT' },
  ],
}

const transactionsPath = '/api/v1/clients/1/transactions'

function rowOf(date: string) {
  return screen.getByRole('cell', { name: date }).closest('tr')!
}

describe('TransactionsSection', () => {
  it('lists the transactions with account names, local dates and signed amounts', async () => {
    mockApi({ '/api/v1/client/1': json(alice), [transactionsPath]: json(history) })
    renderAt('/clients/1')

    await screen.findByRole('cell', { name: '20 Aug 2026, 16:00' })

    const outgoingTransfer = rowOf('20 Aug 2026, 16:00')
    expect(within(outgoingTransfer).getByText('Alice - Cash')).toBeInTheDocument()
    expect(within(outgoingTransfer).getByText('Account #3')).toBeInTheDocument()
    expect(within(outgoingTransfer).getByText('−150')).toBeInTheDocument()

    expect(within(rowOf('15 Aug 2026, 11:00')).getByRole('cell', { name: '1,000' })).toBeInTheDocument()
    expect(within(rowOf('12 Aug 2026, 18:20')).getByText('−450')).toBeInTheDocument()
    expect(within(rowOf('1 Aug 2026, 08:30')).getByText('+2,000')).toBeInTheDocument()
  })

  it('shows the summary exactly as the API returns it', async () => {
    mockApi({ '/api/v1/client/1': json(alice), [transactionsPath]: json(history) })
    renderAt('/clients/1')

    expect(await screen.findByLabelText('Incoming total')).toHaveTextContent('+2,000')
    expect(screen.getByLabelText('Outgoing total')).toHaveTextContent('−450')
  })

  it('reads the filter from the URL and sends it to the API', async () => {
    const fetchMock = mockApi({ '/api/v1/client/1': json(alice), [transactionsPath]: json(history) })
    renderAt('/clients/1?from=2026-08-01&to=2026-08-31&account=2')

    await screen.findByLabelText('Incoming total')

    expect(screen.getByLabelText('From')).toHaveValue('2026-08-01')
    expect(screen.getByLabelText('Account')).toHaveValue('2')
    const [url] = requestedUrls(fetchMock, transactionsPath)
    expect(url.searchParams.get('account_id')).toBe('2')
    expect(url.searchParams.get('from_date')).toBe('2026-07-31T22:00:00.000')
  })

  it('evaluates the direction against the filtered account', async () => {
    mockApi({ '/api/v1/client/1': json(alice), [transactionsPath]: json(history) })
    renderAt('/clients/1?account=2')

    await screen.findByLabelText('Incoming total')

    expect(within(rowOf('15 Aug 2026, 11:00')).getByText('+1,000')).toBeInTheDocument()
  })

  it('reloads the transactions and updates the URL when the filter changes', async () => {
    const fetchMock = mockApi({ '/api/v1/client/1': json(alice), [transactionsPath]: json(history) })
    renderAt('/clients/1')
    await screen.findByLabelText('Incoming total')

    await userEvent.selectOptions(screen.getByLabelText('Account'), 'Alice - Savings')

    await screen.findByLabelText('Incoming total')
    expect(screen.getByTestId('location')).toHaveTextContent('/clients/1?account=2')
    const urls = requestedUrls(fetchMock, transactionsPath)
    expect(urls.at(-1)!.searchParams.get('account_id')).toBe('2')

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/clients\/1$/)
  })

  it('refuses a range where "From" is after "To" and sends no request for it', async () => {
    const fetchMock = mockApi({ '/api/v1/client/1': json(alice), [transactionsPath]: json(history) })
    renderAt('/clients/1?from=2026-09-01&to=2026-08-01')

    expect(await screen.findByRole('alert')).toHaveTextContent('"From" must not be after "To".')
    expect(requestedUrls(fetchMock, transactionsPath)).toHaveLength(0)
  })

  it('tells the user when nothing matches the filter', async () => {
    mockApi({
      '/api/v1/client/1': json(alice),
      [transactionsPath]: json({ summary: { total_incoming: 0, total_outgoing: 0 }, transactions: [] }),
    })
    renderAt('/clients/1?from=2026-01-01')

    expect(await screen.findByText('No transactions match the filter.')).toBeInTheDocument()
  })

  it('shows an error and loads the transactions again on retry', async () => {
    mockApi({ '/api/v1/client/1': json(alice), [transactionsPath]: [networkError(), json(history)] })
    renderAt('/clients/1')

    expect(await screen.findByText('Transactions could not be loaded.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByLabelText('Incoming total')).toBeInTheDocument()
  })
})
