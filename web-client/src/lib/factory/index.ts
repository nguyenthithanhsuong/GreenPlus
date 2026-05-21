import React from "react";

export type ComponentType =
  | "modal"
  | "drawer"
  | "dropdown"
  | "tooltip"
  | "popover";

export interface ComponentConfig {
  type: ComponentType;
  props?: Record<string, unknown>;
}

export interface ComponentFactoryResult {
  type: ComponentType;
  component: React.ComponentType<Record<string, unknown>>;
  props: Record<string, unknown>;
}

export class ComponentFactory {
  private static readonly componentRegistry = new Map<
    ComponentType,
    React.ComponentType<Record<string, unknown>>
  >();

  static register<P extends Record<string, unknown>>(
    type: ComponentType,
    component: React.ComponentType<P>,
  ) {
    this.componentRegistry.set(
      type,
      component as React.ComponentType<Record<string, unknown>>,
    );
  }

  static create(config: ComponentConfig): ComponentFactoryResult {
    const { type, props = {} } = config;
    const component = this.componentRegistry.get(type);

    if (!component) {
      throw new Error(
        `Component type "${type}" is not registered in ComponentFactory`,
      );
    }

    return {
      type,
      component,
      props,
    };
  }

  static createMultiple(configs: ComponentConfig[]): ComponentFactoryResult[] {
    return configs.map((config) => this.create(config));
  }

  static isRegistered(type: ComponentType): boolean {
    return this.componentRegistry.has(type);
  }

  static getRegisteredTypes(): ComponentType[] {
    return Array.from(this.componentRegistry.keys());
  }
}
