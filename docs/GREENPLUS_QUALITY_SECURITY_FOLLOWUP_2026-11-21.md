# GreenPlus — Quality / Performance / Dependency Security Follow-up (2026-11-21)

## Căn cứ và giới hạn

Căn cứ là `GreenPlus_Source_2026-11-21(1).zip` + 4 bản vá đã bàn giao trước đó (AI changes-only, CI/CD, storage/lint, AI typecheck), so với log Windows mới nhất trong `Pasted text(1).txt`. **Không giả định bản này là working tree chính xác của máy người dùng nếu đã có sửa trực tiếp sau đó.**

Log Windows **trước patch này** xác nhận Admin/Client/Shipper lint và typecheck đều PASS (6/6); Admin, Client, Shipper `next build --webpack` đều PASS qua các lượt chạy đã cung cấp. Lint vẫn còn 55 Admin + 59 Client + 1 Shipper = **115 warnings**, không phải 115 lỗi. `npm audit --omit=dev` lượt trước có **13 advisories: 10 moderate, 2 high, 1 critical**, với `next@16.3.8` trong phạm vi bị ảnh hưởng.

## Thay đổi trong patch

| ID | Hạng mục | Trạng thái / bằng chứng |
|---|---|---|
| QS-01 | Gỡ các import và biến không sử dụng ở Admin/Client | **Đã sửa source**, chưa chạy ESLint trên dependencies thật; không tắt lint rules |
| QS-02 | Loại bỏ state debug không hiển thị và nhiều lần cập nhật React khi fetch product | **Đã sửa source** và test regression; không thay đổi nguồn dữ liệu sản phẩm |
| QS-03 | Gỡ admin debug UI hiển thị dữ liệu auth/session nếu vô tình tái bật | **Đã thay bằng component `null`**, không đọc session |
| QS-04 | Không lộ nội dung exception qua `/api/health` của Admin; không spam log per health probe | **Đã sửa**; thông tin kỹ thuật vẫn gửi vào logger nội bộ ở nhánh lỗi |
| QS-05 | Fix `react-hooks/exhaustive-deps` cho subscription list | **Đã sửa** bằng `useCallback` với user ID truyền tường minh; test hồi quy |
| QS-06 | Điều hướng nội bộ ProductDetail không reload toàn trang | **Đã sửa** sang `router.push()` |
| QS-07 | Chuẩn bị Next.js security update đồng nhất | **Script + 5 tests PASS**, chưa chạy npm registry thật; giữ nguyên lockfile cho đến khi nâng cấp thành công |
| QS-08 | CI/CD external services advisory, core gate fail-closed | **Giữ nguyên**, `validate-ci` PASS; không thay đổi migration hay Docker |
| QS-09 | Sửa toàn bộ `<img>` warnings và đo Core Web Vitals | **Chưa hoàn thành**; cần audit ảnh/remote origins kích thước layout trước thay image loader |
| QS-10 | Nâng cấp dependency thật, quét lại audit, lint/typecheck/build Docker thật | **Chưa xác nhận**; chạy trên máy người dùng có npm registry và Docker |

Ghi chú: một handler logout trong `ProfileMine.tsx` chưa gắn trực tiếp vào UI vẫn được giữ để không phá hợp đồng đăng xuất an toàn đã được test trong `portal-session-page-security.test.mjs`. Không xóa hoặc vô hiệu hóa test bảo mật để dọn warning.

## Kiểm thử tại môi trường phân tích

- Root Node: **353/353 PASS**, gồm test bảo mật, performance cleanup và security upgrade.
- Web Client: **14/14 PASS**.
- Web Shipper: **31/31 PASS**.
- Python FastAPI AI: **26/26 PASS**.
- `node scripts/ci/validate-ci.mjs`: **PASS**.
- TypeScript syntax parse (không phải typecheck): không có lỗi cú pháp trên source đã sửa.
- ESLint/full typecheck/Next.js 16.4.6 production build/npm audit sau nâng cấp: **CHƯA CHẠY** ở môi trường này do npm registry DNS không truy cập được.

## Cài đặt changes-only

Tạo commit/backup trước. Giải nén changes-only vào root GreenPlus trên nhánh thử nghiệm. Kiểm tra `git diff` và tránh ghi đè những file đã có chỉnh sửa mới hơn source ZIP.

```powershell
cd F:\2026-2027\GreenPlus\GreenPlus
git status --short
Expand-Archive -Path .\GreenPlus_Quality_Security_ChangesOnly_2026-11-21.zip -DestinationPath . -Force
npm run ci:quality-report
npm test
npm run build
```

### Nâng Next.js an toàn (riêng, sau khi áp dụng code patch)

**Không** thay đổi `package-lock.json` bằng tay. Tool dưới đây cập nhật 7 trường version (`overrides.next` ở root và `next`/`eslint-config-next` tại 3 web workspaces), chạy `npm install --package-lock-only`, kiểm tra lock thực tế và **phục hồi phiên bản cũ nếu lệnh npm thất bại**. Không thay database hay chạy migration.

```powershell
# Xem trước, không sửa file
node scripts/ci/upgrade-next-security.mjs

# Có Internet/npm registry, thực thi nâng đồng bộ lên 16.4.6
npm run security:next:apply

# Cài lại chính xác dependency từ lock được tạo; kiểm tra sáu tác vụ
npm ci
npm run ci:quality-report
npm test
npm run build

# Audit thực tế: lỗi high/critical còn lại phải được phân tích và xử lý
npm audit --omit=dev
```

**Không chạy `npm audit fix --force`.** Một số advisory khác ngoài Next.js có thể còn sau khi nâng. Cần đọc output audit mới để quyết định nâng các package trực tiếp/gián tiếp cho đúng semver và test Docker. `next@16.4.6` phát hành 2026-11-09 và cao hơn mốc vá 16.4.1 của GHSA-2464-fhr4-w9xw; vẫn phải kiểm tra toàn bộ advisories khác.

## Nghiệm thu chưa đạt

- Không có bằng chứng từ profiler trên máy Windows về tốc độ sau patch; hiệu quả runtime là **dự kiến**, chưa định lượng.
- Warning `<img>` còn rải rác. Không thay `Image` hàng loạt vì biến `src` của ảnh user uploads và remote host cần cấu hình được cho phép, kích thước cần tránh layout shift.
- Không có kết quả production Docker builds, image scan, end-to-end hoặc kiểm tra user session thật sau patch này.
- Nếu script nâng cấp tạo lockfile mới, **commit cùng lúc 5 file**: root `package.json`, `package-lock.json`, `web-admin/package.json`, `web-client/package.json`, `web-shipper/package.json`, sau khi mọi gate PASS.
