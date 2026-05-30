// Builder Pattern Exports
export * from "./builder";

// Strategy Pattern Exports
export {
  CODStrategy,
  MoMoStrategy,
  VNPayStrategy,
  PaymentStrategyRegistry,
} from "./strategy";
export type {
  PaymentStrategy,
  PaymentMethod,
  PaymentContext,
  PaymentResult,
} from "./strategy";

// Decorator Pattern Exports
export { withAuth, withErrorBoundary, compose } from "./decorators";
export type { WithErrorBoundaryProps } from "./decorators";

// Mapper Exports
export * from "./mapper";

// Singleton Pattern Exports
export * from "./singleton";

// Store Exports (Observer Pattern)
export { useAuthStore } from "./stores/authStore";

// Utils
export { useAuthStore as useAuth } from "./stores/authStore";
