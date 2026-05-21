import React from 'react';

export interface FormFieldValue {
  [key: string]: unknown;
}

export interface FormComponentProps {
  name: string;
  label?: string;
  value?: unknown;
  onChange?: (value: unknown) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export interface FormGroupProps {
  name: string;
  label?: string;
  children: React.ReactNode;
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  className?: string;
}

export abstract class FormComponent {
  abstract name: string;
  abstract render(props: FormComponentProps): React.ReactElement;
}

export class TextFieldComponent extends FormComponent {
  name = 'TextField';

  render(props: FormComponentProps): React.ReactElement {
    const { label, value, onChange, error, required, disabled, name } = props;
    const fieldValue =
      typeof value === "string" || typeof value === "number" ? value : "";

    return (
      <div key={name} className="mb-4">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-600">*</span>}
          </label>
        )}
        <input
          type="text"
          name={name}
          value={fieldValue}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        {error && <p className="text-red-500 text-sm mt-1">{String(error)}</p>}
      </div>
    );
  }
}

export class SelectFieldComponent extends FormComponent {
  name = 'SelectField';

  render(props: FormComponentProps & { options: Array<{ label: string; value: string | number }> }): React.ReactElement {
    const { label, value, onChange, error, required, disabled, name, options } = props;
    const fieldValue =
      typeof value === "string" || typeof value === "number" ? value : "";

    return (
      <div key={name} className="mb-4">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-600">*</span>}
          </label>
        )}
        <select
          name={name}
          value={fieldValue}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          <option value="">-- Chọn --</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-red-500 text-sm mt-1">{String(error)}</p>}
      </div>
    );
  }
}

export class CheckboxFieldComponent extends FormComponent {
  name = 'CheckboxField';

  render(props: FormComponentProps): React.ReactElement {
    const { label, value, onChange, disabled, name } = props;

    return (
      <div key={name} className="mb-4 flex items-center">
        <input
          type="checkbox"
          name={name}
          checked={Boolean(value)}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 accent-green-600 cursor-pointer"
        />
        {label && <label className="ml-2 text-sm text-gray-700 cursor-pointer">{label}</label>}
      </div>
    );
  }
}

export class FormFieldGroup {
  constructor(
    public name: string,
    private fields: FormComponent[],
    public layout: 'vertical' | 'horizontal' | 'grid' = 'vertical',
    public columns: number = 1
  ) {}

  addField(field: FormComponent): this {
    this.fields.push(field);
    return this;
  }

  removeField(fieldName: string): this {
    this.fields = this.fields.filter((f) => f.name !== fieldName);
    return this;
  }

  getFields(): FormComponent[] {
    return this.fields;
  }

  render(values: FormFieldValue, errors: FormFieldValue, onChange: (name: string, value: unknown) => void): React.ReactElement {
    const gridClass =
      this.layout === 'grid'
        ? `grid grid-cols-${this.columns} gap-4`
        : this.layout === 'horizontal'
          ? 'flex gap-4'
          : '';

    return (
      <div key={this.name} className={gridClass}>
        {this.fields.map((field) => {
          const fieldName = `${this.name}.${field.name}`;
          return field.render({
            name: fieldName,
            value: values[fieldName],
            onChange: (value) => onChange(fieldName, value),
            error:
              typeof errors[fieldName] === "string"
                ? errors[fieldName]
                : undefined,
          });
        })}
      </div>
    );
  }
}

export class CompositeForm {
  private groups: FormFieldGroup[] = [];
  private values: FormFieldValue = {};
  private errors: FormFieldValue = {};

  addGroup(group: FormFieldGroup): this {
    this.groups.push(group);
    return this;
  }

  removeGroup(groupName: string): this {
    this.groups = this.groups.filter((g) => g.name !== groupName);
    return this;
  }

  getGroups(): FormFieldGroup[] {
    return this.groups;
  }

  setValues(values: FormFieldValue): this {
    this.values = { ...values };
    return this;
  }

  setErrors(errors: FormFieldValue): this {
    this.errors = { ...errors };
    return this;
  }

  getValues(): FormFieldValue {
    return this.values;
  }

  handleChange = (name: string, value: unknown) => {
    this.values[name] = value;
  };

  validate(): boolean {
    return Object.keys(this.errors).length === 0;
  }

  reset(): this {
    this.values = {};
    this.errors = {};
    return this;
  }

  submit(): FormFieldValue | null {
    if (this.validate()) {
      return this.values;
    }
    return null;
  }
}
