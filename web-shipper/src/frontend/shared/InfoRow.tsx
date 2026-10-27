import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Reused by profile and order lookup: identical icon, label and value spacing. */
export default function InfoRow({ icon: Icon, label, children }: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="gp-info-row">
      <span className="gp-info-row-icon"><Icon size={18} /></span>
      <div className="min-w-0 flex-1"><dt>{label}</dt><dd>{children}</dd></div>
    </div>
  );
}
