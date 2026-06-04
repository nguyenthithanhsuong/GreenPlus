import type { Builder } from "./Builder";

export type UrlQueryValue = string | number | boolean | Date | null | undefined;

export class UrlProduct {
  private basePath = "/";
  private readonly pathSegments: string[] = [];
  private readonly searchParams = new URLSearchParams();

  setBasePath(basePath: string): this {
    this.basePath = basePath.replace(/\/+$/, "") || "/";
    return this;
  }

  addSegment(value: UrlQueryValue): this {
    if (value != null) {
      this.pathSegments.push(encodeURIComponent(this.toParamValue(value)));
    }

    return this;
  }

  addQuery(key: string, value: UrlQueryValue | UrlQueryValue[]): this {
    const values = Array.isArray(value) ? value : [value];

    values.forEach((item) => {
      if (item != null) {
        this.searchParams.append(key, this.toParamValue(item));
      }
    });

    return this;
  }

  clone(): UrlProduct {
    const product = new UrlProduct().setBasePath(this.basePath);
    this.pathSegments.forEach((segment) => {
      product.pathSegments.push(segment);
    });
    this.searchParams.forEach((value, key) => {
      product.searchParams.append(key, value);
    });

    return product;
  }

  toString(): string {
    const pathPrefix = this.basePath === "/" ? "" : this.basePath;
    const path =
      this.pathSegments.length > 0
        ? `${pathPrefix}/${this.pathSegments.join("/")}`
        : this.basePath;
    const query = this.searchParams.toString();

    return query ? `${path}?${query}` : path;
  }

  private toParamValue(
    value: Exclude<UrlQueryValue, null | undefined>,
  ): string {
    return value instanceof Date ? value.toISOString() : String(value);
  }
}

export class UrlDirector {
  constructor(private readonly builder: UrlBuilderInterface) {}

  construct(basePath: string): UrlBuilderInterface {
    return this.builder.reset().setBasePath(basePath);
  }

  static create(basePath: string): ConcreteUrlBuilder {
    const builder = new ConcreteUrlBuilder();
    new UrlDirector(builder).construct(basePath);
    return builder;
  }
}

export interface UrlBuilderInterface extends Builder<UrlProduct> {
  setBasePath(basePath: string): this;
  addSegment(value: UrlQueryValue): this;
  addQuery(key: string, value: UrlQueryValue | UrlQueryValue[]): this;
}

export class ConcreteUrlBuilder implements UrlBuilderInterface {
  private product = new UrlProduct();

  reset(): this {
    this.product = new UrlProduct();
    return this;
  }

  setBasePath(basePath: string): this {
    this.product.setBasePath(basePath);
    return this;
  }

  addSegment(value: UrlQueryValue): this {
    this.product.addSegment(value);
    return this;
  }

  addQuery(key: string, value: UrlQueryValue | UrlQueryValue[]): this {
    this.product.addQuery(key, value);
    return this;
  }

  segment(value: UrlQueryValue): this {
    return this.addSegment(value);
  }

  query(key: string, value: UrlQueryValue | UrlQueryValue[]): this {
    return this.addQuery(key, value);
  }

  queryIf(
    condition: boolean,
    key: string,
    value: UrlQueryValue | UrlQueryValue[],
  ): this {
    return condition ? this.addQuery(key, value) : this;
  }

  queries(values: Record<string, UrlQueryValue | UrlQueryValue[]>): this {
    Object.entries(values).forEach(([key, value]) => {
      this.addQuery(key, value);
    });

    return this;
  }

  getProduct(): UrlProduct {
    return this.product.clone();
  }

  build(): string {
    return this.product.toString();
  }
}
