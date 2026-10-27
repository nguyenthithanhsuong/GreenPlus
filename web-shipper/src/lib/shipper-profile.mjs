/** Contact fields only; never accept caller-supplied user_id, role, store_id, email or status. */
export function normalizeShipperProfile(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (Object.keys(raw).some((key) => !['name', 'phone', 'address'].includes(key))) return null;
  if (typeof raw.name !== 'string' || typeof raw.phone !== 'string' || typeof raw.address !== 'string') return null;
  const name = raw.name.trim().replace(/\s+/g, ' ');
  const phone = raw.phone.trim();
  const address = raw.address.trim();
  if (name.length < 2 || name.length > 100 || phone.length > 20 || address.length > 500) return null;
  if (phone && !/^\+?[0-9][0-9 .()-]{7,19}$/.test(phone)) return null;
  return { name, phone: phone || null, address: address || null };
}
