export type ListFilterPredicate<T> = (item: T) => boolean;

export class ListFilterBuilder<T extends object> {
  private readonly predicates: Array<ListFilterPredicate<T>> = [];

  static for<T extends object>(): ListFilterBuilder<T> {
    return new ListFilterBuilder<T>();
  }

  where<K extends keyof T>(field: K): FieldFilterBuilder<T, K> {
    return new FieldFilterBuilder(this, field);
  }

  matching(predicate: ListFilterPredicate<T>): this {
    this.predicates.push(predicate);
    return this;
  }

  when(
    condition: boolean,
    configure: (builder: ListFilterBuilder<T>) => void,
  ): this {
    if (condition) {
      configure(this);
    }

    return this;
  }

  apply(items: readonly T[]): T[] {
    return items.filter(this.buildPredicate());
  }

  buildPredicate(): ListFilterPredicate<T> {
    return (item) => this.predicates.every((predicate) => predicate(item));
  }
}

class FieldFilterBuilder<T extends object, K extends keyof T> {
  constructor(
    private readonly parent: ListFilterBuilder<T>,
    private readonly field: K,
  ) {}

  equals(value: T[K]): ListFilterBuilder<T> {
    return this.parent.matching((item) => item[this.field] === value);
  }

  notEquals(value: T[K]): ListFilterBuilder<T> {
    return this.parent.matching((item) => item[this.field] !== value);
  }

  in(values: readonly T[K][]): ListFilterBuilder<T> {
    return this.parent.matching((item) => values.includes(item[this.field]));
  }

  contains(value: string): ListFilterBuilder<T> {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      return this.parent;
    }

    return this.parent.matching((item) =>
      String(item[this.field] ?? "").toLowerCase().includes(normalized),
    );
  }

  matches(predicate: (value: T[K], item: T) => boolean): ListFilterBuilder<T> {
    return this.parent.matching((item) => predicate(item[this.field], item));
  }
}
