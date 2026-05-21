"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, Boxes, Clock3, Loader2, PackageSearch, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import AdminShell from "../shared/AdminShell";

type MonthlyTrend = {
  month: number;
  revenue: number;
  importCost: number;
  profit: number;
};

type FinancialSummary = {
  totalRevenue: number;
  totalImportCost: number;
  totalProfit: number;
  totalTransactions: number;
  profitMargin: number;
  paidPayments: number;
  batchImports: number;
};

type FinancialTransaction = {
  id: string;
  kind: "payment" | "batch_import";
  title: string;
  description: string;
  amount: number;
  occurredAt: string;
  status: string;
  referenceId: string;
  sourceLabel: string;
};

type FinancialReportResponse = {
  summary: FinancialSummary;
  monthlyTrend: MonthlyTrend[];
  transactions: FinancialTransaction[];
};

const monthLabels = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value) + " đ";

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const FinancialReport = () => {
  const [report, setReport] = useState<FinancialReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "payment" | "batch_import">("all");

  useEffect(() => {
    let mounted = true;

    const loadReport = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/reports/financial", { cache: "no-store" });
        const data = (await response.json()) as FinancialReportResponse & { error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Không thể tải báo cáo tài chính");
        }

        if (mounted) {
          setReport(data);
        }
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Không thể tải báo cáo tài chính");
          setReport(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadReport();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredTransactions = useMemo(() => {
    const transactions = report?.transactions ?? [];
    const keyword = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      if (activeFilter !== "all" && transaction.kind !== activeFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return [transaction.title, transaction.description, transaction.referenceId, transaction.sourceLabel, transaction.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [activeFilter, report?.transactions, search]);

  const monthlyTrend = report?.monthlyTrend ?? Array.from({ length: 12 }, (_, month) => ({
    month,
    revenue: 0,
    importCost: 0,
    profit: 0,
  }));

  const maxTrendValue = Math.max(...monthlyTrend.map((item) => Math.max(item.revenue, item.importCost, item.profit)), 1);

  return (
    <AdminShell
      title="Báo cáo tài chính"
      description="Tổng hợp doanh thu, giá nhập và lợi nhuận theo dữ liệu thực từ batches và payments."
      searchPlaceholder="Tìm kiếm giao dịch, lô hàng, thanh toán..."
    >
      <div className="space-y-6">
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Tổng Doanh Thu"
            value={report ? formatCurrency(report.summary.totalRevenue) : "0 đ"}
            note="Tổng tiền thanh toán đã ghi nhận"
            icon={<Banknote className="h-4 w-4 text-emerald-600" />}
            accent="bg-emerald-50"
          />
          <MetricCard
            title="Giá Nhập"
            value={report ? formatCurrency(report.summary.totalImportCost) : "0 đ"}
            note="Tổng chi phí nhập lô hàng"
            icon={<Boxes className="h-4 w-4 text-blue-600" />}
            accent="bg-blue-50"
          />
          <MetricCard
            title="Lợi Nhuận"
            value={report ? formatCurrency(report.summary.totalProfit) : "0 đ"}
            note="Doanh thu trừ giá nhập"
            icon={<TrendingUp className="h-4 w-4 text-violet-600" />}
            accent="bg-violet-50"
          />
          <MetricCard
            title="Tổng Số"
            value={report ? report.summary.totalTransactions.toLocaleString("vi-VN") : "0"}
            note="Tổng số giao dịch từ batches và payments"
            icon={<ReceiptText className="h-4 w-4 text-amber-600" />}
            accent="bg-amber-50"
          />
          <MetricCard
            title="Tỷ Suất Lợi Nhuận"
            value={report ? `${report.summary.profitMargin.toFixed(1)}%` : "0.0%"}
            note="Lợi nhuận trên doanh thu"
            icon={<Wallet className="h-4 w-4 text-fuchsia-600" />}
            accent="bg-fuchsia-50"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Xu hướng tài chính theo tháng</h3>
                <p className="mt-1 text-sm text-gray-500">So sánh doanh thu, giá nhập và lợi nhuận từ dữ liệu thật.</p>
              </div>

              <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Doanh thu
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Giá nhập
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> Lợi nhuận
                </span>
              </div>
            </div>

            <div className="relative min-h-[280px] rounded-2xl bg-gradient-to-b from-gray-50 to-white p-4">
              <div className="absolute inset-y-4 left-0 flex w-12 flex-col justify-between text-[11px] text-gray-400">
                {[maxTrendValue, maxTrendValue * 0.75, maxTrendValue * 0.5, maxTrendValue * 0.25, 0].map((value) => (
                  <div key={value.toFixed(2)} className="flex items-center gap-2">
                    <span className="w-9 text-right">{formatCurrency(Math.round(value))}</span>
                  </div>
                ))}
              </div>

              <div className="ml-14 flex h-[250px] items-end gap-3 overflow-hidden pr-2">
                {monthlyTrend.map((item, index) => {
                  const revenueHeight = Math.max((item.revenue / maxTrendValue) * 100, item.revenue > 0 ? 6 : 0);
                  const importHeight = Math.max((item.importCost / maxTrendValue) * 100, item.importCost > 0 ? 6 : 0);
                  const profitHeight = Math.max((item.profit / maxTrendValue) * 100, item.profit > 0 ? 6 : 0);

                  return (
                    <div key={item.month} className="flex flex-1 flex-col items-center gap-3">
                      <div className="flex h-[220px] w-full items-end justify-center gap-2 rounded-xl bg-white/60 px-2 py-2">
                        <div className="flex h-full flex-1 items-end justify-center">
                          <div
                            className="w-full max-w-[28px] rounded-t-lg bg-emerald-500 transition-all"
                            style={{ height: `${revenueHeight}%` }}
                            title={`Doanh thu ${monthLabels[item.month]}: ${formatCurrency(item.revenue)}`}
                          />
                        </div>
                        <div className="flex h-full flex-1 items-end justify-center">
                          <div
                            className="w-full max-w-[28px] rounded-t-lg bg-blue-500 transition-all"
                            style={{ height: `${importHeight}%` }}
                            title={`Giá nhập ${monthLabels[item.month]}: ${formatCurrency(item.importCost)}`}
                          />
                        </div>
                        <div className="flex h-full flex-1 items-end justify-center">
                          <div
                            className="w-full max-w-[28px] rounded-t-lg bg-violet-500 transition-all"
                            style={{ height: `${profitHeight}%` }}
                            title={`Lợi nhuận ${monthLabels[item.month]}: ${formatCurrency(item.profit)}`}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-500">{monthLabels[index]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Thanh toán hoàn tất</h3>
                <p className="mt-1 text-sm text-gray-500">Chỉ tính các giao dịch có trạng thái paid.</p>
              </div>
              <Clock3 className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              <StatRow label="Đã thanh toán" value={report?.summary.paidPayments ?? 0} />
              <StatRow label="Số lô nhập" value={report?.summary.batchImports ?? 0} />
              <StatRow label="Biên lợi nhuận" value={report ? `${report.summary.profitMargin.toFixed(1)}%` : "0.0%"} />
            </div>

            <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-900">Cách tính</p>
              <p className="mt-2 leading-6">
                Doanh thu lấy từ <span className="font-medium text-gray-900">payments.status = paid</span>. Giá nhập là tổng
                <span className="font-medium text-gray-900"> batches.quantity x batches.import_price</span>.
              </p>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Lịch sử giao dịch</h3>
              <p className="mt-1 text-sm text-gray-500">Gộp từ batches và payments theo thời gian thực.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1">
                {[
                  { key: "all", label: "Tất cả" },
                  { key: "payment", label: "Thanh toán" },
                  { key: "batch_import", label: "Nhập lô" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveFilter(item.key as typeof activeFilter)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      activeFilter === item.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 shadow-sm">
                <PackageSearch className="h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm giao dịch"
                  className="w-44 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />
              </label>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 py-14 text-sm text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải báo cáo tài chính...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-500">
              Không có giao dịch phù hợp bộ lọc.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Loại</th>
                    <th className="px-4 py-3">Nội dung</th>
                    <th className="px-4 py-3">Tham chiếu</th>
                    <th className="px-4 py-3">Số tiền</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            transaction.kind === "payment"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {transaction.sourceLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{transaction.title}</div>
                        <div className="mt-1 text-xs text-gray-500">{transaction.description}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-600">{transaction.referenceId}</td>
                      <td className="px-4 py-4 font-semibold text-gray-900">{formatCurrency(transaction.amount)}</td>
                      <td className="px-4 py-4 text-gray-600">{transaction.status}</td>
                      <td className="px-4 py-4 text-gray-600">{formatDateTime(transaction.occurredAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
};

function MetricCard({
  title,
  value,
  note,
  icon,
  accent,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`rounded-full p-2 ${accent}`}>{icon}</div>
      </div>
      <h3 className="mb-2 text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-xs text-gray-500">{note}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{typeof value === "number" ? value.toLocaleString("vi-VN") : value}</span>
    </div>
  );
}

export default FinancialReport;