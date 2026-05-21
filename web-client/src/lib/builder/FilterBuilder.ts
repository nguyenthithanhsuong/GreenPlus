export type FilterOperator =
  | "equals"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "lessThan"
  | "between"
  | "in";

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface FilterConfig {
  conditions: FilterCondition[];
  logicalOperator: "AND" | "OR";
}

export class FilterBuilder {
  private conditions: FilterCondition[] = [];
  private logicalOperator: "AND" | "OR" = "AND";

  addCondition(field: string, operator: FilterOperator, value: unknown): this {
    this.conditions.push({ field, operator, value });
    return this;
  }

  addConditions(conditions: FilterCondition[]): this {
    this.conditions.push(...conditions);
    return this;
  }

  setLogicalOperator(operator: "AND" | "OR"): this {
    this.logicalOperator = operator;
    return this;
  }

  removeCondition(field: string): this {
    this.conditions = this.conditions.filter((c) => c.field !== field);
    return this;
  }

  clear(): this {
    this.conditions = [];
    return this;
  }

  build(): FilterConfig {
    return {
      conditions: this.conditions,
      logicalOperator: this.logicalOperator,
    };
  }

  toQueryString(): string {
    return this.conditions
      .map((c) => `${c.field}${this.getOperatorSymbol(c.operator)}${c.value}`)
      .join(` ${this.logicalOperator} `);
  }

  private getOperatorSymbol(operator: FilterOperator): string {
    const symbols: Record<FilterOperator, string> = {
      equals: "==",
      contains: "*",
      startsWith: "^",
      endsWith: "$",
      greaterThan: ">",
      lessThan: "<",
      between: "..",
      in: "in",
    };
    return symbols[operator];
  }
}
