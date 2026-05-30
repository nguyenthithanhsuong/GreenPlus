export type UrlQueryValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export class UrlBuilder {
  private readonly basePath: string;
  private readonly pathSegments: string[] = [];
  private readonly searchParams = new URLSearchParams();

  private constructor(basePath: string) {
    this.basePath = basePath.replace(/\/+$/, "") || "/";
  }

  static from(basePath: string): UrlBuilder {
    return new UrlBuilder(basePath);
  }

  segment(value: UrlQueryValue): this {
    if (value == null) {
      return this;
    }

    this.pathSegments.push(encodeURIComponent(this.toParamValue(value)));
    return this;
  }

  query(key: string, value: UrlQueryValue | UrlQueryValue[]): this {
    const values = Array.isArray(value) ? value : [value];

    values.forEach((item) => {
      if (item != null) {
        this.searchParams.append(key, this.toParamValue(item));
      }
    });

    return this;
  }

  queryIf(
    condition: boolean,
    key: string,
    value: UrlQueryValue | UrlQueryValue[],
  ): this {
    return condition ? this.query(key, value) : this;
  }

  queries(values: Record<string, UrlQueryValue | UrlQueryValue[]>): this {
    Object.entries(values).forEach(([key, value]) => {
      this.query(key, value);
    });

    return this;
  }

  build(): string {
    const pathPrefix = this.basePath === "/" ? "" : this.basePath;
    const path =
      this.pathSegments.length > 0
        ? `${pathPrefix}/${this.pathSegments.join("/")}`
        : this.basePath;
    const query = this.searchParams.toString();

    return query ? `${path}?${query}` : path;
  }

  private toParamValue(value: Exclude<UrlQueryValue, null | undefined>): string {
    return value instanceof Date ? value.toISOString() : String(value);
  }
}
