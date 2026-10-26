import { getJson } from '@/api/http'
import type { Client, ClientDetail } from '@/types/client'

export function getClients(signal?: AbortSignal): Promise<Client[]> {
  return getJson<Client[]>('/client', signal)
}

export function getClient(id: number, signal?: AbortSignal): Promise<ClientDetail> {
  return getJson<ClientDetail>(`/client/${id}`, signal)
}
