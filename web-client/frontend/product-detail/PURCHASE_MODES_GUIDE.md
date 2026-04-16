# Triển khai Mua Định Kì và Mua Chung - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Các tính năng mua định kì (subscription) và mua chung (group purchase) đã được triển khai thành công trong giao diện chi tiết sản phẩm. Người dùng giờ có thể lựa chọn ba hình thức mua hàng khác nhau trực tiếp từ trang chi tiết sản phẩm.

## 🎯 Các Tính Năng Chính

### 1. **Chế độ Mua Hàng Linh Hoạt**
- **Mua Thường (Giỏ Hàng)**: Mua sản phẩm thông thường
- **Mua Định Kì (Subscription)**: Đặt lịch giao hàng tự động
- **Mua Chung (Group Buy)**: Tham gia các nhóm mua chung để nhận giá ưu đãi

### 2. **Giao Diện Người Dùng**

#### **PurchaseModeSelector** (`PurchaseModeSelector.tsx`)
- Bộ lựa chọn 3 chế độ mua hàng
- Hiển thị biểu tượng và tên cho mỗi chế độ
- Chuyển đổi mượt mà giữa các chế độ
- Styling: Nút được highlight khi chọn, màu #51B788 (xanh GreenPlus)

```
🛒 Mua thường  |  📅 Mua định kì  |  👥 Mua chung
```

#### **SubscriptionModal** (`SubscriptionModal.tsx`)
- Modal cập nhật từ dưới lên (bottom sheet)
- Hiển thị thông tin sản phẩm
- Lựa chọn tần suất giao hàng:
  - Hàng tuần (tiết kiệm 10%)
  - Hai tuần một lần (tiết kiệm 15%)
  - Hàng tháng (tiết kiệm 20%)
- Thông tin chi tiết về lợi ích
- Nút xác nhận và hủy

**Tần Suất Giao Hàng**:
- `weekly`: Giao 1 lần/tuần
- `biweekly`: Giao 1 lần/2 tuần  
- `monthly`: Giao 1 lần/tháng

#### **GroupPurchaseModal** (`GroupPurchaseModal.tsx`)
- Modal hiển thị các nhóm mua chung sẵn có
- Thông tin nhóm bao gồm:
  - Tiến độ hiện tại vs mục tiêu
  - Giá ưu đãi (so với giá thường)
  - Số lượng tối thiểu
  - Hạn cuối tham gia
  - Số lượng còn lại
- Selector số lượng tham gia
- Thông báo khi nào sẽ giao hàng

## 🔧 Cấu Trúc File

```
web-client/frontend/product-detail/components/
├── ProductDetail.tsx                 (Thành phần chính)
├── PurchaseModeSelector.tsx          (Bộ lựa chọn chế độ)
├── SubscriptionModal.tsx             (Modal đặt lịch)
└── GroupPurchaseModal.tsx            (Modal mua chung)
```

## 🎨 Styling & Thiết Kế

### **Màu Sắc GreenPlus**
- **Primary Green**: #51B788 (nút chính, highlight)
- **Background**: #F9FAFB (card nền)
- **Text Dark**: #1A4331, #1E1E1E
- **Text Muted**: #6B7280

### **Bố Cục**
- **Max Width**: 500px (mobile-first)
- **Padding**: Responsive với clamp()
- **Border Radius**: 16px (container), 12px (card/button)
- **Animation**: 
  - slideUp: 0.3s (modal bottom sheet)
  - fadeIn: 0.2s (overlay)

## 🔌 API Integration

### **Subscription API**
```
POST /api/subscriptions
{
  userId: string
  productId: string
  frequency: "weekly" | "biweekly" | "monthly"
}

Response:
{
  subscriptionId: string
  userId: string
  productId: string
  schedule: string
  status: "active" | "paused" | "cancelled"
  startDate: string
  nextDeliveryPreview: string
}
```

### **Group Purchase API**
```
GET /api/group-purchases
Response: { groups: GroupBuy[] }

POST /api/group-purchases
{
  userId: string
  groupId: string
  quantity: number
}

Response:
{
  group_id: string
  user_id: string
  joined_quantity: number
  status: "open" | "success" | "failed" | "closed"
}
```

## 💾 State Management

**ProductDetail Component States**:
- `purchaseMode`: "cart" | "subscription" | "group"
- `showSubscriptionModal`: boolean
- `showGroupPurchaseModal`: boolean
- `cartActionLoading`: boolean (dùng chung cho tất cả hành động)
- `cartActionMessage`: string | null (thông báo chung)

## 🚀 Luồng Sử Dụng

### **Scenario 1: Mua Định Kì**
1. Người dùng chọn tab 📅 "Mua định kì"
2. Nút thay đổi thành "Đặt lịch"
3. Nhấn "Đặt lịch" → Mở SubscriptionModal
4. Chọn tần suất giao hàng
5. Nhấn "Xác nhận" → API call
6. Thông báo thành công → Đóng modal

### **Scenario 2: Mua Chung**
1. Người dùng chọn tab 👥 "Mua chung"
2. Nút thay đổi thành "Tham gia"
3. Nhấn "Tham gia" → Mở GroupPurchaseModal
4. Modal tải danh sách nhóm mua chung
5. Chọn nhóm & số lượng muốn tham gia
6. Nhấn "Tham gia nhóm" → API call
7. Thông báo thành công → Đóng modal

### **Scenario 3: Mua Thường**
1. Người dùng giữ nguyên tab 🛒 "Mua thường" (mặc định)
2. Nút là "Thêm vào giỏ hàng"
3. Nhấn → Thêm vào cart (như hiện tại)

## ✅ Kiểm Tra Chất Lượng

### **Styling Consistency**
- [x] Màu sắc tuân thủ GreenPlus palette
- [x] Border radius, padding, spacing thống nhất
- [x] Font size sử dụng typography scale consistent
- [x] Animations mượt mà (slideUp, fadeIn)
- [x] Responsive trên mobile 500px

### **Interaction**
- [x] Button states (active, hover, disabled)
- [x] Modal overlay click to close
- [x] Loading states & error handling
- [x] Success notifications
- [x] Auth validation (check isAuthenticated)

### **UX**
- [x] Clear visual hierarchy
- [x] Helpful descriptions (tiết kiệm %, hạn cuối, etc.)
- [x] Disabled state khi chưa login
- [x] Input validation (quantity min/max)
- [x] Progress indicators (nhóm mua chung)

## 🔐 Authentication

Tất cả các tính năng yêu cầu đăng nhập:
- Kiểm tra `isAuthenticated` trước khi thực hiện hành động
- Kiểm tra `routerUser?.user_id` trước API call
- Thông báo lỗi nếu chưa đăng nhập

```typescript
if (!isAuthenticated || !routerUser?.user_id) {
  setCartActionMessage("Vui lòng đăng nhập...");
  return;
}
```

## 📱 Responsive Design

- **Mobile-first approach**: Max width 500px
- **Bottom sheet modals**: Phù hợp với màn hình nhỏ
- **Touch-friendly buttons**: Height 44px+
- **Readable text**: Font size scalable với clamp()

## 🐛 Xử Lý Lỗi

Mỗi component có:
- Try-catch blocks cho API calls
- Error state display
- User-friendly error messages (tiếng Việt)
- Fallback UI khi dữ liệu tải thất bại

## 📝 Ví Dụ Sử Dụng

```tsx
// ProductDetail tự động render 3 components:
<PurchaseModeSelector 
  currentMode={purchaseMode} 
  onModeChange={setPurchaseMode} 
/>

<SubscriptionModal
  isOpen={showSubscriptionModal}
  productId={productId}
  productName={product?.name}
  price={product?.availablePrice}
  onClose={() => setShowSubscriptionModal(false)}
  onSubmit={handleSubscription}
/>

<GroupPurchaseModal
  isOpen={showGroupPurchaseModal}
  productId={productId}
  productName={product?.name}
  regularPrice={product?.availablePrice}
  onClose={() => setShowGroupPurchaseModal(false)}
  onSubmit={handleGroupPurchase}
/>
```

## 🎓 Backend Integration Points

### **Subscriptions Backend**
- Module: `/web-client/backend/modules/subscriptions/`
- Facade: `subscriptionFacade.subscribe(input)`
- Service: Xử lý validation, state management
- Observer pattern: Audit logging tự động

### **Group Purchases Backend**
- Module: `/web-client/backend/modules/group-purchases/`
- Facade: `groupPurchaseFacade.joinGroup(input)`
- Service: Xử lý capacity, state transitions
- Observer pattern: Audit logging tự động

## 📊 Database Schemas

### **SUBSCRIPTIONS Table**
- subscription_id (UUID, PK)
- user_id (UUID, FK)
- product_id (UUID, FK)
- schedule (string: weekly|biweekly|monthly)
- status (string: active|paused|cancelled)
- start_date (timestamp)
- created_at, updated_at (timestamps)

### **GROUP_BUYS Table**
- group_id (UUID, PK)
- product_id (UUID, FK)
- leader_id (UUID, FK)
- target_quantity (integer)
- current_quantity (integer)
- min_quantity (integer)
- discount_price (decimal)
- deadline (timestamp)
- status (string: open|success|failed|closed)

### **GROUP_BUY_MEMBERS Table**
- id (UUID, PK)
- group_id (UUID, FK)
- user_id (UUID, FK)
- quantity (integer)
- joined_at (timestamp)

## 🚧 Tương Lai Có Thể Cải Thiện

- [ ] Wishlist/Favorites integration
- [ ] Comparison tool (subscription vs regular vs group savings)
- [ ] Batch quantity preset buttons
- [ ] Real-time group member count updates
- [ ] Subscription management dashboard
- [ ] Auto-renew toggle per subscription
- [ ] Flexible delivery schedule changes
- [ ] Group chat/communication feature

---

**Last Updated**: 2026-04-16  
**Version**: 1.0 - Initial Deployment
