import type { Builder } from "./Builder";

export class DialogFormProduct<TForm extends object> {
  constructor(private readonly values: TForm) {}

  toValues(): TForm {
    return { ...this.values };
  }
}

export interface DialogFormBuilderInterface<TForm extends object>
  extends Builder<DialogFormProduct<TForm>> {
  set<K extends keyof TForm>(field: K, value: TForm[K]): this;
  merge(values: Partial<TForm>): this;
}

export class ConcreteDialogFormBuilder<TForm extends object>
  implements DialogFormBuilderInterface<TForm>
{
  private readonly defaults: TForm;
  private values: TForm;

  constructor(defaults: TForm) {
    this.defaults = { ...defaults };
    this.values = { ...defaults };
  }

  reset(): this {
    this.values = { ...this.defaults };
    return this;
  }

  set<K extends keyof TForm>(field: K, value: TForm[K]): this {
    this.values = { ...this.values, [field]: value };
    return this;
  }

  merge(values: Partial<TForm>): this {
    this.values = { ...this.values, ...values };
    return this;
  }

  getProduct(): DialogFormProduct<TForm> {
    return new DialogFormProduct({ ...this.values });
  }

  build(): DialogFormProduct<TForm> {
    return this.getProduct();
  }
}

export class DialogFormDirector<TForm extends object> {
  constructor(private readonly builder: DialogFormBuilderInterface<TForm>) {}

  constructEmpty(): TForm {
    return this.builder.reset().getProduct().toValues();
  }

  constructFrom(values: Partial<TForm>): TForm {
    return this.builder.reset().merge(values).getProduct().toValues();
  }

  constructWith(
    configure: (builder: DialogFormBuilderInterface<TForm>) => void,
  ): TForm {
    const builder = this.builder.reset();
    configure(builder);
    return builder.getProduct().toValues();
  }
}

export class DialogFormBuilder {
  static withDefaults<TForm extends object>(
    defaults: TForm,
  ): DialogFormDirector<TForm> {
    return new DialogFormDirector(new ConcreteDialogFormBuilder(defaults));
  }

  static patch<TForm extends object>(
    current: TForm,
    patch: Partial<TForm>,
  ): TForm {
    return DialogFormBuilder.withDefaults(current).constructFrom(patch);
  }
}
