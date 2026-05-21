export type FieldValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | Record<string, unknown>
  | unknown[];

export interface FieldConfig {
  name: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "select"
    | "checkbox"
    | "textarea"
    | "date";
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: FieldValue }>;
  validation?: (value: FieldValue) => string | null;
  defaultValue?: FieldValue;
}

export interface FormBuilderConfig {
  fields: FieldConfig[];
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (values: Record<string, FieldValue>) => void;
  onCancel?: () => void;
}

export class FormBuilder {
  private fields: FieldConfig[] = [];
  private title = "";
  private submitLabel = "Submit";
  private cancelLabel = "Cancel";
  private submitHandler?: (values: Record<string, FieldValue>) => void;
  private cancelHandler?: () => void;

  addField(field: FieldConfig): this {
    this.fields.push(field);
    return this;
  }

  addFields(fields: FieldConfig[]): this {
    this.fields.push(...fields);
    return this;
  }

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  setSubmitLabel(label: string): this {
    this.submitLabel = label;
    return this;
  }

  setCancelLabel(label: string): this {
    this.cancelLabel = label;
    return this;
  }

  onSubmit(handler: (values: Record<string, FieldValue>) => void): this {
    this.submitHandler = handler;
    return this;
  }

  onCancel(handler: () => void): this {
    this.cancelHandler = handler;
    return this;
  }

  build(): FormBuilderConfig {
    if (this.fields.length === 0) {
      throw new Error("FormBuilder: No fields added");
    }
    if (!this.submitHandler) {
      throw new Error("FormBuilder: onSubmit handler not set");
    }

    return {
      fields: this.fields,
      title: this.title,
      submitLabel: this.submitLabel,
      cancelLabel: this.cancelLabel,
      onSubmit: this.submitHandler,
      onCancel: this.cancelHandler,
    };
  }

  reset(): this {
    this.fields = [];
    this.title = "";
    this.submitLabel = "Submit";
    this.cancelLabel = "Cancel";
    this.submitHandler = undefined;
    this.cancelHandler = undefined;
    return this;
  }
}
