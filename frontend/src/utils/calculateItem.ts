/**
 * Safe formula evaluator for expressions like "28 x 2 x 190"
 * Tokenizes on 'x' and multiplies all numeric values.
 * Returns NaN on invalid input.
 */
export function parseFormula(formula: string): number {
  if (!formula || formula.trim() === '') return NaN;
  const parts = formula.toLowerCase().split('x').map(s => s.trim());
  let result = 1;
  for (const part of parts) {
    const num = parseFloat(part);
    if (isNaN(num)) return NaN;
    result *= num;
  }
  return result;
}

/**
 * Calculate item amount from formula, or rate * qty, or direct amount.
 */
export function calculateAmount(params: {
  formula?: string;
  rate?: number;
  quantity?: number;
  amount?: number;
}): number {
  const { formula, rate, quantity, amount } = params;

  if (formula && formula.trim()) {
    const val = parseFormula(formula);
    if (!isNaN(val)) return val;
  }

  if (rate != null && quantity != null && rate > 0 && quantity > 0) {
    return rate * quantity;
  }

  return amount ?? 0;
}
