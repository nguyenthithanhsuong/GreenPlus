import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../../backend/core/supabase";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";
import { toErrorMessage } from "../../../../../backend/core/errors";

type BatchReportRow = {
  batch_id: string;
  quantity: number | string | null;
  import_price: number | string | null;
  created_at: string | null;
  products?: {
    name?: string | null;
  } | null;
  suppliers?: {
    name?: string | null;
  } | null;
};

type PaymentReportRow = {
  payment_id: string;
  order_id: string;
  method: string;
  status: string;
  amount: number | string;
  payment_date: string | null;
  orders?: {
    order_id?: string | null;
    order_date?: string | null;
    users?: {
      name?: string | null;
    } | null;
  } | null;
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

type MonthlyTrend = {
  month: number;
  revenue: number;
  importCost: number;
  profit: number;
};

const emptyTrend = (): MonthlyTrend[] => Array.from({ length: 12 }, (_, month) => ({ month, revenue: 0, importCost: 0, profit: 0 }));

export async function GET() {
  logger.info("Get financial report attempt");

  try {
    const start = Date.now();
    const [batchesResult, paymentsResult] = await Promise.all([
      supabaseServer
        .from("batches")
        .select("batch_id,quantity,import_price,created_at,products(name),suppliers(name)")
        .order("created_at", { ascending: false }),
      supabaseServer
        .from("payments")
        .select("payment_id,order_id,method,status,amount,payment_date,orders(order_id,order_date,users(name))")
        .order("payment_date", { ascending: false, nullsFirst: false }),
    ]);

    if (batchesResult.error) throw new Error(batchesResult.error.message);
    if (paymentsResult.error) throw new Error(paymentsResult.error.message);

    const batches = ((batchesResult.data ?? []) as BatchReportRow[]).map((batch) => ({
      ...batch,
      quantity: Number(batch.quantity ?? 0),
      import_price: batch.import_price === null ? null : Number(batch.import_price),
    }));

    const payments = ((paymentsResult.data ?? []) as PaymentReportRow[]).map((payment) => ({
      ...payment,
      amount: Number(payment.amount ?? 0),
    }));

    const monthlyTrend = emptyTrend();
    const transactions: FinancialTransaction[] = [];

    let totalImportCost = 0;
    let totalRevenue = 0;
    let paidPayments = 0;

    for (const batch of batches) {
      const importCost = Number(batch.import_price ?? 0) * Number(batch.quantity ?? 0);
      totalImportCost += importCost;

      const occurredAt = batch.created_at ?? new Date().toISOString();
      const month = new Date(occurredAt).getMonth();
      if (Number.isInteger(month) && month >= 0 && month < 12) {
        monthlyTrend[month].importCost += importCost;
      }

      transactions.push({
        id: `batch-${batch.batch_id}`,
        kind: "batch_import",
        title: batch.products?.name ? `Nhập lô ${batch.products.name}` : "Nhập lô hàng",
        description: batch.suppliers?.name
          ? `Nhà cung cấp: ${batch.suppliers.name}`
          : `Số lượng: ${Number(batch.quantity ?? 0).toLocaleString("vi-VN")}`,
        amount: importCost,
        occurredAt,
        status: "completed",
        referenceId: batch.batch_id,
        sourceLabel: "Nhập lô",
      });
    }

    for (const payment of payments) {
      const paymentStatus = payment.status?.toLowerCase() ?? "pending";
      const occurredAt = payment.payment_date ?? payment.orders?.order_date ?? new Date().toISOString();
      const month = new Date(payment.payment_date ?? occurredAt).getMonth();

      if (paymentStatus === "paid") {
        totalRevenue += payment.amount;
        paidPayments += 1;

        if (Number.isInteger(month) && month >= 0 && month < 12) {
          monthlyTrend[month].revenue += payment.amount;
        }
      }

      transactions.push({
        id: `payment-${payment.payment_id}`,
        kind: "payment",
        title: `Thanh toán ${payment.method.toUpperCase()}`,
        description: payment.orders?.users?.name
          ? `Đơn hàng của ${payment.orders.users.name}`
          : `Mã đơn: ${payment.order_id}`,
        amount: payment.amount,
        occurredAt,
        status: paymentStatus,
        referenceId: payment.order_id,
        sourceLabel: "Thanh toán",
      });
    }

    const totalProfit = totalRevenue - totalImportCost;
    for (const trend of monthlyTrend) {
      trend.profit = trend.revenue - trend.importCost;
    }

    const summary: FinancialSummary = {
      totalRevenue,
      totalImportCost,
      totalProfit,
      totalTransactions: batches.length + payments.length,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      paidPayments,
      batchImports: batches.length,
    };

    transactions.sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());

    logger.info("Get financial report success", { duration_ms: Date.now() - start });

    return NextResponse.json({ summary, monthlyTrend, transactions }, { status: 200 });
  } catch (error) {
    logger.error("Get financial report unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}