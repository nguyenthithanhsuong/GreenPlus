# Web Client Tech Map

Tài liệu này tổng hợp thư viện và công nghệ đang dùng trong web-client theo từng use case thực tế từ mã nguồn hiện tại.

## 1) Công nghệ lõi của web-client

- Framework: Next.js 16 (App Router), React 19, TypeScript 5
- UI styling: Tailwind CSS v4 (qua globals.css), utility class trực tiếp trong component
- Điều hướng: next/navigation, next/link
- State client: Zustand (auth state, session restore từ localStorage)
- Data fetching:
  - Chủ đạo: fetch gọi Next.js Route Handlers tại src/app/api
  - React Query đã được cài và bọc toàn app qua QueryClientProvider, nhưng hiện chưa thấy useQuery/useMutation ở các màn hình frontend chính
- Backend integration: Supabase qua @supabase/supabase-js ở tầng backend server (service role key)
- Shared domain/rule: @greenplus/supabase-shared (ví dụ access policy)
- Observability: @sentry/nextjs (client + server + edge)
- QR decode: jsqr (trang quét batch)
- Font: next/font (Geist, Geist Mono)
- Gói đã cài nhưng chưa thấy dùng trong code web-client hiện tại: axios, clsx

## 2) Use case theo màn hình và công nghệ sử dụng

### A. Authentication (Đăng nhập / Đăng ký)

- Route/use case:
  - /login
  - /register
- Thành phần chính:
  - src/components/auth/auth-screen.tsx
  - src/app/login/page.tsx
  - src/app/register/page.tsx
- Công nghệ dùng:
  - React client component + useState/useEffect
  - next/navigation (useRouter để redirect)
  - Zustand (useAuthStore: setAuth, isAuthenticated, initialized)
  - fetch gọi API:
    - POST /api/auth/sign-in
    - POST /api/auth/register
  - Tailwind CSS cho UI form

### B. Dashboard & Khám phá sản phẩm

- Route/use case:
  - /dashboard
- Thành phần chính:
  - frontend/dashboard/components/Dashboard.tsx
  - frontend/dashboard/components/NavigationBar.tsx
  - src/app/dashboard/page.tsx
- Công nghệ dùng:
  - next/navigation (useRouter, usePathname)
  - Zustand xác thực người dùng
  - fetch API:
    - GET /api/categories
    - GET /api/products
    - GET /api/cart
  - React state cục bộ để filter/sort/search
  - Tailwind CSS

### C. Danh mục và sản phẩm theo danh mục

- Route/use case:
  - /category
  - /category-products/[categoryId]
- Thành phần chính:
  - frontend/category/components/Category.tsx
  - frontend/category-products/components/CategoryProducts.tsx
  - src/app/category/page.tsx
  - src/app/category-products/[categoryId]/page.tsx
- Công nghệ dùng:
  - next/link cho điều hướng
  - Zustand cho thông tin user đăng nhập
  - fetch API:
    - GET /api/categories
    - GET /api/products
    - POST /api/cart
  - React hooks cho phân trang/filter/search

### D. Chi tiết sản phẩm + mua theo chế độ

- Route/use case:
  - /product-detail/[productId]
  - /product-detail?productId=...
- Thành phần chính:
  - frontend/product-detail/components/ProductDetail.tsx
  - GroupPurchaseModal.tsx
  - SubscriptionModal.tsx
  - PurchaseModeSelector.tsx
  - src/app/product-detail/[productId]/page.tsx
  - src/app/product-detail/page.tsx
- Công nghệ dùng:
  - fetch API:
    - GET /api/products/:id
    - GET /api/reviews
    - POST /api/cart
    - POST /api/subscriptions
    - GET/POST /api/group-purchases
  - Zustand để biết trạng thái đăng nhập trước khi mua
  - React state cho chọn mode mua, số lượng, dữ liệu modal

### E. Đơn hàng

- Route/use case:
  - /orders
  - /orders/[orderId]
- Thành phần chính:
  - frontend/orders/components/Orders.tsx
  - frontend/orders/components/OrderDetail.tsx
  - src/app/orders/page.tsx
  - src/app/orders/[orderId]/page.tsx
- Công nghệ dùng:
  - next/navigation (useRouter, useParams)
  - Zustand auth/session
  - fetch API:
    - GET /api/orders
    - GET /api/orders/:orderId
    - POST /api/orders/:orderId/cancel
    - POST /api/complaints
    - GET /api/cart
  - ConfirmationDialog cho hành động xác nhận

### F. Thanh toán

- Route/use case:
  - /orders/[orderId]/payment
  - /payment (redirect về /cart)
- Thành phần chính:
  - frontend/payment/components/Payment.tsx
  - frontend/payment/components/OrderPaymentPage.tsx
  - src/app/orders/[orderId]/payment/page.tsx
  - src/app/payment/page.tsx
- Công nghệ dùng:
  - next/navigation
  - Zustand auth
  - fetch API:
    - GET /api/orders/:orderId
    - POST /api/orders/:orderId/confirm-payment
    - POST /api/orders
    - GET /api/cart
  - Tailwind CSS

### G. Hồ sơ người dùng

- Route/use case:
  - /profile
  - /profile/my-profile
  - /profile/change-password
  - /profile/help
  - /profile/notification-setting
  - /profile/payment-method
  - /profile/score-history
- Thành phần chính:
  - frontend/profile/components/ProfileMenuPage.tsx
  - ProfileMine.tsx
  - ProfileChangePassword.tsx
  - ProfileSubPage.tsx
- Công nghệ dùng:
  - Zustand (updateUser, clearAuth, auth guard)
  - next/navigation
  - fetch API:
    - GET/PUT /api/account/profile
    - POST /api/account/change-password
  - React forms + Tailwind

### H. Truy xuất nguồn gốc / Quét QR batch

- Route/use case:
  - /profile/scan-batch
- Thành phần chính:
  - frontend/profile/components/ProfileScanBatchPage.tsx
- Công nghệ dùng:
  - jsQR để decode QR từ imageData
  - Web APIs:
    - navigator.mediaDevices.getUserMedia (camera)
    - canvas API để đọc frame ảnh
  - fetch API:
    - GET /api/traceability/batch/:code
    - POST /api/traceability/scan

### I. Cộng đồng Green Creators

- Route/use case:
  - /green-creators
  - /green-creators/[postId]
  - /green-upload
- Thành phần chính:
  - frontend/green-creators/components/GreenCreator.tsx
  - GreenCreatorDetails.tsx
  - frontend/green-upload/components/GreenUpload.tsx
- Công nghệ dùng:
  - Zustand cho user context
  - next/navigation
  - fetch API:
    - GET/POST /api/community/posts
    - GET/POST /api/community/posts/interactions
    - POST /api/community/posts/attachment
    - GET /api/account/profile
  - React state nhiều lớp cho feed, tương tác, upload

## 3) Tầng API và backend dùng trong web-client

- API layer: Next.js Route Handlers (src/app/api/**/route.ts)
- Mẫu xử lý: NextResponse + facade/service từ backend/modules
- Kết nối DB: backend/core/supabase.ts dùng @supabase/supabase-js với service role key
- Error handling: AppError pattern tại backend/core/errors.ts

## 4) Quan sát vận hành (Monitoring)

- Sentry tích hợp ở:
  - next.config.ts (withSentryConfig)
  - instrumentation.ts
  - instrumentation-client.ts
  - sentry.server.config.ts
  - sentry.edge.config.ts

## 5) Ghi chú nhanh

- Dù đã cấu hình QueryClientProvider (@tanstack/react-query), các màn hình frontend chính hiện đang dùng fetch + useEffect/useState là chủ yếu.
- Cart page hiện redirect sang luồng orders.
- Home page root hiện redirect sang login.

## 6) Design Pattern xác nhận trong web-client

### 1. State Pattern

- Áp dụng chính: `useAuthStore` (Zustand) quản lý trạng thái xác thực tập trung.
- Trạng thái điển hình: `initialized`, `isAuthenticated`, `user`, `session`, `token`, `expiresAt`.
- Hành vi theo state:
  - `restoreAuth()` khôi phục trạng thái từ localStorage.
  - `setAuth()` chuyển sang authenticated state.
  - `clearAuth()` reset về unauthenticated state.
- Ý nghĩa: UI/route guard ở nhiều màn hình đọc cùng một state source để quyết định redirect, hiển thị dữ liệu, hoặc chặn thao tác.

### 2. Facade Pattern

- Áp dụng ở API layer: route handlers gọi facade nghiệp vụ thay vì xử lý trực tiếp logic domain.
- Ví dụ:
  - `authFacade` trong các route auth.
  - `orderFacade` trong các route orders.
- Ý nghĩa: tách HTTP concerns (request/response) khỏi business logic, giúp route mỏng, dễ test và dễ mở rộng.

### 3. Observer Pattern

- Áp dụng qua cơ chế subscribe state của React/Zustand:
  - Components quan sát store qua selector `useAuthStore(...)` và tự re-render khi state đổi.
- Áp dụng thêm ở telemetry:
  - `onRouterTransitionStart` của Sentry theo dõi sự kiện chuyển route.
- Ý nghĩa: các thành phần không cần polling thủ công, mà phản ứng theo event/state change.

### 4. Strategy Pattern

- Áp dụng trong xử lý thanh toán/đặt hàng:
  - Chọn `paymentMethod` theo từng chiến lược (`cod`, `momo`, `vnpay`, `bank_transfer`) ở luồng orders API.
- Áp dụng trong mua hàng theo chế độ ở product detail:
  - Người dùng chọn mode mua (mua thường, subscription, group purchase), mỗi mode đi theo luồng API/logic khác nhau.
- Ý nghĩa: cùng một mục tiêu nghiệp vụ (mua/thanh toán) nhưng thay đổi thuật toán xử lý theo strategy được chọn.
