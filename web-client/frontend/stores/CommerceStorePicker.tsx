"use client";

import StoreSelector from "./StoreSelector";
import { useSelectedStoreId } from "@/lib/stores/use-selected-store";

/** Reusable mobile-first store switcher for cart, checkout and order history. */
export default function CommerceStorePicker() {
  const storeId = useSelectedStoreId();
  return (
    <div className="mx-4 mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/90 px-3 py-2">
      <StoreSelector />
      {!storeId && (
        <p role="status" className="px-2 pb-1 text-center text-xs text-amber-800">
          Vui lòng chọn cửa hàng để xem giỏ hàng và đơn hàng của cửa hàng đó.
        </p>
      )}
    </div>
  );
}
