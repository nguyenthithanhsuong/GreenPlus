"use client";

import React, { useEffect, useState } from "react";

type GroupBuy = {
  group_id: string;
  product_id: string;
  product_name: string | null;
  leader_id: string;
  target_quantity: number;
  current_quantity: number;
  min_quantity: number;
  discount_price: number | null;
  deadline: string;
  status: string;
  remaining_quantity: number;
  can_join: boolean;
};

type GroupPurchaseModalProps = {
  isOpen: boolean;
  productId: string;
  productName: string;
  regularPrice: number | null;
  onClose: () => void;
  onSubmit: (groupId: string, quantity: number) => Promise<void>;
    onCreateGroup?: () => void;
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: 9999,
    animation: "fadeIn 0.2s ease-out",
  },
  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "calc(100% - 32px)",
    maxWidth: "420px",
    background: "#FFFFFF",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    animation: "slideUp 0.3s ease-out",
    maxHeight: "70vh",
    overflowY: "auto",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
    zIndex: 10000,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
    color: "#1E1E1E",
    flex: 1,
  },
  closeButton: {
    width: "32px",
    height: "32px",
    borderRadius: "999px",
    border: "1px solid #E5E7EB",
    background: "#F9FAFB",
    color: "#6B7280",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },
  loadingText: {
    margin: 0,
    fontSize: "14px",
    color: "#6B7280",
    textAlign: "center" as const,
    padding: "20px",
  },
  emptyText: {
    margin: 0,
    fontSize: "14px",
    color: "#6B7280",
    textAlign: "center" as const,
    padding: "20px",
  },
  groupList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  groupCard: {
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    background: "#F9FAFB",
    padding: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  groupCardHover: {
    borderColor: "#51B788",
    background: "#ECFDF5",
  },
  groupHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "8px",
  },
  groupName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 700,
    color: "#1A4331",
    flex: 1,
  },
  discountBadge: {
    background: "#FEE2E2",
    color: "#B91C1C",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  progressContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  progressBar: {
    flex: 1,
    height: "6px",
    borderRadius: "3px",
    background: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#51B788",
    transition: "width 0.3s ease",
  },
  progressText: {
    margin: 0,
    fontSize: "12px",
    color: "#6B7280",
    whiteSpace: "nowrap",
  },
  groupDetails: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    fontSize: "12px",
  },
  detailRow: {
    margin: 0,
    color: "#5B5B5B",
    lineHeight: "16px",
  },
  detailLabel: {
    fontWeight: 600,
    color: "#1E1E1E",
  },
  deadline: {
    margin: 0,
    fontSize: "12px",
    color: "#B91C1C",
    fontWeight: 500,
  },
  quantitySelector: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 0",
    borderTop: "1px solid #E5E7EB",
    marginTop: "8px",
  },
  quantityLabel: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 600,
    color: "#1E1E1E",
  },
  quantityInput: {
    width: "60px",
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid #D1D5DB",
    fontSize: "13px",
    textAlign: "center",
  },
  selectedGroupCard: {
    borderColor: "#51B788",
    background: "#ECFDF5",
    boxShadow: "0 0 0 2px rgba(81, 183, 136, 0.1)",
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
    marginTop: "12px",
  },
  cancelButton: {
    flex: 1,
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #D1D5DB",
    background: "#FFFFFF",
    color: "#1F2937",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  submitButton: {
    flex: 1,
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "#51B788",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    disabled: {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  },
  sectionLabel: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 700,
    color: "#1A4331",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
};

function formatDeadline(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatPrice(value: number | null): string {
  if (value === null) return "Liên hệ";
  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
}

export default function GroupPurchaseModal({ isOpen, productId, productName, regularPrice, onClose, onSubmit }: GroupPurchaseModalProps) {
    const handleCreateGroup = () => {
      setShowGroupPurchaseModal(false);
      onCreateGroup?.();
    };

    const setShowGroupPurchaseModal = (val: boolean) => {
      if (!val) onClose();
    };
  const [groups, setGroups] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadGroups = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/group-purchases");
        const data = (await response.json()) as { groups?: GroupBuy[]; error?: string };

        if (!response.ok) {
          throw new Error(data.error || "Không thể tải danh sách mua chung");
        }

        // Filter groups for this product
        const filteredGroups = (data.groups ?? []).filter((g) => g.product_id === productId && g.status === "open");
        setGroups(filteredGroups);

        if (filteredGroups.length > 0) {
          setSelectedGroupId(filteredGroups[0].group_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải danh sách mua chung");
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    void loadGroups();
  }, [isOpen, productId]);

  const handleSubmit = async () => {
    if (!selectedGroupId) return;

    setJoining(true);
    setError(null);

    try {
      await onSubmit(selectedGroupId, selectedQuantity);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tham gia mua chung");
    } finally {
      setJoining(false);
    }
  };

  if (!isOpen) return null;

  const selectedGroup = groups.find((g) => g.group_id === selectedGroupId);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Nhóm mua chung</h2>
          <button type="button" style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <p style={styles.loadingText}>Đang tải danh sách mua chung...</p>
        ) : error ? (
          <p style={{ ...styles.emptyText, color: "#B91C1C" }}>⚠️ {error}</p>
        ) : groups.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <p style={styles.emptyText}>Chưa có nhóm mua chung nào</p>
            <button
              type="button"
              onClick={handleCreateGroup}
              style={{
                padding: "12px 16px",
                borderRadius: "12px",
                border: "2px dashed #51B788",
                background: "#ECFDF5",
                color: "#065F46",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              Tạo nhóm mua chung
            </button>
          </div>
        ) : (
          <>
            <div>
              <p style={styles.sectionLabel}>Các nhóm mua chung sẵn có</p>
              <div style={styles.groupList}>
                {groups.map((group) => {
                  const progressPercent = (group.current_quantity / group.target_quantity) * 100;
                  const discountPercent =
                    regularPrice && group.discount_price ? Math.round(((regularPrice - group.discount_price) / regularPrice) * 100) : 0;
                  const isSelected = selectedGroupId === group.group_id;

                  return (
                    <div
                      key={group.group_id}
                      style={{
                        ...styles.groupCard,
                        ...(isSelected ? styles.selectedGroupCard : {}),
                      }}
                      onClick={() => setSelectedGroupId(group.group_id)}
                    >
                      <div style={styles.groupHeader}>
                        <h3 style={styles.groupName}>Nhóm #{group.group_id.slice(0, 8)}</h3>
                        {discountPercent > 0 && <div style={styles.discountBadge}>-{discountPercent}%</div>}
                      </div>

                      <div style={styles.progressContainer}>
                        <div style={styles.progressBar}>
                          <div style={{ ...styles.progressFill, width: `${Math.min(progressPercent, 100)}%` }} />
                        </div>
                        <p style={styles.progressText}>
                          {group.current_quantity}/{group.target_quantity}
                        </p>
                      </div>

                      <div style={styles.groupDetails}>
                        <p style={styles.detailRow}>
                          <span style={styles.detailLabel}>Giá:</span> {formatPrice(group.discount_price)}
                        </p>
                        <p style={styles.detailRow}>
                          <span style={styles.detailLabel}>Còn lại:</span> {group.remaining_quantity}
                        </p>
                        <p style={styles.detailRow}>
                          <span style={styles.detailLabel}>Tối thiểu:</span> {group.min_quantity}
                        </p>
                        <p style={styles.detailRow}>
                          <span style={styles.detailLabel}>Hạn:</span> {formatDeadline(group.deadline)}
                        </p>
                      </div>

                      {isSelected && (
                        <div style={styles.quantitySelector}>
                          <label style={styles.quantityLabel}>Số lượng:</label>
                          <input
                            type="number"
                            min="1"
                            max={group.remaining_quantity}
                            value={selectedQuantity}
                            onChange={(e) => setSelectedQuantity(Math.max(1, Math.min(group.remaining_quantity, Number(e.target.value))))}
                            style={styles.quantityInput}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedGroup && (
              <div style={{ padding: "12px", background: "#ECFDF5", borderRadius: "12px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#065F46" }}>
                  ✓ Bạn sẽ được giao khi nhóm đạt {selectedGroup.target_quantity} sản phẩm hoặc đến hạn {formatDeadline(selectedGroup.deadline)}
                </p>
              </div>
            )}

            <div style={styles.buttonGroup}>
              <button type="button" style={styles.cancelButton} onClick={onClose} disabled={joining}>
                Hủy
              </button>
              <button
                type="button"
                style={{
                  ...styles.submitButton,
                  ...(joining || !selectedGroup ? (styles.submitButton.disabled as React.CSSProperties) : {}),
                }}
                onClick={() => void handleSubmit()}
                disabled={joining || !selectedGroup}
              >
                {joining ? "Đang tham gia..." : "Tham gia nhóm"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
