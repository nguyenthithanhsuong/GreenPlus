/** Only write normalized, server-geocoded coordinates when an address is supplied/changed. */
export async function verifiedUserAddress(raw, geocode, hint) {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('Vui lòng nhập địa chỉ đầy đủ và xác minh vị trí trước khi lưu.');
  }
  const location = await geocode(raw.trim(), hint);
  if (!Number.isFinite(location?.latitude) || !Number.isFinite(location?.longitude)) {
    throw new Error('Không thể xác minh tọa độ địa chỉ.');
  }
  return { address: raw.trim(), latitude: location.latitude, longitude: location.longitude };
}
