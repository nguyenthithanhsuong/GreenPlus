# Hướng dẫn áp dụng bản changes-only GreenPlus 2026-11-21

1. Sao lưu thư mục dự án hiện hành hoặc commit trước khi áp dụng. Nếu đã có thay đổi mới từ Codex/nhóm, so sánh từng file, **không giải nén đè thẳng lên code mới**.
2. Đặt file ZIP patch trong thư mục gốc GreenPlus; giải nén với cấu trúc đường dẫn được giữ nguyên. Ví dụ PowerShell:

```powershell
# Thực thi ở đúng thư mục gốc của repository
Copy-Item .\package.json .\package.json.before-ai-modes.bak
Expand-Archive -Path .\GreenPlus_ChangesOnly_2026-11-21.zip -DestinationPath . -Force
```

3. Mở `docs/GREENPLUS_CHANGE_REPORT_2026-11-21.md` để đọc danh sách hạng mục hoàn thành/một phần/chưa hoàn thành và những thay đổi hành vi quan trọng (đặc biệt payment 501).
4. Chạy kiểm thử:

```powershell
npm run dev:fast
# Terminal khác: chạy Docker AI nếu đã có .env.local hợp lệ
npm run dev:ai
node --env-file=.env.local scripts/ci/ai-local-health.mjs
Push-Location services/ai-assist
python -m pytest -q tests
Pop-Location
```

5. **Không** chạy reset volumes, Supabase `db push`, cập nhật hash migration lock hoặc cấp quyền SQL tùy ý cho LLM. Trạng thái migration 0016 nguyên gốc cần đối chiếu trước.

Các bước chạy Node test/Next build đầy đủ cần `npm ci` trong môi trường dev có quyền cài dependency. Patch không chứa `node_modules`, `.env`, API key hay dữ liệu database.
