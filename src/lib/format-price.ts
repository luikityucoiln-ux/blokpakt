const zeroDecimalCurrencies = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
  'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
]);

const threeDecimalCurrencies = new Set(['bhd', 'jod', 'kwd', 'omr', 'tnd']);

function currencyDivisor(currency: string): number {
  if (zeroDecimalCurrencies.has(currency)) return 1;
  if (threeDecimalCurrencies.has(currency)) return 1000;
  return 100;
}

export function formatPrice(amount: number, currency = 'usd'): string {
  const normalizedCurrency = currency.toLowerCase();
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: normalizedCurrency.toUpperCase(),
  }).format(amount / currencyDivisor(normalizedCurrency));
}
