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

## Dashboard hướng tới hành động

- Dashboard được tách khỏi Báo cáo chi tiết. Bốn chỉ số mở đúng nhóm: khách quá hẹn → bộ lọc Quá hẹn của Công việc hôm nay; CKS trong 7 ngày → nhắc hạn 7 ngày; chưa liên hệ trong nhóm 30 ngày → nhắc hạn 30 ngày có bộ lọc Chưa liên hệ; giá trị dự kiến → toàn bộ nhóm nhắc hạn 30 ngày.
- Giá trị dự kiến dùng cùng phép tính của Báo cáo; có chú thích rõ không phải tiền đã thu và số khách thiếu giá phải tạm tính theo giá trung bình.
- Ưu tiên hôm nay và lịch hẹn đặt cạnh nhau ở desktop rộng, xếp dọc ở màn hình nhỏ. Ưu tiên tối đa 5 khách; lịch hiển thị hôm nay và 6 ngày tiếp theo. Bấm ngày để xem đầy đủ khách hẹn, có phân trang 5 khách và mở hồ sơ; giữ lựa chọn khi đóng hồ sơ.
- Biểu đồ 6 tháng tính từ hôm nay đến hết tháng thứ sáu, kể cả phần còn lại của tháng hiện tại. Chỉ tính ngày hợp lệ, chưa qua hạn và khách đang hoạt động. Mỗi cột có số, nhãn tháng, trạng thái chọn và thao tác bàn phím; cột 0 có chiều cao 0. Bấm tháng mở danh sách tương ứng, có phân trang.
- Kết quả chăm sóc có kỳ 7/30/90 ngày, bao gồm hôm nay, dùng lịch Việt Nam cho dấu thời gian. Đếm khách duy nhất có nhật ký chăm sóc thực tế; loại sao chép/script và chỉ đặt lịch. Gia hạn đếm khách có giao dịch lịch sử không phải bản ghi hiện tại hoặc xác nhận gia hạn trong kỳ. Hai nhóm độc lập, không trình bày thành tỷ lệ chuyển đổi hay tiền đã thu.
- Có trạng thái trống cho ngày, tháng, kết quả và tài khoản chưa có dữ liệu. Mobile ưu tiên chỉ số và khách cần xử lý, các biểu đồ nằm sau.

## Nhiều dịch vụ trên một khách hàng

- Form dùng nhóm checkbox có nhãn đầy đủ cho 9 dịch vụ, yêu cầu chọn ít nhất một. Hai cột ở màn hình rộng, một cột trên điện thoại. Thông tin CKS chỉ hiện khi chọn Chữ ký số; bỏ chọn không xóa dữ liệu đã lưu.
- Danh sách hiện tối đa hai nhãn và nút “+N dịch vụ” mở hồ sơ đầy đủ. Khi lọc, dịch vụ được chọn luôn hiện trước. Nhãn dài xuống dòng theo từ; nút Zalo giữ trên một dòng.
- Bộ lọc dịch vụ kết hợp với các điều kiện hiện có, có nhãn điều kiện đang dùng và xóa riêng/xóa hết. Khách chưa có trường dịch vụ mặc định Chữ ký số; danh sách trống rõ ràng được xem là Chưa phân loại.
- Nhắc hạn tính kỳ hạn của 9 dịch vụ có ngày. Biểu đồ CKS, phân bổ gói và giá trung bình hiện tại giữ phạm vi Chữ ký số. Lịch hẹn, chăm sóc và tổng khách áp dụng cho mọi dịch vụ; lịch sử giao dịch cũ được giữ nguyên.
- Nhập/xuất Excel dùng tên dịch vụ ngăn bằng dấu chấm phẩy, có xem trước và báo tên không nhận diện. Cột thiếu/trống không ghi đè phân loại khi cập nhật. JSON giữ các mã dịch vụ và từ chối mã không hợp lệ trước khi ghi.

## Kỳ hạn từng dịch vụ

- Tất cả dịch vụ ngoài CKS có nhóm ngày bắt đầu/hết hạn riêng khi được chọn. Mỗi trường có nhãn truy cập đầy đủ tên dịch vụ, lỗi cạnh trường và focus khi ngày không hợp lệ. Ngày chưa biết có thể để trống, giống CKS; hệ thống kiểm tra dữ liệu chỉ rõ dịch vụ thiếu ngày hết hạn.
- Hồ sơ hiện từng dịch vụ, cặp ngày và nhãn còn hạn/hết hạn. Bỏ chọn giữ dữ liệu đã lưu, đồng thời dừng nhắc kỳ hạn đó; chọn lại khôi phục giá trị.
- Nhắc hạn lọc theo đúng cặp dịch vụ/khoảng ngày; một khách có nhiều hạn chỉ xuất hiện một lần với các hạn phù hợp. Khi đổi dịch vụ, thứ tự được tính lại theo kỳ hạn dịch vụ đã chọn. Không dùng hạn CKS thay cho hạn BHXH hay ngược lại.
- Công việc hôm nay gộp các lý do có tên dịch vụ và ngày hết hạn; vẫn ưu tiên quá hẹn và tạm hoãn khi khách có lịch liên hệ tương lai. Ghi nhận chăm sóc một lần cho khách. Phạm vi này chưa tách trạng thái chăm sóc hay lịch sử giao dịch riêng theo dịch vụ.
- Excel có 16 cột ngày cho 8 dịch vụ ngoài CKS, xem trước từng kỳ hạn và gộp cập nhật từng trường để giữ dịch vụ khác. CSV đọc dạng văn bản để tránh lệch ngày theo múi giờ và mất số 0 đầu; Excel hỗ trợ hai hệ ngày 1900/1904. JSON kiểm tra cấu trúc/ngày/khoảng ngày. Zalo tự động dùng nội dung có tên dịch vụ khi kỳ hạn ưu tiên thuộc dịch vụ bổ sung; mẫu được chọn thủ công vẫn theo lựa chọn người dùng.

## Gói và giá từng dịch vụ

- Tất cả dịch vụ ngoài CKS có hàng Gói dịch vụ / Giá tiền (VNĐ) phía trên cặp ngày. Hai cột trên desktop, xếp dọc trên mobile theo form hiện có; nhãn truy cập gồm tên dịch vụ để phân biệt với CKS.
- Gói nhập tự do, gợi ý các gói đã dùng cho đúng dịch vụ. Giá nguyên không âm, cho phép để trống, 0 đồng được lưu/hiển thị riêng với chưa có giá. Lỗi giá hiện cạnh ô và nhận focus. Bỏ/chọn lại giữ thông tin đã lưu cùng ngày.
- Hồ sơ hiển thị gói và giá cùng dịch vụ. Bộ lọc gói lấy các gói của dịch vụ đang chọn; đổi dịch vụ xóa lựa chọn gói để tránh giữ điều kiện không phù hợp. Không đổi phép tính tài chính CKS trong lượt bổ sung trường này.
- Excel có 16 cột ngày và 16 cột gói/giá, có xem trước và mẫu. Cập nhật một phần giữ ngày, gói/giá bỏ trống và dịch vụ khác; giá sai bị loại trước khi nhập. JSON giữ thông tin và kiểm tra kiểu gói/giá, số nguyên không âm.
