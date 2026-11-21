# GreenPlus — Đợt tối ưu CI/CD, Docker và chất lượng mã nguồn (21/11/2026)

## Cơ sở đối chiếu

- Baseline: `GreenPlus_Source_2026-11-21(1).zip` + `GreenPlus_ChangesOnly_2026-11-21.zip` đã bàn giao ở lượt trước. Không tự nhận đây là working tree mới nhất trên Windows của người dùng.
- Tham chiếu byte migration: `GreenPlus_Source_2026-11-21.zip` (ZIP cùng ngày được tải lên trước), dùng để xác định lịch sử SQL đã khóa. Không gọi remote Supabase hoặc ghi dữ liệu.
- Mục tiêu đợt này: CI/CD Actions báo cáo trực quan; dịch vụ ngoài cảnh báo thay vì chặn build; giữ cổng bảo mật và chất lượng bắt buộc; tối ưu Docker runtime; điều tra những test FAIL do source.

## Yêu cầu và mức độ hoàn thành

| ID | Yêu cầu | Kết quả trong patch | Kiểm chứng / giới hạn |
|---|---|---|---|
| CI-01 | Có mục CI/CD riêng trong tab GitHub Actions | **Hoàn thành phần code** | `.github/workflows/ci-cd-reports.yml` nhận `workflow_run` từ CI/Production Verify/Staging Verify/Supabase Safe Migration Deploy, có bảng job và artifact JSON |
| CI-02 | Mỗi run CI có report kể cả khi lỗi | **Hoàn thành phần code** | Job `CI/CD Report` dùng `if: always()` + `$GITHUB_STEP_SUMMARY`, upload JSON |
| CI-03 | External provider fail chỉ WARNING | **Hoàn thành phần code** | 9 probe tách độc lập, `Promise.all`; thiếu biến hoặc HTTP/network lỗi được ghi WARNING và exit 0 ở advisory CLI; unit tests PASS |
| CI-04 | Không để cảnh báo dịch vụ ngoài che lấp lỗi bảo mật | **Giữ cổng chặn** | Docker remote tenant isolation được bật rõ ràng vẫn fail-closed; local RLS, immutable migrations và Docker smoke vẫn bắt buộc |
| CI-05 | Lint và typecheck riêng từng app, không bỏ bước typecheck nếu lint lỗi | **Hoàn thành workflow; chưa nghiệm thu thực tế** | Matrix Node 22; `steps.lint.outcome` cho phép typecheck tiếp tục thu lỗi, job vẫn thất bại; hiện chưa thể chạy ESLint/tsc với dependencies đầy đủ |
| CI-06 | Lệnh tổng hợp lỗi lint/typecheck 3 app | **Hoàn thành phần code** | `npm run ci:quality-report` chạy tuần tự sáu lệnh, xuất JSON và trả exit 1 nếu có lỗi; nếu chưa `npm ci`, báo rõ `BLOCKED` |
| CI-07 | Phục hồi các test gốc thất bại do CRLF | **Đã kiểm chứng** | Khôi phục đúng byte canonical của SQL 0016–0021 từ ZIP trước; LF cho Docker Three-tier YAML; bỏ script Shipper không dùng; Node tests 344/344 PASS |
| CI-08 | Không tái diễn drift migration trên Windows | **Hoàn thành phần code** | `.gitattributes` đặt LF cho SQL/YAML/MJS/TS và các file nguồn quan trọng |
| CI-09 | Docker web Admin/Client gọn và non-root | **Code hoàn thành, chưa Docker build thật** | Next standalone + Node 22 Alpine + user `greenplus` + HEALTHCHECK; tương đồng pattern Shipper |
| CI-10 | Docker build cache đồng nhất | **Hoàn thành cấu hình** | Cả 3 Dockerfile dùng cùng deps stage, cùng base Node 22, cùng danh sách workspace package.json; chia sẻ layer khi BuildKit có thể tái sử dụng cache |
| CI-11 | Bản phát hành Docker theo commit bất biến | **Hoàn thành cấu hình** | GHCR `sha-<40 ký tự>` thay cho 7 ký tự; production/staging verify đọc cùng tag. `latest/main` giữ tương thích cũ |
| CI-12 | Không rò secrets trong report | **Unit tests PASS** | Provider report chỉ chứa mã lỗi tổng quát / tên biến thiếu; không ghi token hay provider response body |
| CI-13 | Toàn bộ ESLint, TypeScript và Next builds xanh | **Chưa xác nhận** | Không có dependency tree (`npm ci` không truy cập được npm registry DNS trong môi trường kiểm tra); cần chạy trên Windows/GitHub runner |
| CI-14 | Docker/Next runtime thật, Supabase local, GitHub Actions thật | **Chưa xác nhận** | Không có Docker Engine, npm registry, GitHub token hay Supabase live ở môi trường đánh giá này |
| CI-15 | Tiếp tục tối ưu toàn bộ truy vấn/FE latency trên máy người dùng | **Ngoài phạm vi xác minh đợt này** | Cần profiler với `dev:fast`, request waterfall và CPU/RAM trước-sau |

## Test đã thực thi

| Nhóm | Kết quả |
|---|---|
| `node --experimental-strip-types --test tests/*.test.mjs` | **344/344 PASS** |
| `node --experimental-strip-types --test web-client/tests/*.test.mjs` | **14/14 PASS** |
| `npm test -w web-shipper` | **31/31 PASS** |
| `PYTHONPATH=services/ai-assist python -m pytest -q services/ai-assist/tests` | **26/26 PASS** |
| Parse cú pháp TypeScript/TSX trong Admin/Client/Shipper/packages bằng TS compiler API | **724 file, 0 parse errors** (không phải typecheck) |
| CI rule validator và Python YAML parser | **PASS** (không thay actionlint / `docker compose config`) |
| ESLint/tsc với dependencies thật; `next build` / Docker build | **BLOCKED / CHƯA KIỂM CHỨNG** |

## Nguyên nhân các Node test gốc từng FAIL

Bản ZIP thứ hai chuyển các file nguồn về CRLF, trong đó `0016_ai_assist_and_communications.sql` có SHA-256 khác manifest chỉ do `\r\n` thay vì `\n`. SQL gốc đã được lấy nguyên byte từ ZIP thứ nhất, và xác nhận toàn bộ nội dung sau chuẩn hóa `\r\n`->`\n` giống hệt. Tương tự với 0017–0021. Không sửa câu lệnh SQL nào, không gọi `supabase db push`, không cập nhật migration lock để che lỗi.

`docker/three-tier/compose.yaml` bị CRLF nên các Node tests đọc từng service theo `\n` không khớp; đã chuẩn hóa LF. File `scripts/setup-shipper-env.mjs` cũ tạo secret Shipper riêng, không còn được dùng trong scripts/package.json; bản vá xóa nó với mã SHA-256 được xác minh sau khi giải nén.

## Lệnh áp dụng patch (PowerShell)

Tại thư mục gốc GreenPlus, sau khi sao lưu/commit công việc hiện tại:

```powershell
Expand-Archive -Path .\GreenPlus_CI_CD_ChangesOnly_2026-11-21.zip -DestinationPath . -Force
npm run ci:post-apply
node scripts/ci/supabase-migration-gate.mjs --static
node scripts/ci/validate-ci.mjs
npm ci
npm run ci:quality-report
npm run build
```

`ci:post-apply` chỉ xóa `scripts/setup-shipper-env.mjs` khi SHA-256 đúng với file cũ được kiểm chứng; nếu file đã thay đổi thì **không xóa**, yêu cầu review thủ công.

Sau khi chạy `npm ci`, `ci:quality-report` hiển thị sáu kết quả (lint/typecheck Admin, Client, Shipper). Nếu một mục lỗi, giữ nguyên output để xử lý; script trả exit code 1 và **không** tự sửa source hoặc nới quy tắc lint.

Để kiểm tra Docker trên máy đã cấu hình `.env.local`:

```powershell
# Chỉ đọc/chuẩn hóa Compose; không khởi tạo DB, không xóa volume
docker compose --env-file .env.local -f docker-compose.ai.yml -f docker-compose.yml config --quiet

# Build ba Web; kiểm tra Next standalone thật
docker compose --env-file .env.local -f docker-compose.ai.yml -f docker-compose.yml build web-admin web-client web-shipper
```

CI dùng `supabase start` + `supabase db reset --local --no-seed` trong môi trường **disposable runner**; tuyệt đối không chạy các lệnh reset này trên Supabase production hoặc volume người dùng.

## Cách sử dụng trong GitHub Actions

1. Sau khi commit/push workflow lên nhánh mặc định, mở **Actions → CI**: chọn run và xem job **CI/CD Report** hoặc **Run Summary**. Ở từng job Admin/Client/Shipper có bảng ESLint, TypeScript, Build, kể cả khi lint thất bại.
2. Trong menu workflows bên trái, **CI/CD Reports** là workflow riêng: nhận các lần CI, Production Verify, Staging Verify và Supabase Safe Migration Deploy hoàn tất. Mở run tương ứng để xem kết luận gốc và từng job, tải `ci-cd-report` nếu cần JSON.
3. **Services CI** sẽ tạo `external-service-diagnostics` và cảnh báo theo từng provider khi push lên `main`. Trên nhánh khác / PR, live probes không chạy để tránh dùng secrets.
4. Một dòng **WARNING** cho Sentry/Better Stack/Vercel/Supabase Online không làm Docker publish fail. Riêng lỗi truy cập chéo tenant của Docker remote (nếu bật flag kiểm thử) và các lỗi mã nguồn/DB vẫn chặn.

**Lưu ý phát hành:** `Production Verify` chỉ xác nhận image và Vercel/PWA theo SHA, không tự triển khai Coolify/Vercel. Khi provider production thật không xác nhận triển khai, workflow verify phải báo lỗi; không được tuyên bố deploy thành công chỉ vì connectivity probe là advisory.

## Giới hạn và bước tiếp theo

- Chưa chứng minh Admin/Client standalone image build và chạy trên Docker thật. Cần kiểm tra `.next/standalone`, HEALTHCHECK, memory khi `npm run dev:all` và smoke test PWA sau patch.
- Chưa có log lint/typecheck từ Windows của người dùng; không thể cam kết sửa sạch lỗi TypeScript/ESLint chỉ dựa vào 724 file parse thành công. Yêu cầu log `npm run ci:quality-report` khi đã cài dependency thành công.
- Thay đổi SHA tag sang 40 ký tự có thể cần cập nhật các automation ngoài repo nếu đang hardcode `sha-7chars`.
- Không thay đổi `.env`, API keys, database thật hoặc chạy một migration mới trong đợt này.
