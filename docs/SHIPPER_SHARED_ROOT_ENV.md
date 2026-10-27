# GreenPlus: dùng duy nhất `.env` ở thư mục gốc

## Phạm vi

- Web Client: Next.js + API riêng, cổng **3000**.
- Web Admin: Next.js + API riêng, cổng **3001**.
- Web Shipper: Next.js + API riêng, cổng **3002**.
- Tất cả đọc `GreenPlus/.env` cho cấu hình môi trường. Shipper không gọi API của Admin hay Client.
- `web-shipper/next.config.ts` dùng `dotenv` giống `web-admin/next.config.ts` và `web-client/next.config.ts`.

## Áp dụng lần đầu

Trong VS Code PowerShell, đứng ở thư mục gốc GreenPlus:

```powershell
node scripts/setup-shipper-env.mjs
npm run dev:shipper
```

Script chỉ thêm `SHIPPER_SESSION_SECRET` ngẫu nhiên (nếu chưa có) vào `.env` gốc. Script không in secret, không ghi đè các biến Supabase, không tạo `.env` mới; chạy lại sẽ không đổi secret đang hợp lệ. Session hiện tại có thể mất hiệu lực nếu bạn chủ động đổi secret.

Trong `.env` gốc cần có:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
SHIPPER_SESSION_SECRET=GENERATED_BY_SETUP_SCRIPT
```

Đây là **tên biến và ví dụ**, không phải giá trị thực. Không commit `.env` lên Git. Không thêm tiền tố `NEXT_PUBLIC_` cho `SUPABASE_SERVICE_ROLE_KEY` hoặc `SHIPPER_SESSION_SECRET`.

## Xử lý cấu hình cũ

Sau khi đã đảm bảo dữ liệu môi trường cần thiết có trong `.env` gốc, có thể xóa `web-shipper/.env.local` hoặc `web-shipper/.env` nếu trước đó bạn tự tạo. File `web-shipper/.env.example` cũ chỉ là tài liệu mẫu; không còn cần thiết, có thể xóa. Không xóa `.env` ở thư mục gốc. Khởi động lại Web Shipper sau khi sửa `.env`.

Không dùng `GREENPLUS_SHIPPER_API_BASE_URL` vì Web Shipper sử dụng API riêng tại `http://localhost:3002/api`.

## Docker Compose

`docker compose` chạy từ thư mục gốc tự đọc `.env` gốc và truyền ba biến trên vào container Web Shipper. Không cần cấu hình môi trường riêng cho từng app. `.env` bị loại khỏi Docker build context và không nằm trong image.

## Kiểm tra

```powershell
node --test tests/shipper-root-env.test.mjs
npm run dev:shipper
```

Truy cập `http://localhost:3002/login` khi Web Admin (3001) và Web Client (3000) đang tắt. Đăng nhập phải sử dụng tài khoản có vai trò Shipper đang hoạt động trong database GreenPlus. Cần kiểm thử thực tế với Supabase của bạn trước khi kết luận luồng đăng nhập ổn định.
