import type { Builder } from "./Builder";

export type ListFilterPredicate<T> = (item: T) => boolean;

export class ListFilterProduct<T> {
  constructor(private readonly predicates: Array<ListFilterPredicate<T>>) {}

  toPredicate(): ListFilterPredicate<T> {
    return (item) => this.predicates.every((predicate) => predicate(item));
  }

  apply(items: readonly T[]): T[] {
    return items.filter(this.toPredicate());
  }
}

export interface ListFilterBuilderInterface<T extends object>
  extends Builder<ListFilterProduct<T>> {
  where<K extends keyof T>(field: K): FieldFilterBuilder<T, K>;
  matching(predicate: ListFilterPredicate<T>): this;
  when(condition: boolean, configure: (builder: this) => void): this;
}

export class ConcreteListFilterBuilder<T extends object>
  implements ListFilterBuilderInterface<T>
{
  private predicates: Array<ListFilterPredicate<T>> = [];

  reset(): this {
    this.predicates = [];
    return this;
  }

  where<K extends keyof T>(field: K): FieldFilterBuilder<T, K> {
    return new FieldFilterBuilder(this, field);
  }

  matching(predicate: ListFilterPredicate<T>): this {
    this.predicates.push(predicate);
    return this;
  }

  when(condition: boolean, configure: (builder: this) => void): this {
    if (condition) {
      configure(this);
    }

    return this;
  }

  apply(items: readonly T[]): T[] {
    return this.build().apply(items);
  }

  buildPredicate(): ListFilterPredicate<T> {
    return this.getProduct().toPredicate();
  }

  getProduct(): ListFilterProduct<T> {
    return new ListFilterProduct([...this.predicates]);
  }

  build(): ListFilterProduct<T> {
    return this.getProduct();
  }
}

export class ListFilterDirector<T extends object> {
  constructor(private readonly builder: ListFilterBuilderInterface<T>) {}

  constructEmpty(): ListFilterBuilderInterface<T> {
    return this.builder.reset();
  }

  static create<T extends object>(): ConcreteListFilterBuilder<T> {
    const builder = new ConcreteListFilterBuilder<T>();
    new ListFilterDirector(builder).constructEmpty();
    return builder;
  }
}

export class ListFilterBuilder {
  static for<T extends object>(): ConcreteListFilterBuilder<T> {
    return ListFilterDirector.create<T>();
  }
}

export class FieldFilterBuilder<T extends object, K extends keyof T> {
  constructor(
    private readonly parent: ConcreteListFilterBuilder<T>,
    private readonly field: K,
  ) {}

  equals(value: T[K]): ConcreteListFilterBuilder<T> {
    return this.parent.matching((item) => item[this.field] === value);
  }

  notEquals(value: T[K]): ConcreteListFilterBuilder<T> {
    return this.parent.matching((item) => item[this.field] !== value);
  }

  in(values: readonly T[K][]): ConcreteListFilterBuilder<T> {
    return this.parent.matching((item) => values.includes(item[this.field]));
  }

  contains(value: string): ConcreteListFilterBuilder<T> {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      return this.parent;
    }

    return this.parent.matching((item) =>
      String(item[this.field] ?? "").toLowerCase().includes(normalized),
    );
  }

  matches(
    predicate: (value: T[K], item: T) => boolean,
  ): ConcreteListFilterBuilder<T> {
    return this.parent.matching((item) => predicate(item[this.field], item));
  }
}
