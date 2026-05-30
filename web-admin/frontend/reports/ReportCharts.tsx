"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { OrderListRow } from '../../backend/modules/orders/order-tracking.types';

const MONTH_LABELS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

const ReportCharts = () => {
  const [orders, setOrders] = useState<OrderListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/orders', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Không thể tải đơn hàng');
        if (mounted) setOrders(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setOrders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => { mounted = false; };
  }, []);

  const { revenueByMonth, profitByMonth, paymentDistribution } = useMemo(() => {
    const revenue = new Array(12).fill(0);
    const profit = new Array(12).fill(0);
    const payments: Record<string, number> = { vnpay: 0, momo: 0, cod: 0, bank_transfer: 0 };

    for (const o of orders) {
      if (!o.order_date) continue;
      const d = new Date(o.order_date);
      if (Number.isNaN(d.getTime())) continue;
      const m = d.getMonth();
      const amt = typeof o.total_amount === 'number' ? o.total_amount : Number(o.total_amount) || 0;
      revenue[m] += amt;
      profit[m] += Math.round(amt * 0.25);
      const method = o.payment_method ?? 'cod';
      payments[method] = (payments[method] || 0) + 1;
    }

    const totalPayments = Object.values(payments).reduce((a,b) => a + b, 0) || 1;
    const distribution = [
      { key: 'vnpay', label: 'VNPay', percent: Math.round((payments.vnpay / totalPayments) * 100) },
      { key: 'momo', label: 'MoMo', percent: Math.round((payments.momo / totalPayments) * 100) },
      { key: 'cod', label: 'Tiền mặt (COD)', percent: Math.round((payments.cod / totalPayments) * 100) },
      { key: 'bank_transfer', label: 'Thẻ tín dụng', percent: Math.round((payments.bank_transfer / totalPayments) * 100) },
    ];

    return { revenueByMonth: revenue, profitByMonth: profit, paymentDistribution: distribution };
  }, [orders]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-bold text-gray-900">Doanh Thu & Lợi Nhuận</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Doanh thu
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Lợi nhuận
            </div>
            <Link href="/reports" className="ml-4 text-sm text-gray-600 underline">Xem chi tiết</Link>
          </div>
        </div>

        <div className="flex-1 relative min-h-[250px] w-full">
          <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-400 pb-6">
            {[600, 500, 400, 300, 200, 100, 0].map((val) => (
              <div key={val} className="flex items-center w-full">
                <span className="w-8 text-right mr-3">{val}</span>
                <div className="flex-1 border-b border-gray-100 border-dashed"></div>
              </div>
            ))}
          </div>

          <div className="absolute inset-0 ml-11 mb-6">
            <svg viewBox="0 0 1000 250" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {(() => {
                const xs = [20, 100, 180, 260, 340, 420, 500, 580, 660, 740, 820, 900];
                const maxVal = Math.max(...revenueByMonth, ...profitByMonth, 1);
                return revenueByMonth.map((val, i) => {
                  const h = Math.round((val / maxVal) * 225);
                  const x = xs[i] ?? 20 + i * 80;
                  return <rect key={`r-${i}`} x={x} y={250 - h} width="40" height={h} fill="#22c55e" rx="4" />;
                });
              })()}

              {(() => {
                const xs = [40, 120, 200, 280, 360, 440, 520, 600, 680, 760, 840, 920];
                const maxVal = Math.max(...revenueByMonth, ...profitByMonth, 1);
                const points = profitByMonth.map((val, i) => {
                  const h = Math.round((val / maxVal) * 225);
                  const x = xs[i] ?? 40 + i * 80;
                  const y = 250 - h;
                  return { x, y };
                });
                const d = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                return (
                  <>
                    <path d={d} fill="none" stroke="#3b82f6" strokeWidth="3" />
                    {points.map((pt, i) => (
                      <circle key={`pt-${i}`} cx={pt.x} cy={pt.y} r="4" fill="white" stroke="#3b82f6" strokeWidth="2.5" />
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
          
          <div className="absolute bottom-0 left-11 right-0 flex justify-between text-xs text-gray-400 pl-4 pr-10">
            {['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900">Phương thức thanh toán</h3>
          <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-5 h-5" /></button>
        </div>
        
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="relative w-48 h-48 mb-8">
            <svg viewBox="-3 -3 42 42" className="w-full h-full transform -rotate-90" style={{ overflow: 'visible' }}>
              {(() => {
                const radius = 15.91549430918954;
                const colors: Record<string,string> = { vnpay: '#3b82f6', momo: '#ec4899', cod: '#10b981', bank_transfer: '#6b7280' };
                let cumulative = 0;
                return paymentDistribution.map((seg, idx) => {
                  const dash = `${seg.percent} ${100 - seg.percent}`;
                  const offset = 25 - cumulative;
                  cumulative += seg.percent;
                  return (
                    <circle
                      key={seg.key}
                      stroke={colors[seg.key] ?? '#9ca3af'}
                      strokeWidth="6"
                      strokeDasharray={dash}
                      strokeDashoffset={String(offset)}
                      strokeLinecap="butt"
                      fill="none"
                      cx="18"
                      cy="18"
                      r={String(radius)}
                    />
                  );
                });
              })()}
            </svg>
          </div>

          <div className="w-full space-y-3">
            {paymentDistribution.map((seg) => {
              const color = seg.key === 'vnpay' ? 'bg-blue-500' : seg.key === 'momo' ? 'bg-pink-500' : seg.key === 'cod' ? 'bg-emerald-500' : 'bg-gray-500';
              return (
                <div key={seg.key} className="flex justify-between items-center text-sm">
                  <div className="flex items-center"><span className={`${color} w-2.5 h-2.5 rounded-full mr-2`}></span><span className="text-gray-600">{seg.label}</span></div>
                  <span className="font-bold text-gray-900">{seg.percent}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCharts;