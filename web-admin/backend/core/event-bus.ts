type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<string, EventHandler[]>();

  subscribe<T = unknown>(eventName: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventName) ?? [];
    this.handlers.set(eventName, [...existing, handler as EventHandler]);
  }

  async publish<T = unknown>(eventName: string, payload: T): Promise<void> {
    const handlers = this.handlers.get(eventName) ?? [];
    await Promise.all(handlers.map((handler) => handler(payload)));
  }
}

export const eventBus = new EventBus();
