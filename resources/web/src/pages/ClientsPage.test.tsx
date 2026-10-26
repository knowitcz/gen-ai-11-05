import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { jsonResponse, mockFetch, mockPendingFetch, renderAt } from '@/test/utils'

const clients = [
  { id: 1, name: 'Alice', national_number: '900101/1234' },
  { id: 2, name: 'Bob', national_number: '850515/5678' },
]

describe('ClientsPage', () => {
  it('redirects the root to the client list', async () => {
    mockFetch(jsonResponse(clients))
    renderAt('/')

    expect(await screen.findByRole('heading', { name: 'Clients' })).toBeInTheDocument()
  })

  it('shows a loading state while the clients are being loaded', () => {
    mockPendingFetch()
    renderAt('/clients')

    expect(screen.getByRole('status', { name: 'Loading clients' })).toBeInTheDocument()
  })

  it('lists the clients with their number, name and national ID number', async () => {
    mockFetch(jsonResponse(clients))
    renderAt('/clients')

    const aliceRow = (await screen.findByText('Alice')).closest('tr')!
    expect(within(aliceRow).getByText('1')).toBeInTheDocument()
    expect(within(aliceRow).getByText('900101/1234')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('links every client to its detail', async () => {
    mockFetch(jsonResponse(clients))
    renderAt('/clients')

    const links = await screen.findAllByRole('link', { name: 'Detail' })
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/clients/1', '/clients/2'])
  })

  it('opens the detail when a row is clicked', async () => {
    mockFetch(
      jsonResponse(clients),
      jsonResponse({ ...clients[1], accounts: [] }),
    )
    renderAt('/clients')

    await userEvent.click(await screen.findByText('Bob'))

    expect(await screen.findByRole('heading', { name: 'Bob' })).toBeInTheDocument()
  })

  it('tells the user when there are no clients', async () => {
    mockFetch(jsonResponse([]))
    renderAt('/clients')

    expect(await screen.findByText('No clients found.')).toBeInTheDocument()
  })

  it('shows an error and loads the clients again on retry', async () => {
    const fetchMock = mockFetch(new TypeError('Failed to fetch'), jsonResponse(clients))
    renderAt('/clients')

    expect(await screen.findByText('Clients could not be loaded.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Alice')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
