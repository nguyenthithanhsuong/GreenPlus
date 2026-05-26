"use client";

import React from "react";
import { compose, withErrorBoundary } from "@/lib/decorators";

type PurchaseMode = "cart" | "subscription" | "group";
type PurchaseModeOption = { id: PurchaseMode; label: string; icon: string };

type PurchaseModeSelectorProps = {
  currentMode: PurchaseMode;
  onModeChange: (mode: PurchaseMode) => void;
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
  },
  modeButton: {
    flex: 1,
    padding: "10px 8px",
    borderRadius: "12px",
    border: "1px solid #D1D5DB",
    background: "#FFFFFF",
    color: "#6B7280",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },
  modeButtonActive: {
    background: "#51B788",
    color: "#FFFFFF",
    borderColor: "#51B788",
    boxShadow: "0 2px 8px rgba(81, 183, 136, 0.2)",
  },
  modeIcon: {
    marginRight: "4px",
    fontSize: "14px",
  },
};

const PURCHASE_MODES: PurchaseModeOption[] = [
  { id: "cart", label: "Mua thường", icon: "🛒" },
  { id: "subscription", label: "Mua định kì", icon: "⏱" },
  { id: "group", label: "Mua chung", icon: "👥" },
];

function BasePurchaseModeSelector({ currentMode, onModeChange }: PurchaseModeSelectorProps) {
  return (
    <div style={styles.container}>
      {PURCHASE_MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => onModeChange(mode.id)}
          style={{
            ...styles.modeButton,
            ...(currentMode === mode.id ? styles.modeButtonActive : {}),
          }}
        >
          <span style={styles.modeIcon}>{mode.icon}</span>
          {mode.label}
        </button>
      ))}
    </div>
  );
}

export default compose(withErrorBoundary)(BasePurchaseModeSelector);
