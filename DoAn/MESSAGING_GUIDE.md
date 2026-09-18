# 📱 Hướng Dẫn Sử Dụng Chức Năng Nhắn Tin & Gọi Điện

## ✨ Tính Năng Mới

### 1. **Nhắn Tin Riêng (Direct Messaging)**
- Gửi tin nhắn trực tiếp giữa bệnh nhân và bác sĩ
- Xem lịch sử cuộc hội thoại
- Danh sách chat được sắp xếp theo tin nhắn gần nhất
- Đánh dấu tin nhắn đã đọc

### 2. **Gọi Audio (Gọi Điện Thường)**
- Bệnh nhân có thể gọi bác sĩ
- Hiển thị trạng thái cuộc gọi (chờ đáp ứng, đang kết nối, hoạt động)
- Tính thời lượng cuộc gọi tự động
- Từ chối hoặc kết thúc cuộc gọi

### 3. **Gọi Video (Gọi Hình Ảnh)**
- Bệnh nhân có thể gọi video với bác sĩ
- Tắt/bật microphone trong cuộc gọi
- Tắt/bật camera
- Chia sẻ màn hình (hỗ trợ cơ bản)
- Kiểm soát âm lượng loa

---

## 🚀 Cách Sử Dụng

### **Để Truy Cập Tính Năng Nhắn Tin:**

#### Từ Dashboard Bệnh Nhân:
1. Đăng nhập vào hệ thống với tài khoản `benhnhan / 123`
2. Nhấp vào nút **"Nhắn tin"** trong menu điều hướng
3. Bạn sẽ được chuyển đến trang nhắn tin

#### Từ Dashboard Bác Sĩ:
1. Đăng nhập vào hệ thống với tài khoản `admin / 123`
2. Vào menu **"Tùy chọn"** → nhấp **"Nhắn tin"**
3. Bạn sẽ được chuyển đến trang nhắn tin

---

## 💬 Gửi Tin Nhắn

### Bước Thực Hiện:

1. **Chọn Người Nhắn Tin**
   - Từ danh sách chat ở bên trái
   - Nếu chưa có cuộc hội thoại, hãy tạo tin nhắn mới

2. **Nhập Tin Nhắn**
   - Click vào ô input ở dưới cùng
   - Gõ nội dung tin nhắn
   - Nhấp nút **"Gửi"** hoặc bấm **Enter**

3. **Xem Tin Nhắn**
   - Tin nhắn của bạn sẽ hiển thị bên phải (màu xanh)
   - Tin nhắn từ đối tác sẽ hiển thị bên trái (màu trắng)
   - Dấu thời gian hiển thị bên cạnh mỗi tin nhắn

---

## 📞 Gọi Điện Audio (Gọi Thường)

### Bước Thực Hiện:

1. **Từ Màn Hình Chat:**
   - Chọn người muốn gọi
   - Nhấp nút **📞 (Gọi Điện)** ở góc trên phải

2. **Màn Hình Gọi Sẽ Xuất Hiện:**
   - Hiển thị tên người nhận
   - Trạng thái: "Đang gọi..."
   - Thời lượng cuộc gọi

3. **Điều Khiển Cuộc Gọi:**
   - **Tắt/Bật Microphone**: Nhấp nút 🎤
   - **Loa**: Nhấp nút 🔊 để điều chỉnh âm lượng
   - **Kết Thúc Cuộc Gọi**: Nhấp nút ☎️ (đỏ)

4. **Nếu Nhận Được Cuộc Gọi:**
   - Modal sẽ hiển thị
   - Nhấp **"Chấp Nhận"** để trả lời
   - Nhấp **"Từ Chối"** để không nghe

---

## 🎥 Gọi Video

### Bước Thực Hiện:

1. **Từ Màn Hình Chat:**
   - Chọn người muốn gọi video
   - Nhấp nút **🎥 (Gọi Video)** ở góc trên phải

2. **Cửa Sổ Gọi Video Sẽ Mở:**
   - **Màu Đen**: Khung hình của đối phương
   - **Góc Dưới Phải**: Khung hình của bạn (nếu camera bật)

3. **Điều Khiển Trong Cuộc Gọi:**
   - **Tắt/Bật Camera**: 🎥 (thay đổi màu đỏ khi tắt)
   - **Tắt/Bật Microphone**: 🎤
   - **Loa**: 🔊
   - **Chia Sẻ Màn Hình**: 📤 (nếu hỗ trợ)
   - **Kết Thúc Cuộc Gọi**: ☎️ (nút đỏ lớn)

4. **Thông Tin Cuộc Gọi:**
   - Tên người gọi
   - Loại cuộc gọi (Audio Call / Video Call)
   - Thời lượng cuộc gọi (định dạng MM:SS hoặc HH:MM:SS)
   - Trạng thái kết nối (Xanh lá: Hoạt động)

---

## 📊 API Backend - Chi Tiết

### **Endpoints Mới**

#### 1. **Gửi Tin Nhắn**
```
POST /api/messages/send
Body: {
  "sender_id": "benhnhan",
  "receiver_id": "admin",
  "content": "Xin chào bác sĩ",
  "message_type": "text"
}
```

#### 2. **Lấy Cuộc Hội Thoại**
```
GET /api/messages/conversation/{user_id}/{other_user_id}
```

#### 3. **Danh Sách Chat**
```
GET /api/messages/list/{user_id}
```

#### 4. **Bắt Đầu Cuộc Gọi**
```
POST /api/calls/initiate
Body: {
  "caller_id": "benhnhan",
  "receiver_id": "admin",
  "call_type": "audio"  // hoặc "video"
}
```

#### 5. **Chấp Nhận Cuộc Gọi**
```
PUT /api/calls/{call_id}/accept
```

#### 6. **Từ Chối Cuộc Gọi**
```
PUT /api/calls/{call_id}/decline
```

#### 7. **Kết Thúc Cuộc Gọi**
```
PUT /api/calls/{call_id}/end
```

#### 8. **Lịch Sử Cuộc Gọi**
```
GET /api/calls/history/{user_id}
```

---

## 📁 Cấu Trúc File Mới

```
frontend/
├── src/
│   ├── components/
│   │   ├── PatientDoctorChat.vue    # Component chính cho chat & gọi
│   │   └── CallScreen.vue            # Component giao diện gọi
│   ├── services/
│   │   └── messagingService.js       # Service API cho messaging & calling
│   ├── views/
│   │   └── MessagingView.vue         # View chính cho trang messaging
│   └── router/
│       └── index.js                  # Router với route mới /messages
```

---

## 🔐 Tài Khoản Test

| Vai Trò | Username | Password |
|---------|----------|----------|
| Bệnh Nhân | benhnhan | 123 |
| Bác Sĩ | admin | 123 |

---

## 🛠️ Chạy Ứng Dụng

### Backend (FastAPI):
```bash
python main.py
# Server chạy tại http://127.0.0.1:8000
```

### Frontend (Vue.js):
```bash
cd frontend
npm run dev
# App chạy tại http://localhost:5173
```

---

## ⚠️ Lưu Ý

1. **Dữ Liệu Giả Lập**: Hiện tại, các tin nhắn và cuộc gọi được lưu trữ trong bộ nhớ của backend (không persistent). Khi restart server, dữ liệu sẽ bị mất.

2. **WebRTC Không Có**: Chức năng audio/video hiện tại là mô phỏng UI. Để có tính năng thực sự, cần tích hợp WebRTC hoặc Twilio.

3. **Real-time**: Hiện tại sử dụng polling (cập nhật mỗi 2 giây). Để có thực sự real-time, nên tích hợp WebSocket.

4. **Bảo Mật**: Chưa có xác thực token. Nên thêm JWT authentication trước khi deploy production.

---

## 🚀 Tính Năng Sắp Tới (Future Updates)

- [ ] Tích hợp WebRTC thực sự cho audio/video
- [ ] WebSocket cho real-time messaging
- [ ] Lưu trữ tin nhắn vào database SQL Server
- [ ] Hỗ trợ chia sẻ tệp tin
- [ ] Ghi hình cuộc gọi
- [ ] Thông báo push cho tin nhắn mới
- [ ] Mã hóa tin nhắn end-to-end
- [ ] Nhóm chat

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
1. Backend đang chạy? `http://127.0.0.1:8000`
2. Frontend đang chạy? `http://localhost:5173`
3. Kiểm tra console browser (F12 → Console) cho lỗi
4. Kiểm tra terminal backend cho lỗi API

---

**Phiên bản**: 1.0  
**Ngày cập nhật**: 18/04/2026
