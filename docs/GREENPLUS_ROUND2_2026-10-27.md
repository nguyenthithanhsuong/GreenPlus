# GreenPlus — đợt 2 sửa phân quyền cửa hàng, Shipper, Dashboard và vị trí

Ngày: 2026-10-27. Bản vá **chỉ gồm các file khác với bản GreenPlus(1).zip đã áp các hotfix 26/10**.

## Những phần đã thay đổi

- Web Admin `withSentry` xác minh lại session và vai trò từ database trong mỗi request; đối với Manager/Employee, chọn cửa hàng hiện tại chỉ từ `store_members` đang active (Manager cũng có thể được xác định theo `stores.manager_id`). `users.store_id` chỉ là giá trị mặc định, không phải quyền truy cập. Client tự khai `x-greenplus-store-id` không vượt qua được kiểm tra membership.
- Với những bảng tenant như `suppliers`, `categories`, `products`, `batches`, `inventory`, `inventory_transactions`, `prices`, `orders`, `payments`, `deliveries`, `complaints`, `posts`, `reviews`..., tầng fetch PostgREST của service-role tự thêm `store_id` vào GET/PATCH/DELETE; kiểm tra và chèn `store_id` khi INSERT. Đây là cơ chế chuyển tiếp bao phủ các repository cũ, cần thay bằng repository tenant-aware và RLS DB-level lâu dài.
- `GET /api/users` của Manager truy vấn chỉ các Employee thuộc store đang chọn (qua membership), không còn tải tất cả user rồi lọc ở trình duyệt. Danh sách shipper khi phân công cũng lọc membership; trước khi phân công xác minh parent order nằm trong store được phép.
- Admin Dashboard thêm chỉ số toàn nền tảng, biểu đồ 6 tháng, phân khúc khách có đơn, đối tác và bài đăng chờ duyệt. Có thể duyệt/từ chối đối tác ngay tại Dashboard thông qua API chỉ Admin.
- `StoreManagement`: chỉ liệt kê tài khoản Manager đang hoạt động; xác nhận khi đổi cửa hàng mặc định của Manager đã có store; hiển thị full width, hồ sơ/đăng xuất ở Cài đặt. Migration `0011` thêm trigger transactional để cập nhật `users.store_id`, `store_members`, `store_settings` khi phân Manager; thêm đồng bộ membership khi tạo/sửa user nội bộ.
- Web Client: nếu GPS bị từ chối, khách có thể nhập địa chỉ để tra bằng Mapbox hoặc nhập trực tiếp tọa độ `10.82, 106.74`, xem gợi ý cửa hàng gần nhất và tự chọn. Mapbox cần `MAPBOX_ACCESS_TOKEN` trong **web-client/.env.local**; không có token vẫn cho nhập tọa độ và chọn cửa hàng trong danh sách.
- Các route công khai đăng nhập, kiểm tra Auth và Health được miễn tenant guard có chủ đích; các route chi tiết `orders/[orderId]`, `inventory/[inventoryId]` được bọc thêm guard.
- Web Shipper: xác minh tài khoản Shipper bằng role hiện tại từ DB, cải thiện báo lỗi và fallback API URL trong môi trường dev (`http://localhost:3001/api`). Không chuyển tiếp token do browser tự gửi khi đã dùng cookie. Dashboard Shipper tự đồng bộ mỗi 20 giây khi tab đang mở.
- Danh sách vận hành Web Admin áp dụng polling mỗi 30 giây và khi tab focus, không yêu cầu người dùng F5. **Đây là polling fallback, chưa phải Supabase Realtime/WebSocket**.

## Lệnh kiểm tra và cấu hình

```powershell
cd F:\2026CodingStuff\GreenPlus
npm install
node --experimental-strip-types --test tests/*.test.mjs web-shipper/tests/*.test.mjs
npm run typecheck
npm run lint
npm run build
```

Để dùng geocoding địa chỉ, cấu hình **chỉ phía server** trong `web-client/.env.local`:

```
MAPBOX_ACCESS_TOKEN=<your-mapbox-token>
```

Web Shipper chạy riêng ở cổng `3002`, Web Admin API cổng `3001`; trong `web-shipper/.env.local`:

```
GREENPLUS_SHIPPER_API_BASE_URL=http://localhost:3001/api
```

Kiểm thử đăng nhập phải dùng một tài khoản `users` có `status='active'`, `role_id` trỏ tới `roles.is_shipper = true` và mật khẩu khớp dữ liệu online/local. Không cần copy token thủ công.

**Migration bổ sung**: `supabase/migrations/0011_sync_manager_assignment.sql`. Test trên bản clone hoặc Supabase Local, backup online, kiểm tra trạng thái `0001–0010` và chạy `npx supabase db push --dry-run --linked` trước. Chỉ khi đủ điều kiện mới chạy `npx supabase db push --linked`. Không chạy reset trên online. Không tự áp migration nếu chưa rà trigger với dữ liệu thực tế.

## Checklist manual bắt buộc trước khi merge/deploy

1. Tạo 2 cửa hàng A và B, tài khoản Manager A, Manager B, Employee A, Employee B. Tạo dữ liệu sản phẩm, lô, kho, đơn, giao, khiếu nại ở hai store.
2. Đăng nhập Manager A, thử trực tiếp mọi GET/PATCH/DELETE id của Store B. Kết quả Store B không xuất hiện và không được thay đổi. Dùng header `x-greenplus-store-id` B phải bị 403. Kiểm tra `store_members` revoke cũng phải loại bỏ quyền ngay.
3. Đổi active store trong header khi Manager có nhiều membership; dữ liệu từng trang phải tương ứng store đã chọn.
4. Test Shipper: đăng nhập đúng/sai, role Customer/Admin, tài khoản bị khoá, nhận đơn của người khác, cập nhật trạng thái sai thứ tự, concurrency; test với môi trường Supabase thật.
5. Dùng Admin kiểm tra Dashboard tổng các store và duyệt đối tác; Manager/Employee phải bị 403 khi gọi `/api/platform/dashboard` hay `/api/platform/suppliers/{id}/review`.
6. Trên Client từ chối GPS, nhập địa chỉ (có token Mapbox), tọa độ thủ công (không cần token), chọn cửa hàng sau gợi ý. Kiểm tra API sản phẩm/giỏ hàng/checkout cũng scope đúng store. **Khoảng cách gợi ý đường chim bay không dùng để tính phí ship**.
7. Chạy `npm run typecheck`, `npm run lint`, `npm run build`, Playwright và test tích hợp local/online clone. Chưa có cơ sở khẳng định production-ready.

## Giới hạn cần xử lý tiếp

- Guard hiện tại chặn ở transport PostgREST qua service role cho **các API đã dùng `withSentry`**. Truy cập trực tiếp SQL/RPC, storage, các route chưa dùng wrapper, cache hoặc API Web Client ngoài Admin chưa được bao phủ. Đây **không thay thế RLS và ràng buộc FK có tenant**. Cần kiểm thử database thật, review từng mutation và bổ sung Phase B migration (`store_id NOT NULL`, composite FK, RLS/chính sách xác thực tenant) trước khi tuyên bố cô lập hoàn toàn.
- Báo cáo Admin lấy tối đa 10.000 orders ở đường đọc tạm thời và bật cảnh báo nếu vượt giới hạn. Doanh thu hiện dựa trên `orders.total_amount`, chưa phải báo cáo tiền thực thu từ kế toán/payments.
- Khi đổi Manager, `users.store_id` (cửa hàng mặc định) được chuyển; membership/quyền ở cửa hàng trước **không tự thu hồi** để hỗ trợ Manager đa chi nhánh. Nếu muốn chuyển hẳn, phải gán Manager thay thế cho cửa hàng cũ và thu hồi quyền cũ bằng luồng quản trị riêng.
- Polling 20–30 giây không phải realtime tức thì, có thể làm tăng số request; cần cache thích hợp, Supabase Realtime subscriptions với RLS an toàn, hoặc SSE authenticated khi triển khai thực tế.
- Mapbox cần token/quota và rate limiting production; không gửi địa chỉ nhạy cảm vào log.
- Chưa chạy Next.js build/typecheck thật hoặc login với Supabase thật trong môi trường bàn giao do thiếu node_modules, API credentials và local DB. Các kiểm tra Node static/unit không chứng minh DB security.
- **Mobile Customer/Shipper không nằm trong đợt vá Web này**.
