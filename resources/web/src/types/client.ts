export type AccountType = 'CASH' | 'SAVINGS'

export interface Account {
  id: number
  name: string
  balance: number
  type: AccountType
  client_id: number
}

export interface Client {
  id: number
  name: string
  national_number: string
}

export interface ClientDetail extends Client {
  accounts: Account[]
}
