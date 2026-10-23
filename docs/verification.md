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

## Dashboard — 23/10/2026

- 19 unit tests bao gồm 5 kiểm tra Dashboard: nhóm KPI/ước tính; lịch hôm nay +6 ngày; ranh giới qua năm và năm nhuận; khách duy nhất và múi giờ Việt Nam; dữ liệu trống. Ngày lỗi, timestamp thiếu múi giờ, sự kiện sao chép/đặt lịch, giao dịch hiện tại và sự kiện ngoài kỳ được loại đúng.
- 18 browser tests bao gồm 5 luồng mới trong `tests/dashboard.spec.ts`: bốn đích KPI; chọn ngày và giữ lựa chọn khi đóng hồ sơ; chọn tháng bằng bàn phím, cột 0 và phân trang; kết quả 7/30/90 ngày và hai nhóm; mobile mở Báo cáo chi tiết.
- Các phép tính và dữ liệu kiểm thử dùng lịch Việt Nam. Các kiểm tra nghiệp vụ, giao diện, nhập/xuất và công việc hôm nay trước đó được giữ lại. Bố cục kiểm tra ở 360/768/1024/1440px.
- Lint, TypeScript, production build và định dạng mã được kiểm tra. Ảnh desktop/mobile và phần biểu đồ được xem trong `test-results/`.

Dashboard chỉ đọc dữ liệu và mở các luồng có sẵn. Kiểm tra dùng dữ liệu tổng hợp, không ghi Firebase thật. Chưa phát hành và chưa xác minh số liệu trên tài khoản production.

## Nhiều dịch vụ — 23/10/2026

- 24/24 unit tests qua: mặc định khách cũ, đủ 9 dịch vụ, chuẩn hóa tên/mã, loại khách không dùng CKS khỏi kỳ hạn, giữ lịch hẹn và dữ liệu CKS cũ; Excel/JSON round-trip, cột trống giữ phân loại và từ chối dịch vụ không hợp lệ.
- 23/23 browser tests qua, gồm 5 luồng mới: chọn/lưu đủ 9 dịch vụ và mở toàn bộ nhãn; tạo khách chỉ dùng dịch vụ khác; kết hợp/xóa bộ lọc; bỏ/chọn lại CKS giữ giá/ngày và cập nhật nhắc hạn; xác thực form trên mobile; xem trước/nhập/xuất Excel có nhiều dịch vụ.
- Các luồng Dashboard, Công việc hôm nay, CRM, Zalo và bố cục 7 màn hình ở 360/768/1024/1440px tiếp tục qua. Kiểm tra dịch vụ trên mobile 360px không tràn ngang.
- Lint, TypeScript và production build qua. Ảnh form, hồ sơ và danh sách ở desktop/mobile nằm trong `test-results/services-*.png`.

Kiểm tra dùng dữ liệu tổng hợp cục bộ, không ghi Firebase thật. Phạm vi dịch vụ bổ sung là phân loại, hiển thị và lọc; giá/ngày/lịch sử riêng theo từng dịch vụ chưa được bổ sung. Chưa phát hành.

## Kỳ hạn nhiều dịch vụ — 23/10/2026

- Bổ sung ngày bắt đầu/hết hạn cho BHXH, Hóa đơn điện tử, Phần mềm Khấu trừ thuế TNCN và Căn hộ cho thuê. Thông tin CKS cũ giữ nguyên; ngày từng dịch vụ được lưu riêng và giữ khi bỏ/chọn lại.
- 30/30 unit tests qua, gồm 6 kiểm tra mới về mốc 0/7/30/90 ngày, nhiều kỳ hạn và khách duy nhất, inactive/dịch vụ bỏ chọn/ngày sai, lịch hẹn tương lai, Excel/JSON và cập nhật một phần, nội dung Zalo đúng dịch vụ, ngày serial theo hệ 1900/1904.
- 28/28 browser tests qua. Bốn luồng mới kiểm tra lưu/mở lại đủ 4 dịch vụ, lọc đúng dịch vụ và khoảng ngày, focus lỗi ngày và bảo toàn kỳ hạn, gộp lý do và chăm sóc trên mobile, xem trước/nhập/xuất đủ 8 cột ngày. Kiểm tra CSV xác nhận ngày không lệch theo múi giờ và số điện thoại giữ số 0 đầu.
- Các luồng Dashboard, hôm nay, Zalo, nhập/xuất và kiểm tra hydration trước đó tiếp tục qua. Bố cục 7 màn hình ở 360/768/1024/1440px qua; đã xem ảnh form, hồ sơ, nhắc hạn và công việc có nhiều dịch vụ ở desktop/mobile.
- Lint, TypeScript qua production build và định dạng mã được kiểm tra. Nhắc hạn tính các dịch vụ có ngày, còn biểu đồ/giá trị CKS và giao dịch gia hạn giữ phạm vi chữ ký số; trạng thái chăm sóc và lịch hẹn vẫn theo khách.

Kiểm tra dùng adapter cục bộ với dữ liệu tổng hợp, không ghi Firebase thật. Chưa kiểm tra đồng bộ/quyền ghi trên tài khoản production và chưa phát hành.
