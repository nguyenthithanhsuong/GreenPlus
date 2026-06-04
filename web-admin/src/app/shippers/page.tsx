"use client";

import { Suspense } from "react";
import ShipperManagement from "../../../frontend/shippers/ShipperManagement";

export default function ShippersPage() {
  return (
    <Suspense fallback={null}>
      <ShipperManagement />
    </Suspense>
  );
}
