# Kết quả kiểm chứng — 22/10/2026

Ứng dụng ở thư mục gốc. Các file HTML nguồn, public/index.html, manifest/icon mobile cũ, script/cấu hình Firebase Hosting cũ và script trích xuất tạm đã được xóa theo yêu cầu. Không còn thư mục v1–v17 khi kiểm tra cuối. Sau lượt dọn tiếp theo, các Excel/JSON cũ được lưu nguyên vẹn trong ZIP riêng và các bản rời đã được xóa; giữ firestore.rules và cấu hình Next.js đang dùng. Chi tiết trong [báo cáo dọn dẹp](cleanup-report.md).

| Kiểm tra                   | Kết quả                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm.cmd test`             | 9/9 qua: ngày Việt Nam, mốc 0/30/31 ngày, inactive, ngày sai, lịch hẹn, trùng, LTV, JSON timestamp, Excel |
| `npm.cmd run lint`         | Qua, không lỗi/cảnh báo                                                                                   |
| `npm.cmd run typecheck`    | Qua                                                                                                       |
| `npm.cmd run build`        | Qua, production Next.js 16.4.2                                                                            |
| `npm.cmd run test:browser` | 3/3 luồng qua với dữ liệu tổng hợp                                                                        |
| Desktop 1440px             | Danh sách 30 ngày, thêm/sửa/xóa, chăm sóc và gia hạn qua                                                  |
| Mobile 360px               | Không tràn ngang; menu, bộ lọc, hồ sơ, báo cáo và JSON restore qua                                        |
| Excel/Zalo                 | CSV UTF-8 xem trước/nhập, sửa và lưu mẫu localStorage qua                                                 |
| Production login           | Màn hình đăng nhập hiển thị ở desktop và 360px, không có lỗi JS                                           |
| Cô lập test mode           | Production vẫn yêu cầu đăng nhập khi biến test mode được đặt thành 1                                      |

Browser tests dùng adapter dữ liệu cục bộ và không ghi Firebase thật. Production smoke test chỉ mở màn hình đăng nhập, không điền tài khoản. Chưa kiểm chứng đăng nhập email/Google thực tế, quyền/đồng bộ Firestore production, thao tác gửi bên ngoài Zalo hoặc bản in trên máy in thật. Không tự phát hành hay đổi Firestore Rules.

Ảnh kiểm tra được tạo trong `test-results/` (không đưa vào git): desktop-reminders.png, mobile-reminders.png, mobile-profile.png, production-login.png và production-login-mobile.png.

## Lượt tinh chỉnh giao diện

Menu navy, thao tác xanh ngọc, dải thống kê liền mạch và chữ lớn hơn. Danh sách desktop có nhận diện khách và dấu hạn gấp; tablet dùng thẻ hai cột; điện thoại dùng một cột. Trang đăng nhập bổ sung chuỗi công việc thực tế; tiêu đề báo cáo không lặp lại trên màn hình nhưng vẫn có khi in.

Đã kiểm tra 6 trang ở 360/768/1024/1440px, cả tràn trang và chiều rộng bảng. Bốn browser tests qua; 9 kiểm tra nghiệp vụ, lint, TypeScript và production build qua. Kiểm tra bố cục in bằng print media; chưa thử máy in thật. Login local tại cổng 3000 đã được mở ở desktop/mobile mà không nhập tài khoản.

Server kiểm thử dùng `.next-tests` riêng để không xung đột server phát triển đang dùng. Không thay đổi Firebase hoặc ghi dữ liệu thật trong lượt tinh chỉnh này; chưa phát hành lên Vercel.

## Cải thiện giao diện — 23/10/2026

- 9/9 unit tests qua; lint, TypeScript và production build qua.
- 8/8 browser tests qua: các luồng CRM trước đây, kiểm tra 7 màn hình ở 360/768/1024/1440px, và 4 luồng bổ sung trong `tests/interface-improvements.spec.ts`.
- Form: lỗi tên/giá/ngày hiển thị cạnh trường, focus lỗi đầu tiên; nút lưu hiện trong viewport mobile; ghi chú được lưu cả khi phần bổ sung đã thu gọn.
- Lọc: chỉ số Chưa liên hệ mở đúng nhóm 30 ngày; kết hợp ba điều kiện nhanh, bỏ từng điều kiện/xóa hết; danh sách khách ghi đúng thứ tự A–Z.
- Zalo: sao chép giữ nguyên trạng thái Đã gọi và không tạo lịch hẹn; xác nhận gửi đổi thành Đã nhắn Zalo, tạo lịch sau 2 ngày theo lịch Việt Nam, ghi đúng một sự kiện xác nhận trong lần mở.
- Mobile/báo cáo: thống kê mặc định thu gọn và mở/đóng được; tên khách đầu tiên nằm trong viewport ở 390×844px; kỳ 3/6 tháng đổi số dòng lịch sử và số cột biểu đồ; Tổng quan có danh sách ưu tiên riêng.
- Đã xem ảnh thực tế desktop, mobile, hồ sơ, form và báo cáo. Các ảnh bố cục được tạo lại trong `test-results/` khi chạy kiểm tra.

Kiểm thử dùng dữ liệu tổng hợp, không ghi Firebase thật. Chưa xác minh thao tác gửi trong ứng dụng Zalo hay bàn phím ảo trên điện thoại thật. Thay đổi được triển khai trong mã nguồn cục bộ, chưa phát hành.

## Công việc hôm nay — 23/10/2026

- 14/14 unit tests qua. Năm kiểm tra mới bao phủ gộp khách/lý do, ưu tiên quá hẹn, mốc 7/8 ngày, loại inactive/đã đóng, quay lại khi đến hạn, xác thực lịch và phân biệt liên hệ thực tế với sao chép/đặt lịch.
- 13/13 browser tests qua, gồm 5 luồng mới trong `tests/today-workspace.spec.ts`: gọi và ghi chú (+3 ngày), chờ phản hồi (+1 ngày), giữ focus/vị trí cuộn/bộ lọc, hẹn lại và khách cuối nhóm, mobile giữ nháp qua hồ sơ, lịch xa hơn 7 ngày, quay về từ xác nhận Zalo.
- Đã kiểm tra lỗi ngày hẹn/nội dung trống: focus đúng trường và giữ nội dung để sửa. Hẹn lại giữ nguyên trạng thái chăm sóc và thời gian liên hệ thực tế, có đúng một sự kiện đặt lịch.
- Toàn bộ luồng CRM, import/export, Zalo và kiểm tra 7 màn hình ở 360/768/1024/1440px vẫn qua. Form hẹn lại cũng không tràn ngang ở các kích thước này và ở 768×390px khi bật reduced motion.
- Lint, TypeScript, production build qua. Đã xem ảnh desktop, mobile và form hẹn tại `test-results/today-final-*.png`.

Các kiểm tra ghi dữ liệu dùng adapter cục bộ với dữ liệu tổng hợp. Chưa thử lỗi ghi mạng/quyền và đồng bộ trên Firebase production hoặc bàn phím ảo thiết bị thật. Chưa phát hành.
