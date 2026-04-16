"use client";

import React from "react";

type PurchaseMode = "cart" | "subscription" | "group";

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

export default function PurchaseModeSelector({ currentMode, onModeChange }: PurchaseModeSelectorProps) {
  const modes: { id: PurchaseMode; label: string; icon: string }[] = [
    { id: "cart", label: "Mua thường" },
    { id: "subscription", label: "Mua định kì" },
    { id: "group", label: "Mua chung"},
  ];

  return (
    <div style={styles.container}>
      {modes.map((mode) => (
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
