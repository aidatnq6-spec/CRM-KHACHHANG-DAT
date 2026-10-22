# CRM CKS

Ứng dụng Next.js thay thế `crm-cks-v2.html`, đặt trực tiếp trong thư mục gốc dự án. Giao diện tiếng Việt dùng trên máy tính và điện thoại. Sau đăng nhập mở danh sách khách sắp hết hạn từ hôm nay đến hết ngày thứ 30, tính theo lịch Việt Nam.

## Chạy trên máy

Yêu cầu Node.js >=20.9. Với PowerShell dùng `npm.cmd` nếu máy chặn `npm.ps1`.

```powershell
cd D:\GitHub\CRM-KHACHHANG-DAT
npm.cmd ci
npm.cmd run dev
```

Mở http://127.0.0.1:3000. Để thử trên điện thoại cùng mạng, chạy `npm.cmd run dev -- --hostname 0.0.0.0` rồi mở địa chỉ IP máy tính, cổng 3000. Clipboard cần HTTPS hoặc localhost; có thể sao chép thủ công trong ô nội dung khi dùng HTTP qua mạng LAN. Đăng nhập Google cần tên miền được thêm vào Authorized domains trong Firebase Authentication.

## Firebase và dữ liệu

- Mặc định tiếp tục dùng cấu hình Firebase public trong `lib/legacy-config.json`, trích từ bản HTML nguồn. Đây là cấu hình ứng dụng web, không phải khóa quản trị.
- Có thể sao chép `.env.example` thành `.env.local` và điền cấu hình khác. Khởi động lại server sau khi sửa biến môi trường.
- Tài khoản được phép giữ theo nguồn trong `lib/legacy-meta.json`; quyền thực tế do Firebase Authentication và `firestore.rules` quyết định. Không có mật khẩu trong mã ứng dụng mới.
- Dữ liệu nằm tại `users/{uid}/cksCustomers/{customerId}`. Không cần nhập lại nếu đăng nhập cùng tài khoản/cùng Firebase project.
- Chưa thay đổi rules hay triển khai hosting. File rules được giữ để tham khảo, không tự publish.
- Các file Excel/JSON cũ đã được dọn khỏi thư mục gốc và `backup/`. Nguyên bản được lưu trong `archive/legacy-customer-data-2026-10-22.zip`, đã kiểm tra SHA-256 và được loại khỏi Git. Ứng dụng không đọc file ZIP này; chỉ giữ để khôi phục khi cần. Cấu hình trùng `firebaseConfig.txt`, Firebase CLI cũ và nhật ký không dùng đã được xóa. Xem [báo cáo dọn dẹp](docs/cleanup-report.md).

## Chức năng

Nhắc hạn 7/30/90 ngày và đã hết hạn; công việc hôm nay; quản lý khách, chăm sóc/lịch hẹn và lịch sử gia hạn; mẫu và nội dung Zalo hàng loạt; báo cáo, in/lưu PDF; nhập/xuất Excel; JSON sao lưu/khôi phục; kiểm tra dữ liệu cần sửa.

Zalo chỉ soạn/sao chép nội dung và mở liên hệ, không tự gửi. Sau khi gửi thật, cập nhật “Đã nhắn Zalo” trong hồ sơ để áp dụng lịch hẹn tự động 2 ngày. “Đã gọi” tự hẹn 3 ngày, “Chờ phản hồi” 1 ngày; gia hạn/từ chối xóa lịch hẹn.

Mẫu Zalo dùng lại khóa localStorage `crm_cks_zalo_templates_v1`. Cùng origin đọc được mẫu cũ; khi đổi origin/trình duyệt, xuất JSON mẫu ở nơi cũ rồi dùng Nhập mẫu trong phần Mẫu & nội dung Zalo. Dữ liệu mẫu không được đồng bộ lên Firebase.

Nhập Excel có bước xem trước, bỏ dòng sai, chọn bỏ qua/cập nhật khi trùng mã hoặc điện thoại. Trùng tên chỉ cảnh báo. Điện thoại và mã số thuế trong Excel nên định dạng Text để giữ số 0 đầu. JSON khôi phục giữ ID/trường bổ sung/timestamps và ghi đè các trường có trong file; xác nhận trước khi ghi. Các thao tác lớn chia batch 400, báo tiến độ và số đã hoàn tất nếu có lỗi từng phần.

## Kiểm tra

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:browser
```

Browser tests dùng cổng 3100 và dữ liệu tổng hợp qua `NEXT_PUBLIC_CRM_TEST_MODE=1` chỉ trong development, không kết nối Firebase thật. Nếu dùng server đang chạy ở cổng 3100, server đó phải là chế độ test; tắt server thường trước khi test. Production bỏ qua hoàn toàn cờ này. Không đặt cờ này trong `.env.local` sử dụng hằng ngày.

Server kiểm thử dùng thư mục build riêng `.next-tests` để có thể kiểm tra song song với server làm việc thường ngày.

Trên Windows, nếu trình chạy test bị kẹt ở bước tắt web server, chạy riêng server test trong một terminal trước:

```powershell
$env:NEXT_PUBLIC_CRM_TEST_MODE='1'
npm.cmd run dev -- --port 3100
```

Chạy `npm.cmd run test:browser` ở terminal thứ hai. Dừng server rồi `Remove-Item Env:NEXT_PUBLIC_CRM_TEST_MODE` khi xong.

Kiểm tra bằng tài khoản Firebase thật cần người dùng đăng nhập. Bộ kiểm tra cục bộ không chứng minh đăng nhập Google, quyền Firestore production hoặc mở ứng dụng Zalo trên điện thoại đã hoạt động; các phần này cần kiểm tra trong môi trường sử dụng thực tế.

## Build production

```powershell
npm.cmd run build
npm.cmd start
```

Đây là ứng dụng Next.js có Node runtime; cấu hình Firebase Hosting static của bản HTML cũ đã được bỏ. Chọn nơi chạy Next.js khi cần triển khai. Tài liệu nền tảng: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Firebase modular SDK](https://firebase.google.com/docs/web/modular-upgrade), [SheetJS installation](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/).
