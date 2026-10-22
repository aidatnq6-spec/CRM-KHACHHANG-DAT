# Thiết kế chuyển CRM CKS sang Next.js

Trạng thái: Người dùng tiếp tục chỉ đạo triển khai và yêu cầu đặt mã mới ở thư mục gốc, xóa mã nguồn cũ. Đã rà soát độc lập: không còn câu hỏi quan trọng.

## Mục tiêu và yêu cầu đã xác nhận

- Nguồn chuẩn duy nhất: `crm-cks-v2.html` ở thư mục gốc. Các thư mục v1–v17 và bản mobile không phải nguồn để bổ sung nghiệp vụ.
- Chuyển phần mềm sang Next.js; thiết kế lại để thuận tiện trên máy tính và điện thoại.
- Việc đầu tiên người dùng làm mỗi ngày: xem khách hàng sắp hết hạn trong vòng 30 ngày.
- Người dùng không cần bản phác thảo trình duyệt; duyệt thiết kế bằng văn bản.

## Các lựa chọn đề xuất của người thực hiện

Lựa chọn của người thực hiện: dùng TypeScript và Next.js App Router; tiếp tục Firebase Authentication và Firestore hiện có; giữ đầy đủ chức năng nguồn; giao diện tiếng Việt nền sáng, xanh navy làm màu chính. Theo yêu cầu bổ sung của người dùng, ứng dụng đặt trực tiếp ở thư mục gốc. Chỉ xóa mã nguồn HTML cũ, các thư mục v1–v17 và tài nguyên triển khai cũ sau chuyển đổi/kiểm tra; giữ dữ liệu Excel/JSON sao lưu và tệp tài khoản. Chưa phát hành lên hosting trong phạm vi triển khai ban đầu.

## Luồng chính: sắp hết hạn trong 30 ngày

Sau đăng nhập mở trang Nhắc hạn với bộ lọc 30 ngày mặc định. Hiển thị số khách phù hợp và danh sách ngay bên dưới, không buộc đi qua dashboard. Khoảng ngày gồm hôm nay đến hết ngày thứ 30, tính theo ngày lịch Asia/Ho_Chi_Minh. Loại khách ngừng hoạt động, khách đã hết hạn và khách thiếu/ngày hết hạn sai; các nhóm này có bộ lọc riêng. Trạng thái chăm sóc không loại khách khỏi danh sách nếu ngày hết hạn vẫn thuộc khoảng này.

Sắp xếp ngày hết hạn gần nhất trước, tên khách để ổn định thứ tự khi cùng ngày. Mỗi dòng/thẻ hiển thị tên, công ty, điện thoại, ngày hết hạn, số ngày còn lại, gói và trạng thái chăm sóc. Có tìm kiếm, lọc theo gói/trạng thái chăm sóc, các lựa chọn 7/30/90 ngày và đã hết hạn. Giữ bộ lọc khi đóng hồ sơ; lần đăng nhập mới mặc định lại 30 ngày.

Từ danh sách có thể mở hồ sơ, gọi bằng liên kết điện thoại, sao chép nội dung/mở Zalo, ghi nhận liên hệ, đặt lịch hẹn và ghi nhận gia hạn. Sau cập nhật ngày hết hạn, danh sách tự đồng bộ lại. Không mô tả hành động mở Zalo là gửi tin thành công: ứng dụng chỉ biết đã sao chép hoặc mở liên hệ. Giữ cấu trúc lịch sử chăm sóc hiện có và ghi nhãn đúng hành động.

## Bố cục và điều hướng

Máy tính: menu trái gồm Nhắc hạn (trang đầu), Công việc hôm nay, Khách hàng, Tổng quan, Báo cáo, Mẫu & nội dung Zalo, Dữ liệu. Thanh đầu trang có tiêu đề và nút thêm khách. Bảng có tiêu đề cột rõ, phân trang, bộ lọc và thanh thao tác hàng loạt chỉ xuất hiện khi chọn khách. Hồ sơ mở ở panel bên phải; biểu mẫu dài chia nhóm thông tin khách, dịch vụ và chăm sóc.

Điện thoại: thanh dưới có Nhắc hạn, Hôm nay, Khách hàng, Thêm mục. Các chức năng còn lại truy cập từ Thêm mục. Dùng thẻ thay bảng rộng; tìm kiếm dễ thấy, bộ lọc mở trong bảng điều khiển gọn. Hồ sơ và biểu mẫu mở toàn màn hình. Nút thao tác tối thiểu 44px; không tràn ngang ở chiều rộng 360px. Bàn phím, focus, nhãn biểu mẫu và thông báo lỗi phải sử dụng được.

Trạng thái tải, rỗng, lỗi kết nối, hết phiên và đang lưu đều có thông báo rõ. Không dùng dữ liệu mẫu thay dữ liệu thật một cách ngầm định. Có thể kiểm tra giao diện bằng fixture riêng, không ghi fixture lên Firebase.

## Phạm vi chức năng giữ lại

1. Đăng nhập email/mật khẩu, Google, đăng xuất và giới hạn tài khoản như nguồn/quy tắc hiện có.
2. Khách hàng: tạo, xem, sửa, xóa riêng lẻ/hàng loạt/toàn bộ với xác nhận phù hợp; tìm kiếm, lọc, phân trang, phát hiện trùng.
3. Nhắc hạn và công việc hôm nay: nhóm quá hạn, còn 7 ngày, lịch hẹn, chờ phản hồi; cập nhật nhanh trạng thái và lịch hẹn theo quy tắc nguồn.
4. Hồ sơ: các trường nguồn, ghi chú, trạng thái hoạt động, trạng thái chăm sóc, lịch hẹn, lịch sử giao dịch/gia hạn và chăm sóc.
5. Zalo: mẫu mặc định/chỉnh sửa/khôi phục/xem trước, biến cá nhân hóa, chọn khách tạo và sao chép nội dung hàng loạt, mở liên hệ Zalo. Không bổ sung API gửi tin tự động.
6. Dữ liệu: nhập Excel với xem trước, ánh xạ/chuẩn hóa và xử lý trùng theo nguồn; xuất Excel, tải mẫu; JSON sao lưu/khôi phục/chuyển tài khoản theo quyền hiện có; kiểm tra dữ liệu cần sửa.
7. Tổng quan và báo cáo: KPI, phễu gia hạn, hiệu quả chăm sóc, phân bổ gói, dự báo, theo tháng, giá trị khách hàng và báo cáo in/lưu PDF qua trình duyệt. Công thức đối chiếu nguồn; khác biệt sửa lỗi phải ghi rõ.

## Dữ liệu và kiến trúc

Giữ đường dẫn `users/{uid}/cksCustomers/{customerId}`, ID tài liệu, tên trường và dữ liệu cũ, kể cả `history`, `careLogs`, timestamps, trường bổ sung chưa biết. Không di chuyển dữ liệu hoặc thay rules đang dùng chỉ để đổi giao diện. Các thao tác cập nhật chỉ ghi trường cần đổi. Phân biệt chưa tải dữ liệu và danh sách rỗng. Chuẩn hóa để đọc an toàn ngày ISO, timestamps, giá và gói dạng cũ nhưng không tự ghi lại toàn bộ dữ liệu.

Tách module ngày/trạng thái/lọc/báo cáo/import-export khỏi giao diện; tách lớp Firebase, phiên đăng nhập và subscription. Dùng Firebase SDK modular trong client; không cần Firebase Admin hoặc khóa dịch vụ. Cấu hình môi trường và hướng dẫn chạy nằm trong ứng dụng mới. Mẫu Zalo hiện lưu localStorage: giữ khóa/cấu trúc tương thích trên cùng origin; khác origin phải có hướng dẫn chuyển mẫu, không hứa tự đồng bộ.

Chọn thư viện và phiên bản còn được hỗ trợ tại thời điểm xây dựng; xác minh tài liệu chính thức trước triển khai. Người xây quyết định thư viện biểu đồ, biểu tượng và biểu mẫu. Ưu tiên phụ thuộc ít, tải công cụ Excel khi cần. Các ghi lớn chia batch theo giới hạn Firestore, có tiến độ và lỗi từng phần; không thông báo thành công nếu chưa hoàn tất.

## Không thuộc phạm vi

Không thêm nhiều vai trò/nhân viên, hệ thống thanh toán, gửi Zalo/SMS tự động, thông báo nền, ứng dụng native hoặc chế độ offline mới. Không đổi backend, tự nhập backup, tự cập nhật rules, xóa dữ liệu thật hay triển khai công khai trong quá trình kiểm tra.

## Kiểm chứng và bàn giao

- Build production, TypeScript và kiểm tra tĩnh phù hợp phải qua.
- Kiểm tra nghiệp vụ có ý nghĩa cho mốc hôm nay, +30, +31, hôm qua, ngày thiếu/sai, khách ngừng hoạt động; không lệch do múi giờ.
- Đối chiếu tính năng theo nguồn; thử CRUD, gia hạn/chăm sóc và đồng bộ bằng dữ liệu cô lập/emulator khi khả dụng. Không dùng thao tác phá hủy trên dữ liệu thật.
- Kiểm tra giao diện ở 360px và máy tính, menu, lọc, mở hồ sơ, nhập biểu mẫu, thông báo và bàn phím.
- Kiểm tra Excel/JSON bằng fixture, giữ history/careLogs/timestamps và nhận diện trùng; kiểm tra in báo cáo.
- Luồng đăng nhập thật/Firebase chỉ xác nhận đã kiểm chứng khi có phiên và môi trường cho phép; ghi rõ phần chưa thể kiểm tra.
- Bàn giao mã ứng dụng, README cấu hình/chạy/build và bảng đối chiếu chức năng. Sau người dùng duyệt thiết kế này, lập kế hoạch triển khai trước khi viết mã.
