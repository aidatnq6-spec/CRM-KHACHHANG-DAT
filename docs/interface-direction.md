# Tinh chỉnh giao diện CRM CKS

Tiếp tục phạm vi đã thống nhất: CRM tiếng Việt, navy/nền sáng, ưu tiên khách hết hạn trong 30 ngày, dùng trên desktop và điện thoại. Lượt này tinh chỉnh trình bày; giữ nghiệp vụ, Firebase, dữ liệu và cách điều hướng hiện có.

## Hệ thống hình ảnh

- Navy #17324D: menu, tiêu đề và nhận diện.
- Teal #126D64: thao tác chính, focus và tín hiệu kết nối.
- Nền #F3F6F9, giấy #FFFFFF: tách nền và nội dung dữ liệu.
- Mực #24374B: nội dung, phụ #607286.
- Cảnh báo dùng amber và đỏ có nhãn chữ; không dựa riêng vào màu.
- Giữ Be Vietnam Pro cho tiếng Việt. Nội dung chính 14–16px, phụ 12–13px; số dùng tabular numerals. Form mobile 16px để tránh trình duyệt tự zoom.

## Bố cục

Desktop: rail navy 248px, header trắng gọn, vùng làm việc canh trái. Thống kê nằm trong một dải có vạch phân cách, không dùng bốn hộp nổi giống nhau. Danh sách là trọng tâm: tên nổi bật, liên hệ phụ, ngày và nhãn còn hạn cùng cột; thao tác 44px dễ dùng.

```
Menu navy | Đường dẫn                         Thêm khách
          | Nhắc gia hạn                     Ngày hiện tại
          | Chỉ số / Chỉ số / Chỉ số / Chỉ số
          | Khách sắp hết hạn             7 / 30 / 90 ngày
          | Tìm kiếm                 Chăm sóc / Gói
          | Khách hàng    Liên hệ    Hạn    Chăm sóc   Thao tác
```

Điện thoại: header thương hiệu và nút thêm, chỉ số thành dải 2×2 ngắn hơn desktop, bộ lọc bật khi cần, danh sách thẻ và bottom nav 4 mục. Hạn khẩn có vạch trạng thái nhỏ; nút gọi/Zalo/hồ sơ dễ chạm. Hồ sơ vẫn toàn màn hình.

Login: nền navy ở phần nhận diện, ba bước Theo dõi / Liên hệ / Gia hạn trình bày như chuỗi việc thực tế; form trắng tập trung, nhãn rõ. Không đưa số liệu hoặc khách hàng giả vào giao diện thật.

## Rà soát lựa chọn

Không thêm banner quảng bá hoặc biểu đồ trang trí vào trang nhắc hạn. Bỏ nhãn phụ lặp lại trên đầu trang và các shadow đồng loạt. Dồn điểm nhấn vào menu navy và thứ bậc bảng. Mỗi màu trạng thái đi kèm nhãn, các bề mặt lớn còn lại giữ trung tính để làm việc lâu.

## Kiểm chứng

Chạy các luồng hiện có với dữ liệu tổng hợp, kiểm tra ảnh 360/768/1440px, focus bàn phím, tràn ngang, dialog và báo cáo. Lint, TypeScript và build trước bàn giao. Không thay đổi hoặc ghi dữ liệu Firebase thật khi kiểm tra giao diện.

## Cập nhật ngày 23/10/2026

- Các nhãn phụ trước đây 9–11px được nâng lên tối thiểu 12px; tên khách, ngày hết hạn và dữ liệu bảng rõ hơn. Ô tìm kiếm mobile dùng 16px.
- Form khách hàng có lỗi cạnh trường tên/giá/ngày, focus vào lỗi đầu tiên; dấu bắt buộc nằm cùng dòng nhãn. Công ty, MST, địa chỉ và ghi chú nằm trong “Thông tin bổ sung”, mở sẵn khi sửa. Thu gọn không làm mất dữ liệu đã nhập. Thanh lưu/hủy bám đáy khi cuộn, có khoảng đệm safe area.
- Thống kê nhắc hạn mặc định thu gọn trên mobile, luôn hiện trên desktop. Rút ngắn khoảng cách và ẩn mô tả đầu trang trên mobile; giữ thông báo dữ liệu thử.
- Chăm sóc/lịch hẹn xuất hiện ngay sau các nút đầu hồ sơ. Soạn Zalo có bước xác nhận “Tôi đã gửi”; chỉ xác nhận này mới chuyển sang Đã nhắn Zalo và áp dụng lịch hẹn sau 2 ngày. Sao chép/mở Zalo vẫn không xác nhận gửi. Nút xác nhận được khóa khi xử lý và thay bằng kết quả sau khi thành công.
- Bộ lọc nhanh Chưa liên hệ, Hết hạn hôm nay và Lịch hẹn đến hạn (bao gồm lịch quá hạn) có thể kết hợp với tìm kiếm/gói/trạng thái. Điều kiện đang dùng có thể bỏ riêng hoặc xóa hết; đổi điều kiện bỏ lựa chọn hàng để tránh tác động nhầm khách. Chỉ số Chưa liên hệ mở nhóm tương ứng trong 30 ngày. Chú thích thứ tự phản ánh đúng danh sách tên hoặc ngày hết hạn.
- Tổng quan ưu tiên tối đa 5 khách có công việc cần xử lý, mỗi khách xuất hiện một lần. Báo cáo dùng tên “Phân bố trạng thái chăm sóc”, có kỳ xem 3/6 tháng cho bảng chăm sóc và biểu đồ theo tháng. Chỉ số tổng hợp, dự kiến gia hạn và xuất Excel vẫn dùng toàn bộ dữ liệu, có chú thích phạm vi ngay trên trang.

## Công việc hôm nay

- Mỗi khách có một thẻ, gộp các lý do ưu tiên. Quá hẹn được xếp trước hẹn hôm nay, sau đó là hạn dịch vụ và chờ phản hồi. Các chỉ số đếm khách, không đếm trùng các lý do.
- “Cần làm” tôn trọng ngày hẹn: khách có lịch tương lai tạm rời nhóm này. “Sắp đến hẹn” hiển thị ngày mai đến hết ngày thứ 7; lịch xa hơn vẫn được giữ trong hồ sơ. Khách trở lại hàng đợi khi đến ngày hẹn theo lịch Việt Nam.
- Thẻ hiển thị lần liên hệ thực tế gần nhất, ghi chú, lịch/nội dung hẹn và các lý do ưu tiên. Sự kiện sao chép Zalo hoặc đặt lịch không được trình bày như một lần liên hệ thực tế mới.
- Nút Đã gọi và Chờ phản hồi ghi nhận ngay, dùng ghi chú nhanh nếu có, áp dụng lịch hẹn +3/+1 ngày. Quy tắc hiện cạnh thao tác để người dùng biết trước khi ghi nhận.
- Hẹn lại mở form ngay trong thẻ, chọn từ ngày mai và yêu cầu nội dung hẹn. Lưu lịch và nhật ký trong cùng một cập nhật, giữ trạng thái chăm sóc và lần liên hệ cũ; sự kiện đặt lịch không được tính như chăm sóc trong báo cáo.
- Sau khi lưu thành công, chuyển focus đến khách kế tiếp phù hợp với bộ lọc tại vị trí thẻ vừa xử lý. Nếu đó là khách cuối, focus đến tiêu đề nhóm; bộ lọc giữ nguyên. Lỗi lưu giữ thẻ và nội dung nhập. Mở hồ sơ hoặc Zalo giữ màn hình công việc được gắn, do đó bộ lọc và ghi chú nháp còn nguyên.
- Quá hẹn / Hẹn hôm nay / Sắp đến hẹn dùng nhãn chữ và màu riêng. Mobile dùng thẻ một cột, bộ lọc cuộn ngang trong vùng riêng và các nút từ 44px.
