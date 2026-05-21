import React from "react";

export type DialogType = "confirmation" | "alert" | "custom";

export interface DialogConfig {
  type: DialogType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "primary" | "danger" | "warning";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface DialogResult {
  type: DialogType;
  component: React.ComponentType<Record<string, unknown>>;
  defaultProps: Record<string, unknown>;
}

export class DialogFactory {
  private static readonly dialogRegistry = new Map<
    DialogType,
    React.ComponentType<Record<string, unknown>>
  >();

  static registerDialog<P extends Record<string, unknown>>(
    type: DialogType,
    component: React.ComponentType<P>,
  ) {
    this.dialogRegistry.set(
      type,
      component as React.ComponentType<Record<string, unknown>>,
    );
  }

  static createDialog(config: DialogConfig): DialogResult {
    const { type, isLoading, onCancel, ...props } = config;
    const component = this.dialogRegistry.get(type);

    if (!component) {
      throw new Error(`Dialog type "${type}" is not registered`);
    }

    return {
      type,
      component,
      defaultProps: {
        ...props,
        busy: isLoading,
        onCancel: onCancel ?? (() => {}),
      },
    };
  }

  static getAvailableDialogTypes(): DialogType[] {
    return Array.from(this.dialogRegistry.keys());
  }
}
