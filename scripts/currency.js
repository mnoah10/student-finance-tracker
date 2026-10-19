export function formatAmount(amount, settings, currencyCode = settings.baseCurrency) {
    const currency = currencyCode === settings.baseCurrency
        ? null
        : settings.otherCurrencies.find(({ code }) => code === currencyCode);
    const value = currency ? amount / currency.rate : amount;
    return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: currency ? 2 : 0,
    }).format(value);
}
