import { describe, expect, it } from 'vitest'
import { ApiError, getClient, getClients } from '@/api/clients'
import { jsonResponse, mockFetch } from '@/test/utils'

describe('clients API', () => {
  it('loads the clients from the singular client endpoint', async () => {
    const fetchMock = mockFetch(jsonResponse([{ id: 1, name: 'Alice', national_number: '900101/1234' }]))

    await expect(getClients()).resolves.toEqual([{ id: 1, name: 'Alice', national_number: '900101/1234' }])
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/client', expect.anything())
  })

  it('loads one client by its id', async () => {
    const fetchMock = mockFetch(jsonResponse({ id: 2, name: 'Bob', national_number: '850515/5678', accounts: [] }))

    await expect(getClient(2)).resolves.toMatchObject({ id: 2, accounts: [] })
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/client/2', expect.anything())
  })

  it('turns a non-OK response into an ApiError carrying the status', async () => {
    mockFetch(jsonResponse({ detail: 'Client not found' }, 404))

    const error = await getClient(999).catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toHaveProperty('status', 404)
  })
})
