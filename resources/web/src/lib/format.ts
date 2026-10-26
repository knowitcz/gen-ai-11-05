const amountFormat = new Intl.NumberFormat('en-US')

// The API returns plain integers without a currency, so none is shown.
export function formatAmount(value: number): string {
  return amountFormat.format(value)
}
