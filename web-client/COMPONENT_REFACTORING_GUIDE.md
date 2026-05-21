# Frontend Components Refactoring Guide

## Quick Reference: Which Pattern for Which Component

| Component Type   | Pattern              | Benefit                                  |
| ---------------- | -------------------- | ---------------------------------------- |
| Payment page     | Strategy + Decorator | Dynamic payment methods, auth protection |
| Forms            | Builder + Composite  | Reusable config, nested fields           |
| Dialogs/Modals   | Factory              | Dynamic creation, registry-based         |
| Protected routes | Decorator            | withAuth, withLoading                    |
| Complex lists    | Strategy             | Different render strategies              |
| API calls        | Singleton + Adapter  | Cache, transform responses               |

---

## Refactoring Examples

### 1. Payment Component (Strategy Pattern)

**Before:**

```tsx
const [paymentMethod, setPaymentMethod] = useState<"cod" | "momo" | "vnpay">(
  "cod",
);

// Hardcoded options
[
  { value: "cod", label: "COD", icon: "C" },
  { value: "momo", label: "MoMo", icon: "M" },
  { value: "vnpay", label: "VNPay", icon: "V" },
];
```

**After:**

```tsx
import { PaymentStrategyFactory } from "@/lib/strategy";

const availablePaymentMethods = useMemo(
  () => PaymentStrategyFactory.getAvailableMethods(),
  [],
);

// Use in JSX
{
  availablePaymentMethods.map((method) => (
    <button key={method.id} onClick={() => setPaymentMethod(method.id)}>
      {method.icon} {method.displayName}
    </button>
  ));
}
```

**Benefits:**

- ✅ Add new payment methods without changing component
- ✅ Each strategy self-contained
- ✅ Easy testing per strategy

---

### 2. Orders Component (Decorator Pattern)

**Before:**

```tsx
function Orders() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
    setIsAuthorized(true);
    setIsLoading(false);
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthorized) return <AccessDenied />;

  return <OrdersList />;
}
```

**After:**

```tsx
import { withAuth, withErrorBoundary, compose } from "@/lib/decorators";

const BaseOrders = () => <OrdersList />;

export default compose(withErrorBoundary, (Component) =>
  withAuth(Component, "user"),
)(BaseOrders);
```

**Benefits:**

- ✅ Cleaner component logic
- ✅ Reusable across all pages
- ✅ Composable decorators

---

### 3. Product Detail Component (Builder Pattern for Forms)

**Before:**

```tsx
const [formData, setFormData] = useState({
  quantity: 1,
  selectedMode: "normal",
  notes: "",
  subscriptionDays: 30,
});

// Manual field handling
```

**After:**

```tsx
import { FormBuilder, ModalBuilder } from "@/lib/builder";

const purchaseForm = new FormBuilder()
  .addField({
    name: "quantity",
    type: "number",
    label: "Số lượng",
    required: true,
    defaultValue: 1,
    validation: (v) => (v < 1 ? "Phải >= 1" : null),
  })
  .addField({
    name: "selectedMode",
    type: "select",
    label: "Mô thức mua",
    options: [
      { label: "Mua thường", value: "normal" },
      { label: "Đăng ký", value: "subscription" },
    ],
  })
  .setTitle("Thêm vào giỏ")
  .onSubmit((values) => addToCart(values))
  .build();
```

**Benefits:**

- ✅ Config-driven forms
- ✅ Built-in validation
- ✅ Easy to change fields without code

---

## Migration Checklist

### Phase 1: Setup (Done)

- [x] Create pattern implementations
- [x] Export from central index
- [x] Create examples

### Phase 2: High-Priority Components

- [ ] Payment.tsx → Strategy + Decorator
- [ ] Orders.tsx → Decorator
- [ ] ProductDetail.tsx → Builder
- [ ] Dashboard.tsx → Decorator

### Phase 3: Medium-Priority Components

- [ ] Profile.tsx → Decorator
- [ ] OrderDetail.tsx → Composite
- [ ] CartItems → Factory (item components)

### Phase 4: Low-Priority Components

- [ ] Category.tsx
- [ ] GreenCreator.tsx
- [ ] Subscriptions.tsx

---

## Step-by-Step Refactoring Template

### For Payment-like Components (Strategy)

```tsx
// 1. Import
import { PaymentStrategyFactory } from "@/lib/strategy";

// 2. Get methods
const methods = useMemo(() => PaymentStrategyFactory.getAvailableMethods(), []);

// 3. Use in JSX
methods.map((method) => (
  <div key={method.id}>
    <h3>{method.displayName}</h3>
    <p>{method.description}</p>
  </div>
));
```

### For Protected Routes (Decorator)

```tsx
// 1. Separate base component
const BaseComponent = () => <div>Content</div>;

// 2. Apply decorators
export default compose(
  withErrorBoundary,
  (Comp) => withAuth(Comp, "user"),
  (Comp) => withLoading(Comp),
)(BaseComponent);

// 3. Use
<BaseComponent isLoading={loading} />;
```

### For Complex Forms (Builder)

```tsx
// 1. Define form config
const myForm = new FormBuilder()
  .addField({ name: "x", type: "text", label: "X" })
  .onSubmit(handleSubmit)
  .build();

// 2. Pass to form component
<DynamicFormExample
  fields={myForm.fields}
  title={myForm.title}
  onSubmit={myForm.onSubmit}
/>;
```

---

## Common Patterns in Existing Code

### ✅ Already Using Patterns

- Services (Singleton)
- Adapters (Adapter Pattern)
- useAuthStore (Observer)

### 🔄 Ready to Refactor

- Payment method selection → Strategy
- Route protection → Decorator
- Form building → Builder

### 📋 Can Enhance

- Dialog boxes → Factory
- Reusable form fields → Composite
- Component variants → Factory

---

## Implementation Order

**Week 1 - Quick Wins:**

1. Payment.tsx - Strategy Pattern
2. Add withAuth to protected routes
3. Create simple Factory for dialogs

**Week 2 - Forms:** 4. ProductDetail.tsx - Builder for purchase form 5. Profile.tsx - Decorator pattern 6. Orders list - Strategy for status display

**Week 3 - Polish:** 7. Composite forms for complex cases 8. Extract shared patterns 9. Document patterns used

---

## Testing Strategy

Each pattern should be tested:

```typescript
// Factory Pattern
const dialogConfig = DialogFactory.createDialog({...});
expect(dialogConfig.component).toBeDefined();

// Builder Pattern
const form = new FormBuilder().addField(...).build();
expect(form.fields.length).toBe(1);

// Strategy Pattern
const strategy = PaymentStrategyFactory.getStrategy('cod');
const result = await strategy.process(context);
expect(result.success).toBe(true);

// Decorator Pattern
const Wrapped = withAuth(Component, 'admin');
expect(Wrapped).toBeDefined();
```

---

## Maintenance & Scaling

### Adding New Payment Method

```typescript
// Just register new strategy
PaymentStrategyFactory.registerStrategy("crypto", new CryptoStrategy());
// Payment component automatically supports it!
```

### Adding New Dialog Type

```typescript
// Register in component
DialogFactory.registerDialog("warning", WarningDialog);
// Use anywhere without code changes
```

### Adding New Form Field Type

```typescript
// Create field component
class DateRangeField extends FormComponent { ... }
// Use in FormBuilder
.addField({ name: 'dates', type: 'dateRange', ... })
```
