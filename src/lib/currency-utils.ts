/**
 * Formats a numeric value into BRL currency format (e.g., 1500.5 -> "R$ 1.500,50").
 */
export function formatCurrencyBR(value: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "R$ 0,00";
  }
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Cleans a string to keep only valid currency characters (digits, comma, dot, minus).
 */
export function cleanCurrencyInput(value: string): string {
  if (!value) return "";
  // Keep only digits, commas, dots, and minus signs
  return value.replace(/[^\d,.-]/g, "");
}

/**
 * Parses a BRL currency string into a number (e.g., "R$ 1.500,50" -> 1500.5).
 */
export function parseCurrencyBR(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  
  // Clean R$, spaces, etc.
  let clean = String(value)
    .replace(/[R$\s]/g, "")
    .trim();
  
  if (!clean) return 0;
  
  // If there are both dots and commas (e.g. 1.500,50), remove dots and replace comma with dot
  if (clean.includes(",") && clean.includes(".")) {
    clean = clean.replace(/\./g, "").replace(",", ".");
  } else if (clean.includes(",")) {
    // Only comma, e.g. 1500,50
    clean = clean.replace(",", ".");
  } else if (clean.includes(".")) {
    // Only dot, e.g. 1500.50 or 1.500
    // Standardize thousands separator if it looks like BRL dot (e.g. "1.500" vs "1.5")
    const parts = clean.split(".");
    if (parts.length === 2 && parts[1].length === 3) {
      // Single dot followed by exactly 3 digits is usually thousands separator in BRL
      clean = clean.replace(/\./g, "");
    } else if (parts.length > 2) {
      // Multiple dots (like 1.500.000)
      clean = clean.replace(/\./g, "");
    }
  }
  
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}
