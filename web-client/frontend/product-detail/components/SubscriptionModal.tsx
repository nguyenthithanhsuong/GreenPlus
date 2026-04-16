"use client";

import React, { useState } from "react";

type SubscriptionModalProps = {
  isOpen: boolean;
  productId: string;
  productName: string;
  price: number | null;
  onClose: () => void;
  onSubmit: (frequency: string) => Promise<void>;
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
  productInfo: {
    background: "#F9FAFB",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  productName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 600,
    color: "#1A4331",
  },
  productPrice: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 700,
    color: "#2E6A50",
  },
  sectionLabel: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 700,
    color: "#1A4331",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  frequencyOptions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  frequencyOption: {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  frequencyOptionActive: {
    borderColor: "#51B788",
    background: "#ECFDF5",
  },
  radioInput: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  frequencyLabel: {
    flex: 1,
    margin: 0,
    fontSize: "14px",
    fontWeight: 500,
    color: "#1E1E1E",
  },
  frequencyDescription: {
    margin: 0,
    fontSize: "12px",
    color: "#6B7280",
    marginTop: "2px",
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
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
    transition: "background 0.2s",
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
    transition: "background 0.2s",
    disabled: {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  },
  infoText: {
    margin: 0,
    fontSize: "12px",
    color: "#6B7280",
    lineHeight: "16px",
  },
};

const frequencyOptions = [
  { value: "weekly", label: "Hàng tuần", description: "Giao 1 lần/tuần - Tiết kiệm 10%" },
  { value: "biweekly", label: "Hai tuần một lần", description: "Giao 1 lần/2 tuần - Tiết kiệm 15%" },
  { value: "monthly", label: "Hàng tháng", description: "Giao 1 lần/tháng - Tiết kiệm 20%" },
];

export default function SubscriptionModal({ isOpen, productId, productName, price, onClose, onSubmit }: SubscriptionModalProps) {
  const [frequency, setFrequency] = useState("weekly");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(frequency);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Đặt lịch mua định kì</h2>
          <button type="button" style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.productInfo}>
          <p style={styles.productName}>{productName}</p>
          {price !== null && <p style={styles.productPrice}>{new Intl.NumberFormat("vi-VN").format(price)} VND</p>}
        </div>

        <div>
          <p style={styles.sectionLabel}>Chọn tần suất giao hàng</p>
          <div style={styles.frequencyOptions}>
            {frequencyOptions.map((option) => (
              <label
                key={option.value}
                style={{
                  ...styles.frequencyOption,
                  ...(frequency === option.value ? styles.frequencyOptionActive : {}),
                }}
              >
                <input
                  type="radio"
                  name="frequency"
                  value={option.value}
                  checked={frequency === option.value}
                  onChange={(e) => setFrequency(e.target.value)}
                  style={styles.radioInput}
                />
                <div style={{ flex: 1 }}>
                  <p style={styles.frequencyLabel}>{option.label}</p>
                  <p style={styles.frequencyDescription}>{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <p style={styles.infoText}>
          💡 Bạn có thể hủy lịch mua định kì bất kỳ lúc nào trong phần Quản lý đơn hàng. Giá sản phẩm sẽ được cập nhật theo mục tiêu bộ theo
          lịch.
        </p>

        <div style={styles.buttonGroup}>
          <button type="button" style={styles.cancelButton} onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button
            type="button"
            style={{
              ...styles.submitButton,
              ...(loading ? (styles.submitButton.disabled as React.CSSProperties) : {}),
            }}
            onClick={() => void handleSubmit()}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
