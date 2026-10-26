import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { json, mockApi, pending, renderAt } from '@/test/utils'

const alice = {
  id: 1,
  name: 'Alice',
  national_number: '900101/1234',
  accounts: [
    { id: 1, name: 'Alice - Cash', balance: 1000, type: 'CASH', client_id: 1 },
    { id: 2, name: 'Alice - Savings', balance: 5000, type: 'SAVINGS', client_id: 1 },
  ],
}

const noTransactions = json({ summary: { total_incoming: 0, total_outgoing: 0 }, transactions: [] })

describe('ClientDetailPage', () => {
  it('shows a loading state while the client is being loaded', () => {
    mockApi({ '/api/v1/client/1': pending })
    renderAt('/clients/1')

    expect(screen.getByRole('status', { name: 'Loading client' })).toBeInTheDocument()
  })

  it('shows the client data and all their accounts', async () => {
    const fetchMock = mockApi({ '/api/v1/client/1': json(alice), '/api/v1/clients/1/transactions': noTransactions })
    renderAt('/clients/1')

    expect(await screen.findByRole('heading', { name: 'Alice' })).toBeInTheDocument()
    expect(screen.getByText('900101/1234')).toBeInTheDocument()
    const savingsRow = screen.getByRole('cell', { name: 'Alice - Savings' }).closest('tr')!
    expect(within(savingsRow).getByText('SAVINGS')).toBeInTheDocument()
    expect(within(savingsRow).getByText('5,000')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Alice - Cash' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/client/1', expect.anything())
  })

  it('tells the user when the client has no accounts and does not ask for transactions', async () => {
    const fetchMock = mockApi({ '/api/v1/client/1': json({ ...alice, accounts: [] }) })
    renderAt('/clients/1')

    expect(await screen.findByText('The client has no accounts.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Transactions' })).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('shows not found when the API answers 404', async () => {
    mockApi({ '/api/v1/client/999': json({ detail: 'Client not found' }, 404) })
    renderAt('/clients/999')

    expect(await screen.findByRole('heading', { name: 'Client not found.' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('shows not found for an invalid id without calling the API', () => {
    const fetchMock = mockApi({})
    renderAt('/clients/abc')

    expect(screen.getByRole('heading', { name: 'Client not found.' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows an error and loads the client again on retry', async () => {
    mockApi({
      '/api/v1/client/1': [json({ detail: 'Internal Server Error' }, 500), json(alice)],
      '/api/v1/clients/1/transactions': noTransactions,
    })
    renderAt('/clients/1')

    expect(await screen.findByText('The client could not be loaded.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { name: 'Alice' })).toBeInTheDocument()
  })

  it('goes back to the client list', async () => {
    mockApi({
      '/api/v1/client/1': json(alice),
      '/api/v1/clients/1/transactions': noTransactions,
      '/api/v1/client': json([]),
    })
    renderAt('/clients/1')

    await userEvent.click(await screen.findByRole('link', { name: 'Back to list' }))

    expect(await screen.findByRole('heading', { name: 'Clients' })).toBeInTheDocument()
  })
})
