# Đối chiếu bản HTML → Next.js

Nguồn nghiệp vụ: `crm-cks-v2.html` tại thư mục gốc, không dùng các bản v1–v17. Bản mới đặt ngay thư mục gốc theo yêu cầu người dùng.

SHA-256 file nguồn trước chuyển đổi: `C7CE89055401A996EA0526CEC58B532E979610C8A9C9446A85FAE25B98FA9953`. Mã HTML nguồn và các tài nguyên triển khai cũ đã được dọn khỏi workspace theo yêu cầu; dữ liệu sao lưu vẫn tách riêng.

| Nguồn HTML                                      | Vị trí bản Next.js                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| Firebase email/Google, giới hạn email, realtime | `components/crm-provider.tsx`, `lib/firebase.ts`, `lib/repository.ts`    |
| Danh sách, tìm kiếm, lọc, phân trang            | Khách hàng / Nhắc gia hạn; `components/customer-list.tsx`                |
| Tạo/sửa/xóa, xóa hàng loạt, xóa tất cả          | Hồ sơ, thanh lựa chọn, Quản lý dữ liệu                                   |
| Nhắc hạn, lịch hẹn, công việc hôm nay           | Nhắc gia hạn mặc định 30 ngày; Hôm nay                                   |
| Trạng thái chăm sóc và tự hẹn                   | Hồ sơ; `nextFollowUp`, `carePatch`                                       |
| Lịch sử chăm sóc/gia hạn và LTV                 | Hồ sơ; `transactions`, `lifetimeValue`                                   |
| Mẫu Zalo và tạo hàng loạt                       | Mẫu & nội dung Zalo; sáu mẫu nguồn giữ trong `lib/legacy-templates.json` |
| Excel mẫu mới và cũ hai dòng tiêu đề            | Quản lý dữ liệu; `parseGrid`, mapping nguồn `lib/legacy-columns.json`    |
| Xuất Excel, tải mẫu                             | Quản lý dữ liệu / thanh khách đã chọn                                    |
| JSON sao lưu, khôi phục, chuyển tài khoản       | Quản lý dữ liệu; giữ shape `{customers:[{id,data}]}`                     |
| Phát hiện dữ liệu cần sửa                       | Quản lý dữ liệu                                                          |
| Tổng quan, KPI, phễu, phân bổ gói, dự báo       | Tổng quan / Báo cáo & phân tích                                          |
| Gia hạn theo tháng, hiệu quả chăm sóc, LTV      | Báo cáo & phân tích                                                      |
| Xuất PDF bằng trang in                          | In / Lưu PDF với CSS A4 và danh sách sắp hết hạn                         |

## Các chỉnh sửa có chủ đích

- Màn hình đầu chuyển từ dashboard sang danh sách sắp hết hạn 30 ngày.
- Ngày tính theo Asia/Ho_Chi_Minh; ngày sai không bị coi là còn hạn. Không đưa khách ngừng hoạt động vào danh sách nhắc hạn/dự báo.
- Listener đọc cả khách thiếu `createdAt`, tránh bị bỏ qua bởi `orderBy` nguồn.
- Sao chép/mở Zalo không tự nhận đã gửi. Nhật ký ghi đúng hành động; thay đổi trạng thái đã nhắn do người dùng xác nhận.
- Gia hạn dùng transaction, lưu dịch vụ trước đó vào lịch sử nếu chưa có, tránh mất thông tin cũ và đếm trùng LTV.
- Báo cáo phân biệt giá trị trường giá hiện tại và giá trị giao dịch lịch sử, không mặc định coi là tiền đã thu.
- `public/sw.js` là worker chuyển tiếp mới: xóa đúng cache mobile cũ, tự unregister và tải lại tab để tránh giữ HTML cũ khi triển khai cùng origin. Không đăng ký worker mới trong ứng dụng. Mẫu Zalo vẫn giữ khóa lưu cũ.
- Dữ liệu import không tự gán giá/ngày rỗng để ghi đè trường không có trong file. Bản ghi trùng trong cùng file cũng được phát hiện.

## Phạm vi kiểm chứng

Tests domain/import-export chạy bằng Node; UI chạy Playwright với fixture tổng hợp và adapter cục bộ. Không đọc tài khoản hoặc tải dữ liệu backup thật vào browser tests. Firebase live, Google popup và Zalo bên ngoài chưa kiểm chứng bằng tài khoản thật.
