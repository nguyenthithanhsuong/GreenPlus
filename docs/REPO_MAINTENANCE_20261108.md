# GreenPlus — script dọn legacy code, thư mục rỗng và quality gates

**Baseline:** `GreenPlus_Source_2026-11-08.zip`.

## Mục đích và giới hạn

Script `scripts/repo-maintenance.mjs` KHÔNG phải công cụ AI có thể khẳng định tất cả dead code. Nó tự động xử lý **20 ứng viên legacy được xác minh trên baseline** bằng SHA-256 và kiểm tra import/reference, đồng thời dọn thư mục source thực sự rỗng. File đã thay đổi nội dung hoặc còn consumer sẽ bị **bỏ qua**, không bị xóa ép.

Mặc định `scan` và `clean` chỉ xem trước. `--apply` không xóa vĩnh viễn: di chuyển file vào `artifacts/maintenance/quarantine/<batch>/`, có manifest để khôi phục. Quarantine được `.gitignore` bỏ qua và script `zip:source` không đóng gói, vì vậy trước khi commit cần xác nhận Git diff chỉ chứa các file xóa thực sự mong muốn. Chạy `restore` khi cần.

**Không bao giờ tự động đụng:** `.env`, secrets, `.git`, node_modules root, Supabase migrations, Docker SQL, database, Docker volumes, Next.js file-routing, server/auth/tenant routing được dùng thật, Android TWA configs và signing keys.

## Chạy một lệnh trên Windows (PowerShell)

```powershell
# Preview; không thay source
.\scripts\maintain-greenplus.ps1

# Tự động: quarantine + lint/typecheck/test/build + source ZIP
.\scripts\maintain-greenplus.ps1 -Apply

# Cũng lưu Flutter prototypes vào quarantine, dọn .next và reports
.\scripts\maintain-greenplus.ps1 -Apply -ArchiveFlutter -CleanGenerated

# Có thể thêm -DockerChecks khi Docker gateway local đã chạy.
# Nếu node_modules chưa được cài: thêm -InstallDependencies.
```

## Lệnh chạy (PowerShell tại root)

```powershell
# 0) Tạo Git commit hoặc backup an toàn trước khi sửa source.
# 1) Xem báo cáo checksum/reference (không sửa source)
npm run maintain -- scan

# 2) Xem danh sách file được phép cách ly và thư mục rỗng
npm run maintain -- clean

# 3) Dọn an toàn, tự chạy lint + typecheck + root/Client/Shipper tests + full build
#    Nếu kiểm thử thất bại, script tự phục hồi file đã cách ly trong batch đó.
npm run maintain -- all --apply --zip

# Có thể bổ sung các thư mục Flutter cũ chỉ khi đã thống nhất PWA/TWA thay Flutter
npm run maintain -- all --apply --legacy-flutter --zip

# 4) Khôi phục batch gần nhất nếu cần (trước khi xóa artifacts/quarantine)
npm run maintain:restore

# 5) In kiểm tra Docker không sửa DB (gateway phải đang chạy)
node scripts/repo-maintenance.mjs verify --build --docker
```

`--generated` chỉ thêm khi bạn muốn dọn `.next`, `.turbo`, workspace node_modules/Playwright reports sau khi test/build để chuẩn bị ZIP. Lệnh tạo ZIP đã loại trừ build artifacts và secrets ngay cả khi không chạy `--generated`:

```powershell
npm run maintain -- all --apply --legacy-flutter --zip --generated
```

**Quan trọng:** `all --apply` đòi root `node_modules`; nếu thiếu hãy `npm ci` trước. Lệnh `clean --apply` chỉ di chuyển source mà không tự chạy gate, chỉ dùng khi đã biết cách kiểm tra riêng; nên chọn `all`.

## Thay đổi CI/hygiene được đưa trong patch này

- `npm run test:client` chạy cả hai test trước đây bị bỏ sót (`checkout-idempotency-and-stock`, `store-multitenancy`).
- Root `test:release:static` và GitHub Actions **Client CI** chạy thêm Client tests. Client CI chuyển Node 20 → **Node 22**, cần thiết cho `--experimental-strip-types`.
- Test cũ không còn tham chiếu component legacy `Payment.tsx`; test checkout bảo đảm Idempotency-Key từ `Orders.tsx`, còn `OrderPaymentPage.tsx` xử lý thanh toán của một đơn đã tạo. Điều kiện giá được kiểm tra đúng hơn: hữu hạn và `> 0`.
- `npm run check-all` giờ **read-only với source** (lint, typecheck, tests, build), không tự format hoặc `eslint --fix`. `npm run fix:local` mới là lệnh chỉnh source có chủ đích.
- `scripts/package-source.mjs` loại trừ `supabase/.temp` để source ZIP không mang theo Supabase local metadata.

## Nhóm legacy mà script có thể cách ly

- One-time script: `scripts/remove-legacy-sentry-configs.mjs` (chỉ khi không còn hai Sentry config cũ).
- Admin: core `db.ts`, `event-bus.ts` cũ; các demo service/repository; `OrderCheckoutFacade` giả; ba `OrderState` skeleton cũ; report/header components không còn import.
- Client: hai component rất dài nhưng không còn được route sử dụng: `Payment.tsx`, `Profile.tsx` (test cũ được chuyển sang các màn hình hiện hành trước khi xóa).
- Shipper: `src/components/DeliveryMap.tsx` cũ và `src/frontend/shared/screen.styles.ts` không còn nhập.
- **Optional:** `mobile/customer_app/`, `mobile/shipper_app/` là Flutter prototypes, chỉ cách ly khi có `--legacy-flutter`. Giữ nguyên `mobile/client-twa/` và `mobile/shipper-twa/`.

Tệp allowlist checksum: `scripts/maintenance/legacy-candidates.json`.

## Windows EBUSY / interrupted quarantine recovery (08/11/2026)

If the old maintenance script reports `EBUSY: resource busy or locked` while moving `mobile/customer_app`, **the previously quarantined source files are NOT automatically restored by that old version**. Do not delete quarantine, do not rerun `--apply`, and restore the exact interrupted batch first:

```powershell
node scripts/repo-maintenance.mjs restore --batch=batch-2026-11-08T04-29-20-256Z-17368
npm run maintain -- scan
git status --short
```

The batch name above is from the 08/11/2026 incident; for another incident use the name printed in its own error message. The `restore` command refuses to overwrite existing files, preserves `.env` and database volumes, and is safe to rerun after a partial restore.

The updated script makes **optional** Flutter directory cleanup best effort: `EBUSY`/`EPERM`/`EACCES` results in `[FLUTTER SKIPPED]` with the folder left untouched. Source-file move failures remain fatal but trigger **immediate rollback**. The recovery journal writes a `pendingMove` before each move and records `status` transitions. A new apply refuses to begin while a new-format failed/interrupted batch remains unresolved. A new Flutter folder may be cleaned later after closing VS Code, Explorer, Flutter/Dart processes, and other tools locking it.

To run cleanup without touching the optional Flutter prototypes:

```powershell
.\scripts\maintain-greenplus.ps1 -Apply -CleanGenerated
```

To attempt Flutter cleanup too (locked folders will be skipped, not force-deleted):

```powershell
.\scripts\maintain-greenplus.ps1 -Apply -ArchiveFlutter -CleanGenerated
```

You can keep both Flutter directories as archived reference material if required. They are not part of the PWA/TWA release, and their removal is not a prerequisite to using the apps. Note: a Windows lock may also affect removal of an empty source directory; the updated script skips that optional step rather than failing the entire cleanup.

## Những hạng mục PHẢI refactor bằng code và test riêng

1. **Audit thật:** nhiều Observer no-op/console-only; cần DB-transactional audit, actor/store từ server-auth và test rollback. Script không được phép 'xóa no-op' nếu những class này vẫn đang được Facade gọi.
2. **Payment simulation:** Admin `payments/process` có strategy trả `true` giả. Cần đổi semantics, khóa ở production hoặc tích hợp provider thật; không được tự xóa route có thể đang có consumers.
3. **Test-only pages `/backend`:** phân quyền/gate production trước khi bỏ; UI test harness có thể vẫn hữu ích trong dev.
4. **Folder consistency:** refactor từng feature sang `src/features` / `src/server` sau khi có integration test, không rename hàng loạt `backend/`, `frontend/` và mọi alias.
5. **AI Assist:** trước tiên store-scoped inventory/batches/promotions, audit/outbox, Manager approve. AI không được trực tiếp thay đổi giá/tồn kho.
6. **Docker 3-tier và migration 0016:** không tự cutover Client/Shipper hoặc tự `db push`; so sánh schema/RLS/auth/production migrations và chạy E2E thực trước.

## Nghiệm thu

- Kiểm tra `git status --short` và `git diff --stat` sau chạy.
- `npm run lint`, `npm run typecheck`, `npm run test:release:static`, `npm run build` phải đạt; E2E và Docker kiểm thử trên môi trường riêng.
- Kiểm tra Client checkout/idempotency, Admin đơn hàng, Shipper delivery, tenant isolation và PWA/TWA cài đặt trên điện thoại trước deploy.
- Không xóa `artifacts/maintenance/quarantine/` trước khi quyết định giữ các thay đổi hoặc commit; nếu đã xóa thì dùng Git để restore.
