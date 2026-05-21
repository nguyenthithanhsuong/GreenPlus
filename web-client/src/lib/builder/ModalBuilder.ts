import React from "react";

export interface ModalButton {
  label: string;
  variant: "primary" | "secondary" | "danger";
  onClick: () => void;
}

export interface ModalBuilderConfig {
  title: string;
  children: React.ReactNode;
  buttons: ModalButton[];
  size?: "small" | "medium" | "large";
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export class ModalBuilder {
  private title = "";
  private children: React.ReactNode = null;
  private buttons: ModalButton[] = [];
  private size: "small" | "medium" | "large" = "medium";
  private closeOnBackdropClick = true;
  private showCloseButton = true;
  private closeHandler?: () => void;

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  setContent(children: React.ReactNode): this {
    this.children = children;
    return this;
  }

  addButton(
    label: string,
    variant: "primary" | "secondary" | "danger",
    onClick: () => void,
  ): this {
    this.buttons.push({ label, variant, onClick });
    return this;
  }

  addButtons(buttons: ModalButton[]): this {
    this.buttons.push(...buttons);
    return this;
  }

  clearButtons(): this {
    this.buttons = [];
    return this;
  }

  setSize(size: "small" | "medium" | "large"): this {
    this.size = size;
    return this;
  }

  setCloseOnBackdropClick(value: boolean): this {
    this.closeOnBackdropClick = value;
    return this;
  }

  setShowCloseButton(value: boolean): this {
    this.showCloseButton = value;
    return this;
  }

  onClose(handler: () => void): this {
    this.closeHandler = handler;
    return this;
  }

  build(): ModalBuilderConfig {
    if (!this.title) {
      throw new Error("ModalBuilder: Title is required");
    }
    if (this.buttons.length === 0) {
      throw new Error("ModalBuilder: At least one button is required");
    }

    return {
      title: this.title,
      children: this.children,
      buttons: this.buttons,
      size: this.size,
      closeOnBackdropClick: this.closeOnBackdropClick,
      showCloseButton: this.showCloseButton,
      onClose: this.closeHandler,
    };
  }

  reset(): this {
    this.title = "";
    this.children = null;
    this.buttons = [];
    this.size = "medium";
    this.closeOnBackdropClick = true;
    this.showCloseButton = true;
    this.closeHandler = undefined;
    return this;
  }
}
