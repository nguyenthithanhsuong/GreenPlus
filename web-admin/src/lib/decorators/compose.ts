import type { ComponentType } from "react";

export function compose<P extends object>(
  ...decorators: Array<(component: ComponentType<P>) => ComponentType<P>>
): (component: ComponentType<P>) => ComponentType<P> {
  return (component: ComponentType<P>) => {
    return decorators.reduceRight(
      (acc, decorator) => decorator(acc),
      component,
    );
  };
}
