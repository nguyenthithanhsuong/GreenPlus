# GreenPlus — báo cáo kiểm tra và thay đổi (21/11/2026)

**Cơ sở:** `GreenPlus_Source_2026-11-21(1).zip`, không dùng snapshot cũ để kết luận hiện trạng. Ảnh slide giới thiệu ba mức AI không nằm trong ZIP; các mức bên dưới được triển khai theo lời mô tả mới của người dùng.

**Phạm vi:** Đây là PATCH/đợt 1 có kiểm chứng tĩnh và test, **không phải một bản hoàn tất tối ưu toàn bộ ứng dụng**. Không được đánh đồng trạng thái PASS unit test với thành công triển khai production, kết nối Supabase live, hay trải nghiệm người dùng trên Windows.

## 1. Bảng yêu cầu / nghiệm thu

| Mã | Yêu cầu | Trạng thái đợt 1 | Bằng chứng / Giới hạn |
|---|---|---|---|
| GP-01 | `dev:all` có lệnh rõ ràng, có đường chạy nhanh không migration | **Hoàn thành phần code** | `dev:all` alias giữ preflight; `dev:fast` chạy 3 Next.js, bỏ đồng bộ Docker; `dev:admin/client/shipper` chạy riêng |
| GP-02 | Rà soát chậm khi khởi động | **Một phần** | Xác định `dev` chạy Supabase preflight, Docker up/check, parity audit, inventory trước Turbo; chưa đo CPU/RAM Windows |
| GP-03 | Thấp: FAQ nhanh, tự báo không biết | **Hoàn thành phần code** | Bộ khớp lexical nhẹ, không khởi tạo sklearn; test sai chủ đề & no-hallucination |
| GP-04 | Trung bình: Docker RAG kết hợp FAQ, tự nhiên hơn | **Một phần** | TF-IDF Docker + mẫu diễn đạt an toàn, **chưa chạy mô hình sinh ngôn ngữ local**; không gọi LLM online |
| GP-05 | Cao: LLM online, có nguồn, fallback | **Một phần** | Chỉ mức Cao gửi question/FAQ đã duyệt tới HTTPS provider; bộ lọc số/URL mới là kiểm tra từng phần, không bảo đảm kiểm chứng ngữ nghĩa |
| GP-06 | Cao: xem dữ liệu đơn, kho, lịch, cơ sở dữ liệu | **Chưa triển khai** | Cần các read-only tools với truy vấn allowlist, session/role/store-scope, kiểm tra ownership và audit; **không** cấp SQL tùy ý cho LLM |
| GP-07 | Màn hình chọn ba mức ở Admin/Client/Shipper | **Hoàn thành phần code** | Ba chat UIs gửi level + locale; API kiểm tra giá trị trước khi chuyển sang Docker |
| GP-08 | Rà soát AI chatbot trả lời sai chủ đề | **Một phần** | Bổ sung từ khóa có ý nghĩa và test chặn nhầm `giờ mở cửa` / `đổi trả`; độ bao phủ câu diễn đạt đồng nghĩa chưa đánh giá bằng bộ câu hỏi thực |
| GP-09 | Tối ưu đường gọi database AI, tránh dữ liệu thừa | **Một phần** | Admin chat lấy đúng ba cột `id,question,answer`, giới hạn 75, thay vì lấy 1000 hàng gồm trường quản trị; chưa profiling số lần gọi toàn hệ thống |
| GP-10 | Log ngoài Sentry/BetterStack và rò rỉ dữ liệu | **Một phần** | Loại bỏ raw `console` response, files upload, raw exception; thay audit observer dạng console bằng telemetry tối giản; còn cần audit tất cả logs môi trường thật |
| GP-11 | Bảo vệ lỗi API và thanh toán mô phỏng | **Hoàn thành phần code** | Unknown exception ở Client trả lỗi chung; adapter thanh toán stub không xác nhận giao dịch; `/api/payments/process` trả 501 khi chưa tích hợp |
| GP-12 | Network/private key/TLS/mã hóa | **Một phần** | AI chỉ publish localhost:8100, dịch vụ HTTPS outbound, key server-to-server, Docker Web nhận DNS `ai-assist`; **HTTP trong Docker bridge chưa mã hóa**, chưa có mTLS, nonce chống replay, TLS reverse proxy production |
| GP-13 | Kiểm tra notification, alert, lỗi toàn ứng dụng | **Một phần** | Scanner mã nguồn tạo inventory 205 file; **không tương đương** test thông báo thực ở từng trạng thái UI |
| GP-14 | File MSG để quản lý tiếng Việt và tiếng Anh | **Một phần** | Một catalog `packages/ai-core/MSG.mjs` cho ba màn hình chat; các phần còn lại vẫn nhiều text hardcoded; nội dung FAQ tiếng Việt không tự động có bản dịch |
| GP-15 | Dark/light theme đồng bộ ba FE | **Chưa triển khai** | UI hardcode nhiều `bg-white`, `text-slate-*`, `style.background`; cần design tokens + theme provider + accessibility test trước khi bật toàn bộ |
| GP-16 | Tối ưu màn hình/topic tri thức AI | **Chưa triển khai** | Current AI knowledge có audience và review_status, chưa có taxonomy topic đầy đủ; thay đổi schema cần migration mới, không sửa migration cũ |
| GP-17 | Quy trình migration/kiểm chứng history | **Phát hiện vấn đề gốc; chưa sửa** | Source đã không khớp hash `0016_ai_assist_and_communications.sql` với migration lock + PG17 manifest; phải đối chiếu remote history trước |
| GP-18 | Full Docker + Supabase + LLM end-to-end | **Chưa kiểm chứng** | Không có Docker Desktop / secret / Supabase live trong môi trường review |
| GP-19 | Toàn hệ thống không duplicate API calls hoặc treo | **Chưa chứng minh** | Cần browser profiler, request-ID, Web Vitals và thông số CPU/RAM khi đồng thời chạy cổng 3000/3001/3002 |

Các trạng thái "Hoàn thành phần code" **không** có nghĩa là đã nghiệm thu end-to-end trên máy người dùng.

## 2. Kết quả test có đối chứng

- ZIP nguyên gốc: `node --experimental-strip-types --test tests/*.test.mjs` → **318/330 PASS; 12 FAIL**.
- Sau sửa: toàn bộ Node → **323/335 PASS; 12 FAIL**, tức **không thêm lỗi thất bại mới**. 5 Node tests mới PASS.
- Test Python AI sau sửa → **26/26 PASS** (bao gồm chặn false-match, ba mức, không gọi provider ở low/medium và chặn số liệu không có nguồn).
- TypeScript static syntax parser: các file TS/TSX thay đổi được parse thành công; **chưa** chạy `next build`, ESLint và TypeScript typecheck đầy đủ vì không có `node_modules` để resolve dependency.
- Docker Compose YAML parse: PASS; chưa chạy Docker thật.

Các FAIL trên ZIP gốc gồm migration hash/history, fixture migration CLI và PostgREST shell checks cùng kiểm tra config Shipper. Nên rà soát trên máy Windows trước khi quyết định thay đổi migrations. **Không được sửa checksum trong lock để ép test qua**.

## 3. Các thay đổi cần chú ý trước khi áp dụng

**Thanh toán:** Strategy MoMo/VNPay/COD hiện trong ZIP chỉ trả `true` giả lập. Patch chuyển sang trả `false` và API báo `PAYMENT_NOT_IMPLEMENTED` (HTTP 501) thay vì xác nhận thanh toán. Đây là thay đổi hành vi có chủ đích vì yêu cầu bảo mật. Phải thay bằng tích hợp nhà cung cấp + webhook/callback đã ký, kiểm tra số tiền/đơn và idempotency trước khi bật thanh toán thật.

**LLM online:** High chỉ là chế độ sinh câu trả lời theo FAQ, không có quyền query database/đổi đơn/chuyển tiền. Khi provider timeout, response fallback FAQ và có `degraded: true`. Không thể gọi đó là hệ thống chống hallucination tuyệt đối. Chỉ truyền context cần thiết, không đưa API key vào client.

**Bảo mật Sentry:** Tracing sample của Admin/Client giảm từ 1.0 xuống 0.1 ở production, 0 trong development; không chuyển request/user/breadcrumb cho Sentry. Cấu hình BetterStack bỏ console fallback và yêu cầu HTTPS. Tuy nhiên exception message vẫn có thể chứa nội dung không mong muốn: cần đánh giá chi tiết chính sách redaction thực tế của Sentry/BetterStack.

**Mạng:** Web chạy local trỏ AI tại `http://127.0.0.1:8100`. Web Docker dùng `http://ai-assist:8100` trên mạng Docker cùng project; khóa dùng biến môi trường server-side. Cổng host AI chỉ bind loopback. Đây là **mạng nội bộ không TLS**, tuyệt đối không tuyên bố mọi gói tin đã mã hóa. Triển khai production đa máy cần reverse proxy TLS/mTLS, firewall, proxy egress allowlist và quản lý/luân phiên secret.

**Migration:** Không có file SQL lịch sử nào bị sửa trong patch, không có `db push`, không `down -v`, không xóa volume. `dev:all` vẫn chạy preflight cũ và có thể fail trên snapshot này; dùng `dev:fast` để phát triển Web khi chưa xử lý được sai lệch migration.

## 4. Hướng dẫn dùng trên PowerShell sau khi sao lưu

```powershell
# Tại thư mục gốc GreenPlus, sau khi giải nén patch có giữ nguyên cấu trúc folder
npm run dev:fast      # Ba Web, bỏ chạy preflight/migrate Docker ở mỗi lần lập trình
npm run dev:admin     # Khi chỉ cần làm việc trên Admin
npm run dev:client    # Khi chỉ cần Client
npm run dev:shipper   # Khi chỉ cần Shipper

# Khởi chạy/kiểm thử riêng AI service
npm run dev:ai
node --env-file=.env.local scripts/ci/ai-local-health.mjs

# Khi chạy cả Web và AI bằng Docker: dùng cùng project và env file
# Chỉ chạy nếu các biến Supabase/Auth cần thiết đã được cấu hình:
docker compose --env-file .env.local -f docker-compose.ai.yml -f docker-compose.yml up -d --build

# Rà soát vị trí thông báo/lỗi theo source:
npm run audit:messages

# Test FastAPI (ở thư mục gốc):
Push-Location services/ai-assist
python -m pytest -q tests
Pop-Location
```

Dùng `npm run dev:all` khi **chủ đích** muốn preflight Supabase, đồng bộ/check migrations Docker Three-tier, audit và khởi chạy Web. Lệnh này không thay cho `dev:fast` trong vòng lặp chỉnh UI nhanh.

## 5. Đề xuất thứ tự sửa còn lại

1. **P0 — Quy trình migration:** Xác minh remote history và byte/hash migration SQL 0016, sửa nguồn lệch bằng cách phục hồi bản gốc đã triển khai hoặc tạo migration tiếp theo khi cần; không sửa các migration đã chạy.
2. **P0 — Quyền của AI Cao:** Thiết kế allowlisted read-only tools (`get_my_order`, `list_my_orders`, `get_delivery_schedule`, `inventory_summary`) có xác thực session, tenant scope, hạn chế trường dữ liệu, audit và không truy cập dữ liệu cá nhân của người khác. Cần kiểm thử prompt injection và bất kỳ write-action nào phải có user confirmation riêng.
3. **P0 — Network production:** MTLS hoặc HTTPS từ Web đến AI, không expose AI API ra public, signed requests/nonce để chống replay, rotation secrets, giới hạn provider egress.
4. **P1 — Tốc độ thực:** đo cold-start `dev:all`/`dev:fast`, CPU/RAM, network waterfall, duplication request IDs, xác minh Strict Mode effects và DB query profile. Tối ưu có số liệu đo trước-sau.
5. **P1 — Topic/Knowledge:** thiết kế taxonomy `topic` riêng và màn hình lọc/search/pagination, tạo migration mới theo quy định khi hash gốc đã sạch.
6. **P1 — MSG toàn ứng dụng:** chuyển text cứng dần sang namespace `vi/en` cho notifications, errors, API code và validation; không để API trả chuỗi localized thay cho mã lỗi ổn định.
7. **P1 — Dark/light:** tạo token palette xuyên ba Web, theme provider, hỗ trợ system/light/dark, persistence không nhạy cảm, kiểm tra contrast/SSR hydration.
8. **P2 — QA:** chạy e2e máy thật, security headers, CSP, session cookies, CSRF, RLS, Sentry/BetterStack redaction, tải lớn và kiểm tra tải lại offline/PWA.

## 6. Rủi ro chưa đóng

- Không có kết quả build/typecheck Next.js, Docker/Supabase live, chi phí/token LLM online, Web Vitals hay đo RAM trên Windows. Không nên đưa patch vào production nếu chưa có các bước này.
- Thêm RAG model offline thật (Ollama/vLLM/small quantized model) chưa được triển khai; mức Medium hiện là FAQ retrieval có câu dẫn, không phải local generative model.
- Ngôn ngữ tiếng Anh chỉ bao phủ UI chat và một số fallback/system prompt. FAQ đã duyệt vẫn trả nguyên văn ngôn ngữ nguồn trừ khi chế độ Cao dùng provider dịch/diễn giải.
