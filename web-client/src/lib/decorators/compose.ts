type ComponentType<P = object> = React.ComponentType<P>;

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

export function composeAsync<P extends object>(
  ...decorators: Array<
    (component: ComponentType<P>) => Promise<ComponentType<P>>
  >
): (component: ComponentType<P>) => Promise<ComponentType<P>> {
  return async (component: ComponentType<P>) => {
    let result = component;
    for (const decorator of decorators.reverse()) {
      result = await decorator(result);
    }
    return result;
  };
}
