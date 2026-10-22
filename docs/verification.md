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
