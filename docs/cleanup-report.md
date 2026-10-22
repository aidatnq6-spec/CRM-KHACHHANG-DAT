# Dọn tài nguyên cũ

Đã đối chiếu imports, đường dẫn tải file, cấu hình build và scripts của ứng dụng Next.js trước khi dọn.

## Đã dọn khỏi thư mục làm việc

- Hai file Excel `CRM_CKS_2026-05-16 (1).xlsx`, `MAU_Import_KhachCKS (2).xlsx`: không phải tài nguyên runtime. File mẫu mới được tạo trực tiếp bằng `exportExcel` trong ứng dụng.
- Ba JSON sao lưu trong thư mục gốc và `backup/`: không được ứng dụng tự đọc. Dữ liệu đang dùng được lấy từ Firestore sau đăng nhập.
- `firebaseConfig.txt`: trùng cấu hình đang có trong `.env.local` và module Firebase.
- `.firebase-cli-config/`: cấu hình CLI của luồng triển khai cũ, không được scripts hiện tại sử dụng.
- `debug.log`: nhật ký phát sinh không cần cho ứng dụng.
- Thư mục `backup/` rỗng sau khi dọn.

## Bảo toàn dữ liệu

Kiểm tra tự động từ chối xóa vĩnh viễn ba JSON chứa khoảng 300 khách mỗi bản. Phương án an toàn đã thực hiện: lưu nguyên vẹn hai Excel và ba JSON vào `archive/legacy-customer-data-2026-10-22.zip`, xác minh SHA-256 từng file bên trong ZIP khớp từng byte với file gốc, sau đó mới xóa các bản rời. ZIP vẫn được giữ và `archive/` bị loại khỏi Git. Không xóa dữ liệu trên Firebase.

## Giữ lại vì đang cần

- `.env.local`, `.env.example`, `lib/legacy-config.json`: cấu hình kết nối.
- `lib/legacy-meta.json`: giới hạn tài khoản và khóa lưu mẫu Zalo.
- `lib/legacy-templates.json`: mẫu tin nhắn mặc định.
- `lib/legacy-columns.json`: ánh xạ các cột để nhập Excel.
- `firestore.rules`: quy tắc bảo vệ dữ liệu.
- `public/sw.js`: worker chuyển tiếp để gỡ cache ứng dụng HTML đã cài trên trình duyệt cũ.
- Mã Next.js, dependencies, tests và tài liệu dự án.

Các JSON có tên `legacy-` trong `lib/` là cấu hình/nghiệp vụ đang được import trực tiếp, không phải bản sao lưu thừa.
