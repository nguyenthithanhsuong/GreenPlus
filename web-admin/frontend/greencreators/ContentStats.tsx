"use client";

import { CheckCircle2, Clock, MessageSquareText, XCircle } from "lucide-react";

type ContentStatsProps = {
  totalPosts: number;
  pendingPosts: number;
  approvedPosts: number;
  rejectedPosts: number;
  totalComments: number;
  totalInteractions: number;
};

function StatCard({
  label,
  value,
  icon,
  valueClassName,
  wrapperClassName,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  valueClassName: string;
  wrapperClassName: string;
}) {
  return (
    <div className={wrapperClassName}>
      <div className="rounded-full bg-white/80 p-3 shadow-sm">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <h3 className={`text-2xl font-bold ${valueClassName}`}>{value.toLocaleString("vi-VN")}</h3>
      </div>
    </div>
  );
}

const ContentStats = ({
  totalPosts,
  pendingPosts,
  approvedPosts,
  rejectedPosts,
  totalComments,
  totalInteractions,
}: ContentStatsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Bài chờ duyệt"
        value={pendingPosts}
        icon={<Clock className="h-6 w-6 text-yellow-600" />}
        valueClassName="text-gray-900"
        wrapperClassName="flex items-center gap-4 rounded-2xl border border-yellow-100 bg-yellow-50 p-5 shadow-sm"
      />

      <StatCard
        label="Bài đã duyệt"
        value={approvedPosts}
        icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
        valueClassName="text-gray-900"
        wrapperClassName="flex items-center gap-4 rounded-2xl border border-emerald-50 bg-white p-5 shadow-sm"
      />

      <StatCard
        label="Bài bị từ chối"
        value={rejectedPosts}
        icon={<XCircle className="h-6 w-6 text-red-600" />}
        valueClassName="text-gray-900"
        wrapperClassName="flex items-center gap-4 rounded-2xl border border-red-50 bg-white p-5 shadow-sm"
      />

      <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="rounded-full bg-slate-50 p-3 shadow-sm">
          <MessageSquareText className="h-6 w-6 text-slate-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Tổng bài / bình luận / tương tác</p>
          <h3 className="text-2xl font-bold text-gray-900">{totalPosts.toLocaleString("vi-VN")}</h3>
          <p className="mt-1 text-xs text-gray-500">
            {totalComments.toLocaleString("vi-VN")} bình luận • {totalInteractions.toLocaleString("vi-VN")} tương tác
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContentStats;