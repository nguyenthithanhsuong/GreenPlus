import React, { useState, useCallback } from "react";
import { CompositeForm, FormFieldValue } from "./CompositeForm";

export interface CompositeFormComponentProps {
  form: CompositeForm;
  onSubmit: (values: FormFieldValue) => Promise<void> | void;
  submitLabel?: string;
  resetLabel?: string;
  isLoading?: boolean;
}

export const CompositeFormComponent: React.FC<CompositeFormComponentProps> = ({
  form,
  onSubmit,
  submitLabel = "Submit",
  resetLabel = "Reset",
  isLoading = false,
}) => {
  const [values, setValues] = useState<FormFieldValue>(form.getValues());
  const [errors, setErrors] = useState<FormFieldValue>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        form.setValues(values).setErrors(errors);
        if (form.validate()) {
          await onSubmit(form.getValues());
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, values, errors, onSubmit],
  );

  const handleReset = useCallback(() => {
    setValues(form.getValues());
    setErrors({});
  }, [form]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {form
        .getGroups()
        .map((group) => (
          <React.Fragment key={group.name}>
            {group.render(values, errors, handleChange) as unknown as React.ReactElement}
          </React.Fragment>
        ))}

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Đang xử lý..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting || isLoading}
          className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resetLabel}
        </button>
      </div>
    </form>
  );
};
