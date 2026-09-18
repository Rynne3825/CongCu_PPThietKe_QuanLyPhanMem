# Hệ Thống Quản Lý Phòng Khám Trực Tuyến - MediSmart

Đây là một hệ thống quản lý phòng khám trực tuyến hiện đại, được xây dựng bằng **Vue.js 3**, **FastAPI**, và **Tailwind CSS**.

## 🎯 Tính Năng Chính

- **Đặt Lịch Khám Trực Tuyến**: Bệnh nhân có thể dễ dàng đặt lịch khám
- **Chatbot AI (MediSmart AI)**: Hỗ trợ tư vấn sức khỏe 24/7
- **Quản Lý Hồ Sơ Bệnh Nhân**: Lưu trữ và quản lý hồ sơ điện tử
- **Hệ Thống Thanh Toán**: Tích hợp thanh toán QR Code (VietQR)
- **Bảng Giá Thuốc**: Tra cứu giá thuốc tham khảo
- **Dashboard Bác Sĩ**: Giao diện quản lý cho bác sĩ

## 🚀 Hướng Dẫn Cài Đặt

### Yêu Cầu
- **Node.js** 16+ và **npm**
- **Python** 3.8+
- **npm** hoặc **yarn**

### 1️⃣ Cài Đặt Backend (FastAPI)

```bash
# Tạo virtual environment
python -m venv .venv

# Kích hoạt virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt

# Chạy server FastAPI
python main.py
```

Server FastAPI sẽ chạy tại `http://127.0.0.1:8000`

### 2️⃣ Cài Đặt Frontend (Vue.js)

```bash
# Vào thư mục frontend
cd frontend

# Cài đặt npm packages
npm install

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173`

## 📝 Tài Khoản Test

### Đăng Nhập Bệnh Nhân
- **Tên đăng nhập**: `benhnhan`
- **Mật khẩu**: `123`

### Đăng Nhập Bác Sĩ / Admin
- **Tên đăng nhập**: `admin`
- **Mật khẩu**: `123`

## 🔧 Cấu Hình API

### Google Generative AI (Chatbot)
Để sử dụng chatbot AI, bạn cần:

1. Có tài khoản Google Cloud
2. Lấy API Key từ [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Thay thế `AIzaSyA_DÁN_API_KEY_CỦA_BẠN_VÀO_ĐÂY` trong file `main.py`

```python
genai.configure(api_key="YOUR_API_KEY_HERE")
```

## 📂 Cấu Trúc Thư Mục

```
Doan_2/
├── main.py                 # Backend FastAPI
├── requirements.txt        # Dependencies Python
├── .venv/                  # Virtual environment
├── frontend/               # Ứng dụng Vue.js
│   ├── src/
│   │   ├── views/         # Trang chính (PatientPortal, LoginView, DoctorDashboard)
│   │   ├── router/        # Định tuyến
│   │   ├── App.vue        # Component chính
│   │   ├── main.js        # Entry point
│   │   └── index.css      # Tailwind CSS
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── ai_service/            # (Tương lai)
```

## 🐛 Xử Lý Vấn Đề

### Frontend không hiển thị CSS
- Chắc chắn rằng bạn đã cài đặt `npm install` trong thư mục `frontend`
- Tailwind CSS phải được import trong `src/index.css`

### API không kết nối được
- Kiểm tra xem server FastAPI có chạy trên port `8000` không
- Kiểm tra CORS settings trong `main.py`

### Chatbot AI không hoạt động
- Kiểm tra xem API Key Google Generative AI có hợp lệ không
- Kiểm tra kết nối internet

## 📞 Hỗ Trợ

Liên hệ nhà phát triển để được hỗ trợ kỹ thuật.

## 📄 Bản Quyền

Bản quyền © 2026 - Đồ án nhóm
