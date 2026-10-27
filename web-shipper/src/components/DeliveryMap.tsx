
"use client";

type DeliveryMapProps = {
  pickupAddress: string;
  deliveryAddress: string;
};

export default function DeliveryMap({
  pickupAddress,
  deliveryAddress,
}: DeliveryMapProps) {
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

  if (!apiKey) {
    return <p>Chưa cấu hình Google Maps API Key.</p>;
  }

  if (!pickupAddress || !deliveryAddress) {
    return <p>Đơn hàng chưa có đủ địa chỉ giao nhận.</p>;
  }

  const params = new URLSearchParams({
    key: apiKey,
    origin: pickupAddress,
    destination: deliveryAddress,
    mode: "driving",
  });

  const mapUrl =
    `https://www.google.com/maps/embed/v1/directions?${params}`;

  return (
    <div className="overflow-hidden rounded-2xl border">
      <iframe
        title="Bản đồ tuyến đường giao hàng"
        src={mapUrl}
        width="100%"
        height="450"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
