# Web Client Frontend Pattern Guide

This guide documents patterns used in `web-client/frontend` and `web-client/src/lib`.

## Public Imports

```tsx
import { ListFilterBuilder, UrlBuilder } from "@/lib/builder";
import { ProductMapper, CartMapper, OrderMapper } from "@/lib/mapper";
import { ProductService, CartService, OrderService } from "@/lib/singleton";
import { PaymentStrategyRegistry } from "@/lib/strategy";
import { compose, withAuth, withErrorBoundary } from "@/lib";
```

## Pattern Decisions

| Pattern        | Status | Used For                                           |
| -------------- | ------ | -------------------------------------------------- |
| Builder        | Keep   | URL/query construction and typed list filtering.   |
| Strategy       | Keep   | Payment method behavior.                           |
| Singleton      | Keep   | API service instances and shared request behavior. |
| Mapper         | Keep   | API DTO to UI model transformation.                |
| Decorator      | Keep   | Auth and error-boundary page wrappers.             |
| Observer/store | Keep   | Auth state subscriptions through Zustand.          |

### 1. Payment Component (Strategy Pattern)

**Before:**

```tsx
const paymentOptions = [
  { value: "cod", label: "COD", icon: "C" },
  { value: "momo", label: "MoMo", icon: "M" },
  { value: "vnpay", label: "VNPay", icon: "V" },
];

if (paymentMethod === "cod") {
  // COD payment logic
}
```

**After:**

```tsx
import { PaymentStrategyRegistry } from "@/lib/strategy";

const availablePaymentMethods = useMemo(
  () => PaymentStrategyRegistry.getAvailableMethods(),
  [],
);

const selectedPaymentStrategy = useMemo(
  () => PaymentStrategyRegistry.getStrategy(paymentMethod),
  [paymentMethod],
);

const paymentResult = await selectedPaymentStrategy.process({
  amount: orderUIModel.total,
  currency: "VND",
  orderId: orderUIModel.id,
  customerEmail: user.email,
});
```

**Benefits:**

- Add new payment methods by registering a strategy.
- Keep payment validation/process/cancel behavior inside each strategy.
- Share payment labels across checkout and order detail pages.

### 2. API URL Construction (Builder Pattern)

**Before:**

```tsx
const response = await fetch(
  `/api/orders/${encodeURIComponent(orderId)}?userId=${encodeURIComponent(user.user_id)}`,
  { signal: controller.signal },
);
```

**After:**

```tsx
import { UrlBuilder } from "@/lib/builder";

const response = await fetch(
  UrlBuilder.from("/api/orders")
    .segment(orderId)
    .query("userId", user.user_id)
    .build(),
  { signal: controller.signal },
);
```

**Benefits:**

- Centralizes `encodeURIComponent` and query-string building.
- Avoids manually mixing path params and query params.
- Keeps API route construction consistent in services and frontend pages.

### 3. Product Services (Singleton + Builder Pattern)

**Before:**

```tsx
const query = new URLSearchParams();
if (params.categoryId) query.append("categoryId", params.categoryId);
if (params.keyword) query.append("keyword", params.keyword);
if (params.sort) query.append("sort", params.sort);
if (params.limit) query.append("limit", String(params.limit));

const response = await apiService.get(`/api/products?${query.toString()}`);
```

**After:**

```tsx
import { UrlBuilder } from "../builder";

const response = await apiService.get(
  UrlBuilder.from("/api/products").queries(params).build(),
);
```

**Benefits:**

- `ProductService` stays focused on API intent.
- Optional params are skipped automatically when `null` or `undefined`.
- Query building logic is reusable across `ProductService`, `CartService`, order pages, and complaint pages.

### 4. Order Filtering (Builder Pattern)

**Before:**

```tsx
const completedOrders = allOrders.filter((item) => item.status === "completed");
```

**After:**

```tsx
import { ListFilterBuilder } from "@/lib/builder";

const completedOrders = ListFilterBuilder.for<OrderItem>()
  .where("status")
  .equals("completed")
  .apply(allOrders);
```

**Benefits:**

- Field names and values are typed from `OrderItem`.
- Dynamic filters can be chained without object-condition casting.
- Same builder can be reused for tab filters, status filters, search filters, and conditional filters.

### 6. Checkout Flow (Singleton + Mapper + Strategy)

**Before:**

```tsx
const cartResponse = await fetch(`/api/cart?userId=${user.user_id}`);
const cart = await cartResponse.json();
const orderResponse = await fetch("/api/orders", { method: "POST" });
```

**After:**

```tsx
const cartData = await CartService.getCart(user.user_id);
const cartUIModel = CartMapper.toUIModel(cartData);

const createResult = await OrderService.createOrder({
  userId: user.user_id,
  deliveryAddress,
  deliveryFee: shippingFee,
  note: note.trim(),
  paymentMethod,
});

const orderUIModel = OrderMapper.toUIModel(createResult);
const paymentResult = await PaymentStrategyRegistry.getStrategy(
  paymentMethod,
).process({
  amount: orderUIModel.total,
  currency: "VND",
  orderId: orderUIModel.id,
  customerEmail: user.email,
});
```

**Benefits:**

- Service handles API calls.
- Mapper normalizes response shape.
- Strategy handles payment behavior after the order is created.

### 7. Protected Pages (Decorator Pattern)

**Before:**

```tsx
function ProfilePage() {
  const { initialized, isAuthenticated, user } = useAuthStore();

  if (!initialized) return <p>Đang kiểm tra phiên đăng nhập...</p>;
  if (!isAuthenticated || user?.role !== "user")
    return <p>Truy cập bị từ chối</p>;

  return <ProfileContent />;
}
```

**After:**

```tsx
import { compose, withAuth, withErrorBoundary } from "@/lib/decorators";

function BaseProfilePage() {
  return <ProfileContent />;
}

export default compose(withErrorBoundary, (Component) =>
  withAuth(Component, "user"),
)(BaseProfilePage);
```

**Benefits:**

- Auth checks are not duplicated per page.
- `withAuth` waits for auth initialization before redirecting.
- `withErrorBoundary` isolates page-level runtime errors.

## Pattern Coordination

Recommended flow:

| Feature             | Flow                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------- |
| Product browse      | `UrlBuilder` → `ProductService` → `ProductMapper` → JSX                                   |
| Cart checkout       | `CartService` → `CartMapper` → `OrderService` → `OrderMapper` → `PaymentStrategyRegistry` |
| Order tab filtering | `ListFilterBuilder` → filtered UI list                                                    |
| Protected page      | `useAuthStore` → `withAuth` → `withErrorBoundary` → page JSX                              |
| Confirmation action | Local state → `ConfirmationDialog` → service/API mutation                                 |

## When To Add A Builder

Add a builder when construction has at least one of these properties:

- Repeated path/query encoding.
- Optional params or conditional filters.
- Typed chained conditions that replace object casting.
- Multi-step object construction where invalid intermediate states are likely.

Do not add a builder for a static array or a one-off JSX prop object. In those cases, direct code is cleaner.
