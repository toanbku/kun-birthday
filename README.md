# Thiệp thôi nôi · Kun

Web app nhỏ để tự tạo **thiệp mời tiệc thôi nôi**, chỉnh nội dung ngay trên trình duyệt rồi tải về ảnh PNG (in được hoặc gửi Zalo/Facebook).

Không cần cài đặt, không cần mạng, không có máy chủ nào nhận dữ liệu.

---

## Mở thiệp

Cách nhanh nhất: **bấm đúp vào `index.html`**.

Nếu muốn chạy qua máy chủ nội bộ:

```bash
cd kun-birthday
python3 -m http.server 8000
# mở http://localhost:8000
```

> Mọi thứ (font, ảnh mặc định) đã được nhúng sẵn nên mở trực tiếp bằng `file://` vẫn xem và tải ảnh bình thường.

## Cách dùng

1. Nhập **Tên khách** và **Lời mời** (mặc định "Kính mời Quý khách", đổi được cho từng người).
2. Xoay ảnh / sửa **tên bé**, **biệt danh**, **thời gian**, **địa điểm**, **link Google Maps** (tự động tạo mã QR trên thiệp).
3. Bấm vào khung ảnh để **đổi ảnh của bé** (kéo thả cũng được). Chỉnh *Thu phóng* / *Dịch ảnh* để căn mặt bé cho đẹp.
4. Chọn **bảng màu**: Kem nâu · Hồng đào · Xanh bơ.
5. **Gửi riêng từng khách**: Dán danh sách tên (mỗi dòng một người), bấm **Tạo thiệp cho từng khách (.zip)** để tự động xuất toàn bộ thiệp có tên từng người vào một file nén.
6. Bấm **Tải thiệp PNG**:
   - `1×` → 1080 × 1620 px (gửi tin nhắn, đăng Facebook).
   - `2×` → 2160 × 3240 px (đi in, ~550 dpi ở khổ 10 × 15 cm).
7. Trên điện thoại có nút **Chia sẻ qua Zalo / Messenger** (dùng bảng chia sẻ của hệ điều hành).

Mọi thay đổi được lưu tự động vào trình duyệt. Nút **Đặt lại** đưa mọi thứ về ban đầu.

## Mẹo in

- Khổ thiệp 2:3 — in 10 × 15 cm hoặc 13 × 18 cm đều vừa (file 2× đủ nét để in tới A5).
- Giấy gợi ý: CouChe 250–300 gsm, cán mờ. Phần nền kem sẽ lên màu ấm và giống bản xem trước.
- Bản 1× là đủ để gửi thiệp qua Zalo; bản 2× dùng khi ra tiệm in.

## Cấu trúc

```
kun-birthday/
├── index.html              # giao diện
├── styles.css              # style bảng điều khiển
├── app.js                  # vẽ thiệp bằng canvas + logic xuất ảnh & đóng gói zip
├── assets/
│   ├── fonts.css           # font nhúng base64 (Baloo 2, Quicksand, Dancing Script)
│   ├── photo-data.js       # ảnh Kun mặc định (base64)
│   ├── photos/kun.jpg      # ảnh gốc
│   └── qr.js               # thư viện tạo mã QR offline
└── README.md
```

## Chỉnh mặc định / thêm ảnh khác

- Nội dung mặc định nằm ở `DEFAULTS` trong `app.js`.
- Đổi ảnh mặc định: thay `assets/photos/kun.jpg`, hoặc thay chuỗi trong `assets/photo-data.js` bằng data URL ảnh mới.
- Ba bảng màu nằm ở `PALETTES` trong `app.js`.
- Nếu cần đổi bố cục (vị trí khung ảnh, tấm nền, các pill…), sửa trong hàm `drawCard()` — mọi toạ độ tính trên khung 1080 × 1620.
