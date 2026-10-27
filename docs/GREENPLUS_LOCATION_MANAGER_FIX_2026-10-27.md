# GreenPlus: Manager user tab + địa chỉ xác minh có fallback (27/10/2026)

## Phạm vi

- Manager: giao diện chỉ có tab `Nhân viên & Quản trị`; ẩn `Tất cả`/`Khách hàng`. Endpoint `GET /api/users` không trả Customer khi Actor là Manager, đồng thời bỏ các truy vấn quan hệ Orders/Default Customer không cần thiết. Admin vẫn có 3 tab.
- Admin tạo/sửa user: form vị trí có khu vực riêng, nút tra cứu, danh sách các ghim để chọn, map OSM xem trước, thông báo lỗi sát trường dữ liệu. Server tái tra cứu và chỉ chấp nhận `locationHint` khi trùng tọa độ của kết quả geocoder; không tin lat/lng thẳng từ client.
- Client hồ sơ: UI chọn kết quả và preview ghim cùng cách xác minh; sửa tên/email/điện thoại **không tra cứu lại địa chỉ** nếu địa chỉ không đổi và giữ nguyên tọa độ DB.
- Geocoder chung: Photon trước; nếu lỗi (gồm HTTP 429), timeout hoặc không tìm thấy kết quả đủ chi tiết thì thử Nominatim. Khoảng cách giữa các lượt gọi ngoài tối thiểu 1,2 giây *trong từng process*, giới hạn hàng đợi, de-duplicate yêu cầu cùng địa chỉ, cache thành công 24 giờ. Chỉ gọi khi người dùng bấm tìm hoặc lưu địa chỉ mới.
- Không cần migrations hoặc dependencies mới so với bản đã có Migration 0012.

## Cảnh báo vận hành

Photon `photon.komoot.io` và Nominatim `nominatim.openstreetmap.org` là dịch vụ cộng đồng **chỉ thích hợp demo/lưu lượng thấp**. Nominatim giới hạn 1 request/giây **trên cả ứng dụng**, không phải trên từng Next.js worker; giới hạn nội bộ 1,2 giây/process KHÔNG đảm bảo tổng lưu lượng khi Client và Admin là các server khác nhau. Muốn triển khai thực tế hoặc có nhiều người dùng phải dùng geocoder tự host / nhà cung cấp có SLA và rate-limit tập trung. Không dùng autocomplete mỗi phím gõ, không chạy bulk/backfill tự động trên Nominatim công cộng.

Có thể thay endpoint tại file `.env` **duy nhất ở root**:

```dotenv
# Tùy chọn, nếu có dịch vụ geocode riêng
GREENPLUS_GEOCODER_ORIGIN=https://your-photon.example.org
GREENPLUS_GEOCODER_FALLBACK_ORIGIN=https://your-nominatim.example.org
```

Không khai báo các biến trên thì mặc định dùng Photon và fallback Nominatim công cộng, chỉ để kiểm thử. Muốn ngắt fallback mặc định, dùng `GREENPLUS_GEOCODER_FALLBACK_ORIGIN=off`. Khởi động lại Next.js sau khi chỉnh .env. Tên miền ví dụ không phải URL thực.

Tất cả địa chỉ nhập được chuyển tới nhà cung cấp geocoding khi tra cứu; cần thông báo người dùng và cân nhắc bảo vệ dữ liệu cá nhân. Kết quả địa lý là ước lượng, không chứng minh số nhà có thật hoặc người nhận cư trú tại đó. Các bản ghi cũ vẫn có thể chưa có tọa độ nếu chưa xử lý Migration 0012. Không tự điền tọa độ cũ bằng dữ liệu phỏng đoán.

Nếu BOTH upstream đều lỗi, API trả 503 rõ ràng và từ chối lưu địa chỉ mới, tránh tạo đơn không có tọa độ. Nếu không có kết quả đủ chi tiết, API trả 422; hãy nhập địa chỉ chi tiết hơn. Trường hợp vẫn không tìm được, cần geocoder có dữ liệu Việt Nam tốt hơn hoặc xác minh vị trí theo quy trình thủ công riêng, không xóa kiểm tra backend.

## Kiểm thử sau khi chép file

1. `npm run typecheck -w web-admin`
2. `npm run typecheck -w web-client`
3. `node --test tests/location-provider-manager-ui-regression.test.mjs tests/delivery-location.test.mjs tests/user-admin-shipper-regression.test.mjs`
4. `npm run dev:admin` và `npm run dev:client` ở các terminal riêng; mở User Management trong account Admin/Manager và hồ sơ Client.
5. Với Admin: chọn Customer, sửa địa chỉ, click tra cứu, chọn **kết quả thứ hai** (nếu có), kiểm tra bản đồ, lưu, kiểm tra `users.latitude`/`users.longitude` trong DB. Thử sửa tọa độ gửi trong DevTools; API phải từ chối nếu không thuộc kết quả tra cứu.
6. Với Manager: chỉ thấy tab Nhân viên & Quản trị; gọi thẳng `GET /api/users` không có Customer.
7. Với Client: sửa tên nhưng không sửa địa chỉ, lưu ngay, kiểm tra tọa độ trong DB không bị ghi `NULL`. Khi sửa địa chỉ, phải xác minh trước khi lưu.
8. Mô phỏng Photon lỗi 429 sẽ dùng fallback; nếu cả hai upstream bị hạn chế thì phải hiện lỗi rõ cạnh trường nhập, không báo thành công giả.

## Phạm vi kiểm thử đã thực hiện khi tạo bản vá

- Kiểm thử mục tiêu Node có mock API upstream (không gọi dịch vụ thật), cú pháp TS/TSX. Chưa chạy Next.js build/typecheck đầy đủ hoặc E2E trên Supabase Online do môi trường không có `node_modules` dự án. Không chứng nhận SLA của các dịch vụ geocode công cộng.
