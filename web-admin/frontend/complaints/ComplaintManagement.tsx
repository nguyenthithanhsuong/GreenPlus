"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import AdminShell from "../shared/AdminShell";
import ComplaintStats from "./ComplaintStats";
import ComplaintTable from "./ComplaintTable";
import ComplaintDrawer from "./ComplaintDrawer";
import RejectReasonDialog from "./RejectReasonDialog";
import ConfirmActionDialog from "../users/ConfirmActionDialog";
import { ComplaintRow, ComplaintStatus } from "../../backend/modules/complaints/complaint-management.types";

type ComplaintStatusFilter = "all" | ComplaintStatus;

const normalizeText = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

const ComplaintManagement = () => {
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingComplaintId, setSavingComplaintId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<ComplaintStatusFilter>("all");
  const [searchValue, setSearchValue] = useState("");

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/complaints", { cache: "no-store" });
      const data = (await response.json()) as { items?: ComplaintRow[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải danh sách khiếu nại");
      }

      setComplaints(Array.isArray(data.items) ? data.items : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải danh sách khiếu nại");
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadComplaints();
  }, [loadComplaints]);

  const updateStatus = useCallback(
    async (complaint: ComplaintRow, status: ComplaintStatus, rejectReason?: string) => {
      setSavingComplaintId(complaint.complaint_id);
      setError(null);

      try {
        const response = await fetch(`/api/complaints/${encodeURIComponent(complaint.complaint_id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, rejectReason }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Không thể cập nhật trạng thái khiếu nại");
        }

        await loadComplaints();
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Không thể cập nhật trạng thái khiếu nại");
      } finally {
        setSavingComplaintId(null);
      }
    },
    [loadComplaints]
  );

  const filteredComplaints = useMemo(() => {
    const keyword = normalizeText(searchValue);

    return complaints.filter((complaint) => {
      const statusMatch = activeStatus === "all" || complaint.status === activeStatus;
      if (!statusMatch) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchable = [
        complaint.user_name,
        complaint.order_id,
        complaint.type,
        complaint.description,
        complaint.reject_reason,
      ]
        .map((value) => normalizeText(value))
        .join(" ");

      return searchable.includes(keyword);
    });
  }, [activeStatus, complaints, searchValue]);

  const stats = useMemo(() => {
    const pendingCount = complaints.filter((item) => item.status === "pending").length;
    const resolvedCount = complaints.filter((item) => item.status === "resolved").length;
    const rejectedCount = complaints.filter((item) => item.status === "rejected").length;

    const refundOrReturnCount = complaints.filter((item) => {
      const normalized = normalizeText(item.type);
      return normalized.includes("hoàn") || normalized.includes("refund") || normalized.includes("đổi") || normalized.includes("trả");
    }).length;

    const feedbackCount = complaints.length - refundOrReturnCount;

    return {
      pendingCount,
      resolvedCount,
      rejectedCount,
      refundOrReturnCount,
      feedbackCount,
    };
  }, [complaints]);

  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRow | null>(null);
  const [resolveComplaint, setResolveComplaint] = useState<ComplaintRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const handleReject = useCallback((complaint: ComplaintRow) => {
    setSelectedComplaint(complaint);
    setRejectOpen(true);
  }, []);

  const handleResolve = useCallback((complaint: ComplaintRow) => {
    setResolveComplaint(complaint);
  }, []);

  const handleView = useCallback((complaint: ComplaintRow) => {
    setSelectedComplaint(complaint);
    setDrawerOpen(true);
  }, []);

  const pageActions = (
    <button
      type="button"
      onClick={() => void loadComplaints()}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
      disabled={loading || Boolean(savingComplaintId)}
    >
      <RefreshCw className="h-4 w-4" />
      Tải lại
    </button>
  );

  return (
    <AdminShell
      title="Quản lý khiếu nại"
      description="Theo dõi và xử lý các khiếu nại của khách hàng theo đơn hàng, loại yêu cầu và trạng thái xử lý."
      searchPlaceholder="Tìm kiếm khiếu nại theo mã đơn, người gửi..."
      pageActions={pageActions}
    >
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <ComplaintStats {...stats} />

      <ComplaintTable
        complaints={filteredComplaints}
        loading={loading}
        savingComplaintId={savingComplaintId}
        activeStatus={activeStatus}
        searchValue={searchValue}
        onStatusChange={setActiveStatus}
        onSearchChange={setSearchValue}
        onViewComplaint={handleView}
        onResolve={handleResolve}
        onReject={handleReject}
      />

      <ComplaintDrawer open={drawerOpen} complaint={selectedComplaint} onClose={() => setDrawerOpen(false)} />

      <ConfirmActionDialog
        open={Boolean(resolveComplaint)}
        title="Xác nhận xử lý khiếu nại"
        message="Đánh dấu khiếu nại này là đã giải quyết?"
        confirmLabel="Đã giải quyết"
        confirmVariant="warning"
        loading={Boolean(savingComplaintId)}
        onCancel={() => setResolveComplaint(null)}
        onConfirm={() => {
          if (!resolveComplaint) {
            return;
          }

          const complaint = resolveComplaint;
          setResolveComplaint(null);
          void updateStatus(complaint, "resolved");
        }}
      />

      <RejectReasonDialog
        open={rejectOpen}
        loading={Boolean(savingComplaintId)}
        initial={selectedComplaint?.reject_reason ?? ""}
        onCancel={() => setRejectOpen(false)}
        onConfirm={(reason) => {
          if (!selectedComplaint) return;
          setRejectOpen(false);
          void updateStatus(selectedComplaint, "rejected", reason);
        }}
      />
    </AdminShell>
  );
};

export default ComplaintManagement;
 
