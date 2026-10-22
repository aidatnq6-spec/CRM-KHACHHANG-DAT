# Next.js CRM Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Thay mã HTML cũ bằng CRM Next.js ngay thư mục gốc, ưu tiên khách sắp hết hạn 30 ngày.

**Architecture:** App Router, client Firebase modular SDK, UI responsive. Domain module thuần xử lý ngày Việt Nam, trạng thái, trùng, báo cáo; lớp import/export và repository tách khỏi UI. Giữ schema Firestore và dữ liệu thật, không phát hành trong lượt này.

**Tech Stack:** Next.js, React, TypeScript, CSS, Firebase, SheetJS, Lucide, Node test runner, Playwright kiểm tra cục bộ nếu khả dụng.

---

### Task 1: Nền tảng và bảo toàn tài nguyên

Files: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `app/layout.tsx`, `app/page.tsx`, `.env.example`.

1. Xác minh tài liệu chính thức và phiên bản npm bằng npm.cmd, tránh npm.ps1 bị execution policy chặn.
2. Trích cấu hình Firebase public, mẫu Zalo và ánh xạ Excel từ nguồn vào module dữ liệu; không đọc/đưa account.txt vào ứng dụng.
3. Cài dependency trong workspace, tạo App Router tối thiểu. App root phải chạy `npm.cmd run dev` và `npm.cmd run build`.

### Task 2: Domain và kiểm tra nghiệp vụ

Files: `lib/types.ts`, `lib/domain.ts`, `lib/domain.test.ts`, `lib/templates.ts`.

1. Test date boundary với ngày tham chiếu `2026-10-22`: hôm nay và +30 thuộc danh sách, +31/hôm qua/inactive/ngày sai không thuộc.
2. Triển khai ngày lịch Việt Nam, tìm kiếm không dấu, trạng thái, tự hẹn 2/3/1 ngày, trùng ID/điện thoại/tên, kiểm tra dữ liệu và báo cáo.
3. `npm.cmd test`: test boundaries, gia hạn LTV không đếm giao dịch hai lần, unknown fields và timestamp JSON.

### Task 3: Firebase và giao dịch

Files: `lib/firebase.ts`, `lib/repository.ts`, `components/crm-provider.tsx`.

1. Dùng config nguồn qua biến NEXT_PUBLIC với fallback public config để chạy bản chuyển đổi; chỉ cho email hiện tại; giữ rules.
2. Login email/Google, logout, listener collection users/uid/cksCustomers không bỏ bản ghi thiếu createdAt.
3. CRUD field-level, arrayUnion cho care/history, batch 400 với tiến độ; duplicate preview và xác nhận không ghi trước.
4. Loading/error/retry/unauthorized rõ ràng. Kiểm tra emulator hoặc fixture adapter cô lập, không ghi Firebase thật.

### Task 4: Shell và các luồng hằng ngày

Files: `components/crm-app.tsx`, `components/customer-list.tsx`, `components/customer-detail.tsx`, `components/customer-form.tsx`, `app/globals.css`.

1. Sidebar desktop/bottom nav mobile, palette navy nền xám nhạt, typography hệ thống, icon Lucide.
2. Default Nhắc hạn 30 ngày, bảng/thẻ cùng bộ lọc; search, pagination, selected bulk, mở hồ sơ và sửa/gia hạn.
3. Hôm nay, khách hàng và dashboard có điều hướng số liệu; dialogs accessible, Escape/focus/scroll lock, chặn double-submit.
4. Kiểm tra responsive 360/768/1440, keyboard, focus, error state và clear filters.

### Task 5: Zalo và dữ liệu

Files: `components/zalo-workspace.tsx`, `components/data-workspace.tsx`, `lib/transfer.ts`, `lib/transfer.test.ts`.

1. Trích nguyên mẫu và COL_MAP nguồn; sửa/preview/reset/import/export mẫu localStorage với khóa cũ.
2. Tạo hàng loạt từ lựa chọn; clipboard và link Zalo, log đúng hành động sao chép, không báo đã gửi.
3. Excel động, chọn sheet, dò header nhiều dòng, xem trước lỗi/trùng và chế độ bỏ qua/cập nhật trùng trước commit.
4. JSON export tương thích nguồn, bảo toàn IDs/timestamps/unknown fields khi restore; chặn ID sai, confirm preview, batches.
5. Dữ liệu cần sửa có bộ lọc và mở editor; xóa riêng/selected/all có xác nhận.

### Task 6: Báo cáo và bàn giao

Files: `components/reports.tsx`, `README.md`, `docs/feature-parity.md`.

1. KPI, funnel, packages, forecast, monthly totals, LTV và hiệu quả chăm sóc; in PDF qua print CSS.
2. `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run build`; browser smoke với fixture có cờ môi trường chỉ local.
3. Ghi phần chưa kiểm chứng với live Firebase. Không mở account.txt/backup thật để đưa vào browser tests.
4. Sau kiểm tra, xác minh absolute path các mục trong workspace rồi Remove-Item -LiteralPath cho v1–v17, HTML cũ, public mobile và script/cấu hình Firebase Hosting cũ không dùng. Giữ firestore.rules, dữ liệu và tài khoản; ignore chúng trong git.
5. Kiểm tra tree và build cuối; bàn giao lệnh chạy cùng phạm vi hoàn tất.

## Execution

Thực hiện tuần tự trong phiên hiện tại theo chỉ đạo triển khai. Không tạo worktree vì repo chưa có commit và người dùng yêu cầu mã ngay thư mục gốc. Skill executing-plans không có trong catalog/local skills; dùng các bước kiểm chứng trên trực tiếp. Không commit dữ liệu tài khoản/backup, không tự publish.
