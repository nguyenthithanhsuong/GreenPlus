# GreenPlus — Docker migration 005 tương ứng với Supabase 0019

**Phạm vi:** Docker 3-tier sandbox hiện tại, PostgreSQL 16; bổ sung nền tảng RBAC, Audit Log, ảnh khuyến mãi và theo dõi version cho **5 storage scopes**. Không chạy các tệp SQL này trên Supabase. Không chuyển hướng production.

**Quan trọng:** Đây là **functional schema adaptation của Supabase 0019**, không phải bản sao đầy đủ của Supabase `0001`–`0019`. Docker demo **chưa** có toàn bộ bảng `users`, `stores`, `batches`, `prices`, `orders`, `inventory` chuẩn, Supabase Auth, server authorization, tenant RLS/JWT hay tất cả endpoint nghiệp vụ. Giữ nguyên các hệ thống hiện tại. Các trường `store_members.user_id`, `audit_logs.actor_id`, `promotions.created_by` trong Docker vẫn chỉ là UUID — chưa được liên kết đến user thực; không dùng chúng để quyết định quyền truy cập.

## File thực thi

| Storage | File SQL mới | Schema |
| --- | --- | --- |
| Shared DB | `docker/three-tier/sql/shared/005_rbac_audit_promotions.sql` | `public`, `pro_a`, `pro_b` |
| Enterprise A DB | `docker/three-tier/sql/enterprise-a/005_rbac_audit_promotions.sql` | `public` |
| Enterprise B DB | `docker/three-tier/sql/enterprise-b/005_rbac_audit_promotions.sql` | `public` |

**Không** đổi, không xóa `001`–`004`, `005_postgrest_authenticator.sql`, `docker-compose`, volumes hoặc secrets. SQL `005` dùng `BEGIN/COMMIT`, `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, index, foreign key scope `(store_id,product_id)`, trigger rebuild có tên định trước. Có thể chạy lại SQL `005`; trigger không nhân đôi. `public.demo_schema_migrations` ghi dấu theo từng schema.

## Triển khai trên Windows PowerShell, từ root GreenPlus

### 1) Xác định đúng môi trường và sao lưu

Sao lưu PostgreSQL trước lần áp dụng đầu tiên. Đảm bảo đang ở **Docker lab** (`docker/three-tier`) chứ không phải database Supabase hoặc VPS production. Nếu stack đang dừng, có thể chỉ khởi động ba database để tạo backup (không cần `npm run docker:three-tier:up` trước khi backup dữ liệu cũ):

```powershell
# Từ root GreenPlus; cần docker/three-tier/.env đã được cấu hình.
docker compose --project-directory docker/three-tier up -d shared-db enterprise-a-db enterprise-b-db
if ($LASTEXITCODE -ne 0) { throw "Không khởi động được Docker DB" }

$backupDir = Join-Path (Get-Location) ("greenplus-pre005-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$dbs = @(
  @{ service = 'shared-db'; database = 'greenplus_demo' },
  @{ service = 'enterprise-a-db'; database = 'enterprise_a' },
  @{ service = 'enterprise-b-db'; database = 'enterprise_b' }
)
foreach ($db in $dbs) {
  $cid = (docker compose --project-directory docker/three-tier ps -q $db.service).Trim()
  if ($LASTEXITCODE -ne 0 -or -not $cid) { throw "Không tìm thấy container $($db.service)" }
  $temp = "/tmp/greenplus-pre005-$($db.database).dump"
  docker exec $cid pg_dump -U postgres -d $db.database -Fc -f $temp
  if ($LASTEXITCODE -ne 0) { throw "pg_dump thất bại: $($db.database)" }
  $output = Join-Path $backupDir "$($db.database).dump"
  docker cp "${cid}:${temp}" $output
  if ($LASTEXITCODE -ne 0 -or (Get-Item $output).Length -eq 0) { throw "Backup không hợp lệ: $output" }
  Write-Host "Backup OK: $output"
}
```

Lưu 3 file `.dump` ở nơi an toàn; backup mới chỉ là bước đầu, cần thử restore vào môi trường khác trước khi sử dụng như phương án khôi phục production.

### 2) Áp dụng migration

```powershell
npm run docker:three-tier:migrate
if ($LASTEXITCODE -ne 0) { throw "Migration Docker 005 thất bại — xem log, không xóa volume" }
```

Script tự chạy SQL `005` lần lượt trên **3 database** và xác minh **5 scopes**. Không chạy `npx supabase db push` ở bước này. Nếu báo `relation ... does not exist` cần hoàn thành SQL `002`–`004` của Docker trước và chạy lại migration. Cách đơn giản sau khi có backup là `npm run docker:three-tier:up`: wrapper tự áp dụng `002`, `003`, `004`, rồi `005`; không xóa volume.

### 3) Kiểm tra schema và transaction rollback

```powershell
npm run docker:three-tier:verify-migrations
if ($LASTEXITCODE -ne 0) { throw "Kiểm tra SQL 005 thất bại" }

# Tạo dữ liệu thử và tự ROLLBACK, không lưu thay đổi
npm run docker:three-tier:test-migrations
if ($LASTEXITCODE -ne 0) { throw "Thử trigger / FK SQL 005 thất bại" }

# Kiểm tra luôn gateway và commerce RPC khi toàn bộ stack đang chạy
npm run docker:three-tier:check
if ($LASTEXITCODE -ne 0) { throw "Docker runtime chưa đạt check tổng hợp" }
```

Nếu muốn khởi động lại toàn bộ Docker stack sau khi backup:

```powershell
npm run docker:three-tier:up
npm run docker:three-tier:check
```

### Supabase: giữ độc lập

Supabase vẫn dùng `supabase/migrations/0019_rbac_audit_foundation.sql`. **Không** dùng SQL Docker thay thế. Quy trình Supabase vẫn là `npx supabase migration list`, `npx supabase db push --dry-run`, đánh giá backup, rồi mới `npx supabase db push` khi được cho phép.

## Những phần đã tương ứng với Supabase 0019

- `roles`, `permissions` (58 keys như Supabase), `role_permissions`; seed `Admin/Manager/Employee/Customer/Shipper`; grant chuẩn theo `0019` cho ba role chính, không grant mọi quyền cho role tuỳ biến.
- `store_members` và `platform_admins` làm registry chuyển tiếp, **chưa** liên kết tới bảng `users` thật vì Docker demo chưa có dịch vụ danh tính.
- `audit_logs`: các cột cùng tên và index search/filter/time; trigger tại các bảng **thực có ở Docker** (`products`, `inventory_stock`, `commerce_orders`, `promotions` và `demo_*` trong shared), chỉ ghi summary không nhạy cảm. Trigger Docker không thể tạo trên `public.inventory`, `public.prices`, `public.orders`, `public.stores` của Supabase vì không có những bảng đó trong sandbox.
- `promotions` có `image_url`, status, thời gian, kiểu giảm giá, nguồn đề xuất; foreign key `(store_id,product_id)` chống gán promotion khác cửa hàng. `batch_id`/`suggestion_id` có cột nhưng chưa liên kết FK vì thiếu bảng `batches`/`promotion_suggestions`.
- `web_anon` không có quyền SELECT vào Audit Log, registry hay khuyến mãi. Các bảng nhạy cảm bật RLS không có public policy. Không cung cấp bảng Audit/Promotion trực tiếp cho browser/PostgREST.
- Lệnh kiểm tra phát hiện thiếu table, permission key, grant, trigger, image column, RLS và cấm quyền đọc không phù hợp. Probe nghiệp vụ dùng PostgreSQL transaction rồi `ROLLBACK`.

## Chưa đạt 'Supabase thế nào, Docker y như vậy' ở tầng sản phẩm

Docker vẫn là sandbox demo có gateway key dùng chung; chưa thực hiện per-user authentication, phân quyền theo tenant có JWT, PostgreSQL RLS nghiệp vụ, cùng hệ thống API của Web Admin/Web Client/Web Shipper, email/storage/realtime/AI và đủ 19 migration. **RBAC registry không có nghĩa là RBAC enforcement đã bật**; Dashboard/Admin Audit và API khuyến mãi ở các web app vẫn dùng Supabase service-role trong source hiện tại. Không bật production cutover hoặc trỏ web-client/shipper vào Docker chỉ dựa trên migration `005`.

Để đạt full parity cần một kế hoạch chuyển từ Docker sandbox sang backend thống nhất với Supabase: schema baseline đầy đủ, user/tenant identity, service authorization, các RPC/trigger đồng nhất và test hợp đồng trên cả hai DB; cần migration/đối chiếu dữ liệu thay vì copy toàn bộ SQL Supabase một cách mù quáng.
