"use client";

import { Suspense } from "react";
import Complaints from "../../../frontend/complaints/components/Complaints";

export default function ComplaintsPage() {
  return (
    <Suspense fallback={null}>
      <Complaints />
    </Suspense>
  );
}
