// Factory Pattern Exports
export { DialogFactory } from "./factory/DialogFactory";
export { ButtonFactory } from "./factory/ButtonFactory";
export { ComponentFactory } from "./factory";
export type {
  DialogType,
  DialogConfig,
  DialogResult,
} from "./factory/DialogFactory";
export type {
  ButtonVariant,
  ButtonSize,
  ButtonConfig,
} from "./factory/ButtonFactory";
export type {
  ComponentType,
  ComponentConfig,
  ComponentFactoryResult,
} from "./factory";

// Builder Pattern Exports
export { FormBuilder, FilterBuilder, ModalBuilder } from "./builder";
export type {
  FieldConfig,
  FormBuilderConfig,
  FilterCondition,
  FilterConfig,
  FilterOperator,
  ModalButton,
  ModalBuilderConfig,
} from "./builder";

// Strategy Pattern Exports
export {
  CODStrategy,
  MoMoStrategy,
  VNPayStrategy,
  PaymentStrategyFactory,
} from "./strategy";
export type {
  PaymentStrategy,
  PaymentMethod,
  PaymentContext,
  PaymentResult,
} from "./strategy";

// Decorator Pattern Exports
export {
  withAuth,
  withLoading,
  withErrorBoundary,
  compose,
  composeAsync,
} from "./decorators";
export type { WithLoadingProps, WithErrorBoundaryProps } from "./decorators";

// Composite Pattern Exports
export {
  CompositeForm,
  FormFieldGroup,
  TextFieldComponent,
  SelectFieldComponent,
  CheckboxFieldComponent,
  CompositeFormComponent,
} from "./composite";
export type {
  FormComponentProps,
  FormFieldValue,
  FormGroupProps,
  CompositeFormComponentProps,
} from "./composite";

// Adapter Pattern Exports (Already Existing)
export * from "./adapter/ProductAdapter";
export * from "./adapter/CartAdapter";
export * from "./adapter/OrderAdapter";
export * from "./adapter/PaymentAdapter";
export * from "./adapter/AccessPolicyAdapter";

// Service Exports (Singleton Pattern)
export { ApiService } from "./services/ApiService";

// Store Exports (Observer Pattern)
export { useAuthStore } from "./stores/authStore";

// Utils
export { useAuthStore as useAuth } from "./stores/authStore";
