import { CheckCircle2, Clock3, PackageCheck, Truck } from "lucide-react";
import type { DeliveryStatus } from "../../lib/delivery-types";

const variants = {
  assigned: { label: "Chờ lấy hàng", icon: Clock3, className: "gp-status-waiting" },
  picked_up: { label: "Đã lấy hàng", icon: PackageCheck, className: "gp-status-progress" },
  delivering: { label: "Đang giao", icon: Truck, className: "gp-status-progress" },
  delivered: { label: "Đã giao", icon: CheckCircle2, className: "gp-status-success" },
} as const;

export default function StatusBadge({ status }: { status: DeliveryStatus }) {
  const item = variants[status];
  const Icon = item.icon;
  return <span className={`gp-status ${item.className}`}><Icon size={14} />{item.label}</span>;
}
