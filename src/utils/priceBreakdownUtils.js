const moneyLine = (label, money, currency = 'ETB') => {
  if (!money) return null
  const amount = money.amount ?? money
  const n = Number(amount)
  if (!Number.isFinite(n) || n < 0) return null
  return {
    label,
    amount: n,
    currency: money.currency || currency,
  }
}

/**
 * Normalize booking_price_confirm breakdown (object or legacy passenger array).
 */
export const normalizePriceConfirmBreakdown = (data) => {
  const total = data?.total
  const currency = total?.currency || 'ETB'
  const bd = data?.breakdown

  if (Array.isArray(bd) && bd.length > 0) {
    return {
      mode: 'passengers',
      currency,
      total,
      passengers: bd,
      hasBreakdown: true,
    }
  }

  if (bd && typeof bd === 'object' && !Array.isArray(bd)) {
    const lines = [
      moneyLine('Base fare', bd.baseFare, currency),
      moneyLine('Taxes & fees', bd.taxes, currency),
      moneyLine('Surcharges', bd.surcharges, currency),
    ].filter(Boolean)

    const taxDetails = (Array.isArray(bd.taxDetails) ? bd.taxDetails : [])
      .map((t) =>
        moneyLine(
          t.label || t.name || t.code || 'Tax',
          { amount: t.amount, currency: t.currency },
          currency,
        ),
      )
      .filter(Boolean)

    return {
      mode: 'structured',
      currency,
      total,
      lines,
      taxDetails,
      hasBreakdown: lines.length > 0 || taxDetails.length > 0,
    }
  }

  return {
    mode: 'none',
    currency,
    total,
    lines: [],
    taxDetails: [],
    hasBreakdown: false,
  }
}
