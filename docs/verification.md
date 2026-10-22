# Kết quả kiểm chứng — 22/10/2026

Ứng dụng ở thư mục gốc. Các file HTML nguồn, public/index.html, manifest/icon mobile cũ, script/cấu hình Firebase Hosting cũ và script trích xuất tạm đã được xóa theo yêu cầu. Không còn thư mục v1–v17 khi kiểm tra cuối. Giữ thư mục backup, Excel, JSON và firestore.rules.

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
