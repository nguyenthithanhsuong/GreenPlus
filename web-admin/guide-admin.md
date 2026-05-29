# Web Admin Frontend Pattern Guide

Guide nay ghi lai cac pattern duoc phep dung trong `web-admin/frontend` va
`web-admin/src/lib`.

Pattern rule: chi dung pattern da co trong `web-client/frontend` hoac
`web-client/src/lib`. Khong them pattern moi neu `web-client` chua co.

## Public Imports

```tsx
import { UrlBuilder, ListFilterBuilder } from "@/lib/builder";
import { ProductManagementMapper } from "@/lib/mapper";
import { ProductManagementService } from "@/lib/singleton";
import { compose, withErrorBoundary } from "@/lib";
```

## Pattern Decisions

| Pattern        | Status | Used For                                      |
| -------------- | ------ | --------------------------------------------- |
| Builder        | Keep   | URL/path/query construction and list filters. |
| Singleton      | Keep   | Shared API service and feature API services.  |
| Mapper         | Keep   | API row/DTO to form or UI payload mapping.    |
| Decorator      | Keep   | Page/component error boundary wrappers.       |
| Observer/store | Keep   | Auth state subscriptions through Zustand.     |
| Strategy       | Keep   | Only when admin has real interchangeable behavior like payment/status logic. |
| Factory        | Avoid  | Not used in `web-client/frontend`.            |
| Composite      | Avoid  | Not used in `web-client/frontend`.            |
| Adapter        | Avoid  | Prefer Mapper when transforming data shape.   |

## 1. API URL Construction (Builder Pattern)

**Before:**

```tsx
const response = await fetch(`/api/products/${encodeURIComponent(productId)}`);
```

**After:**

```tsx
import { UrlBuilder } from "@/lib/builder";

const url = UrlBuilder.from("/api/products").segment(productId).build();
```

**Benefits:**

- Centralizes path encoding.
- Avoids repeated `encodeURIComponent`.
- Keeps service methods consistent.

## 2. Feature API Calls (Singleton Pattern)

**Before:**

```tsx
const response = await fetch("/api/products", { cache: "no-store" });
const data = await response.json();
```

**After:**

```tsx
import { ProductManagementService } from "@/lib/singleton";

const data = await ProductManagementService.getProducts();
```

**Benefits:**

- Components stay focused on state and UI.
- API error parsing is centralized in `ApiService`.
- Feature API names describe intent.

## 3. Form Mapping (Mapper Pattern)

**Before:**

```tsx
setForm({
  categoryId: product.category_id ?? "",
  name: product.name,
  description: product.description ?? "",
  unit: product.unit,
  imageUrl: product.image_url ?? "",
  nutrition: product.nutrition ?? "",
  status: product.status,
});
```

**After:**

```tsx
import { ProductManagementMapper } from "@/lib/mapper";

setForm(ProductManagementMapper.toFormValues(product));
```

**Benefits:**

- Keeps row-to-form conversion in one place.
- Keeps mutation payload shape consistent.
- Makes drawer components simpler.

## 4. Page Protection Against Runtime Errors (Decorator Pattern)

**Before:**

```tsx
export default ProductManagement;
```

**After:**

```tsx
import { compose, withErrorBoundary } from "@/lib";

export default compose(withErrorBoundary)(BaseProductManagement);
```

**Benefits:**

- Matches the `web-client` decorator pattern.
- Keeps page-level error UI reusable.

## 5. Confirmation Actions

Use the shared confirmation component for destructive or important actions.

```tsx
<ConfirmationActionDialog
  open={Boolean(deleteTarget)}
  title="Xoa san pham"
  message={`Xoa san pham "${deleteTarget?.name ?? ""}"?`}
  confirmTone="danger"
  onCancel={() => setDeleteTarget(null)}
  onConfirm={() => void deleteProduct()}
/>
```

**Benefits:**

- Avoids `window.confirm`.
- Keeps destructive action UX consistent across admin screens.

## Pattern Coordination

Recommended flow:

| Feature              | Flow                                           |
| -------------------- | ---------------------------------------------- |
| Product management   | `ProductManagementService` -> `ProductManagementMapper` -> JSX |
| Encoded API route    | `UrlBuilder` -> `ApiService`                   |
| Filtered admin lists | `ListFilterBuilder` -> filtered UI list        |
| Protected component  | `compose` -> `withErrorBoundary` -> page JSX   |
| Confirmation action  | Local state -> `ConfirmationActionDialog` -> service mutation |

## When To Add A Pattern

Add a pattern only when it is already represented in `web-client` and it solves
real repetition in `web-admin`.

- Use Builder for repeated URL/query construction or typed list filtering.
- Use Singleton for reusable API services.
- Use Mapper for DTO/row/form/payload transformations.
- Use Decorator for page/component wrappers such as error boundaries.
- Use Zustand store as the Observer/store pattern already present in both apps.

Do not add Factory, Composite, Adapter, Command, Repository, Hook-factory, or
any other new frontend pattern unless `web-client/frontend` already introduces
that same pattern first.
