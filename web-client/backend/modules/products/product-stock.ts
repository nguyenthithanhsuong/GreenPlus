/**
 * A batch remains sellable through its expiry calendar day in Vietnam.
 * Use one rule for product cards, product detail and cart validation.
 */
export function isSellableBatch(
  status: string | null,
  expireDate: string | null,
  quantityAvailable: number,
  now: Date = new Date(),
): boolean {
  if (status !== "available" || !Number.isFinite(quantityAvailable) || quantityAvailable <= 0) {
    return false;
  }
  const expiryDay = expireDate?.slice(0, 10);
  if (!expiryDay || !/^\d{4}-\d{2}-\d{2}$/.test(expiryDay)) {
    return false;
  }
  const todayInVietnam = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return expiryDay >= todayInVietnam;
}
