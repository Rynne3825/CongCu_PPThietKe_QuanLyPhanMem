# Phân Tích Quy Trình Làm Việc & Dữ Liệu: PatientPortal vs ReceptionistDashboard

## 📋 TÓM TẮT EXECUTIVE
- **PatientPortal**: Sử dụng localStorage cho tất cả dữ liệu (lịch khám, hồ sơ, chat)
- **ReceptionistDashboard**: Đọc `activeTickets` từ localStorage nhưng lại dùng mock data cho các component khác
- **Vấn đề**: Không có sự đồng bộ dữ liệu giữa 2 module

---

## 1️⃣ LOCALSTORAGE KEYS ĐƯỢC SỬ DỤNG

### PatientPortal.vue - Các keys hiện tại:

| Key | Mô Tả | Cấu Trúc | Nơi Sử Dụng |
|-----|-------|---------|-----------|
| `medi_user` | Thông tin người dùng | `{ name, dob, phone, address }` | Header, User Profile |
| `medi_profiles` | Danh sách hồ sơ bệnh nhân | Array of `{ id, name, phone, dob, address, bhyt, hasActiveTicket }` | Profile Management |
| `medi_tickets` | Lịch khám / Phiếu đặt khám | Array of `{ id, profileId, date, time, dept, queueNumber, status, paymentStatus, amount }` | Booking, Check-in |
| `medi_reminders` | Nhắc nhở sức khỏe hàng ngày | Array of `{ id, time, task, isDone }` | Health Reminders |
| `medi_qcounter` | Bộ đếm số thứ tự toàn cục | Number | Queue Management |
| `medi_chat` | Lịch sử chat với AI | Array of `{ sender, text, options }` | Chatbot |

### ReceptionistDashboard.vue - Cách đọc dữ liệu:

| Key | Mô Tả | Nó Đang Làm Gì |
|-----|-------|---|
| `activeTickets` | Lịch khám từ PatientPortal | Đọc từ `medi_tickets` và thiết lập lại |

---

## 2️⃣ CẤU TRÚC DỮ LIỆU CHI TIẾT

### 📌 Ticket/Appointment Object (Appointment Structure)

```javascript
// PatientPortal - medi_tickets
{
  id: "PK_NEW_123",                    // ID lịch hẹn
  profileId: "HS01",                  // Liên kết hồ sơ bệnh nhân
  profileName: "Nguyễn Văn Bệnh Nhân", // Tên bệnh nhân (copy từ profile)
  profileAddress: "Hải Châu, Đà Nẵng", // Địa chỉ
  profilePhone: "0901234567",         // Số điện thoại
  dateRaw: "2026-04-15",              // Ngày khám (ISO format)
  date: "15/04/2026",                 // Ngày khám (VN format)
  time: "08:30 - 09:00",              // Giờ khám
  dept: "Nội tổng quát",              // Chuyên khoa
  queueNumber: 12,                    // Số thứ tự
  status: "Chờ duyệt",                // Trạng thái: Chờ duyệt, Đã đến, Đã khám, Đã đánh giá
  paymentStatus: "unpaid",            // unpaid, processing, paid
  amount: 150000,                     // Tiền khám
  transactionId: "VNPay_19283",       // Mã giao dịch (nếu đã thanh toán)
  isWalkIn: false,                    // Có phải walk-in không?
  room: "101",                        // Phòng khám (được gán sau)
  
  // Thêm vào từ ReceptionistDashboard:
  doctorName: "PGS.TS Nguyễn Văn A",  // Tên bác sĩ
  doctorId: "doctor1",                // ID bác sĩ
  paymentMethod: "Thanh toán tại quầy" // Cách thanh toán
}
```

### 📌 Profile/Patient Object

```javascript
// PatientPortal - medi_profiles
{
  id: "HS01",                    // ID hồ sơ
  name: "Nguyễn Văn Bệnh Nhân",  // Họ tên
  phone: "0901234567",           // Số điện thoại
  dob: "15/04/1990",             // Ngày sinh (VN format trong storage)
  address: "Hải Châu, Đà Nẵng",  // Địa chỉ
  bhyt: "DN40123456789",         // Số BHYT
  hasActiveTicket: false         // Đang có lịch hẹn chưa?
}

// ReceptionistDashboard - uses mock data for patients
{
  id: "P001",                     // ID bệnh nhân
  name: "Nguyễn Văn A",
  phone: "0901234567",
  dob: "1990-04-15",             // Ngày sinh (ISO format)
  gender: "Nam",
  address: "Hải Châu, Đà Nẵng",
  bhyt: "DN40123456789",
  notes: "Bệnh nhân thường xuyên",
  visits: 15,                     // Số lần khám
  lastVisit: "10/04/2026"        // Lần khám cuối
}
```

---

## 3️⃣ DANH SÁCH CÁC COMPONENT RECEPTIONIST DASHBOARD

| # | Component | Chức Năng | Dữ Liệu Hiện Tại | Vấn Đề |
|----|-----------|----------|-----------------|-------|
| 1 | **ReceptionistOverview** | Tổng quan hôm nay | ✅ Từ appointments prop | OK |
| 2 | **ReceptionistCheckIn** | Xác nhận đến khám | ✅ Từ appointments prop | OK |
| 3 | **ReceptionistQueue** | Quản lý hàng chờ | ✅ Từ appointments prop | OK |
| 4 | **ReceptionistPayment** | Thu tiền & thanh toán | ✅ Từ appointments prop | OK |
| 5 | **ReceptionistPatientProfile** | Quản lý hồ sơ bệnh nhân | ❌ Mock data (P001, P002) | Cần kết nối localStorage |
| 6 | **ReceptionistBooking** | Đặt lịch khám | ❌ Mock data (schedules) | Cần kết nối localStorage |
| 7 | **ReceptionistCheckInService** | Tiếp nhận dịch vụ | ❌ Mock data (patients) | Cần kết nối localStorage |
| 8 | **ReceptionistInsurance** | Xác minh BHYT | ❌ Mock data | Cần kết nối localStorage |
| 9 | **ReceptionistNotification** | Gửi thông báo | ❌ Mock data | Cần tạo storage mới |
| 10 | **ReceptionistReport** | Báo cáo & thống kê | ❌ Mock data | Cần tạo storage mới |
| 11 | **ReceptionistWalkIn** | Tiếp đón walk-in | ✅ Tạo phiếu vào localStorage | OK |

---

## 4️⃣ QUY TRÌNH TỰA LƯU MẶC ĐỊNH HIỆN TẠI

### PatientPortal QUY TRÌNH:

#### A. Bệnh nhân ĐẶT LỊCH KHÁM
```
1. Bệnh nhân chọn profileId + chuyên khoa + ngày/giờ
2. Tạo ticket object
3. Push vào medi_tickets
4. Cập nhật hasActiveTicket = true trong medi_profiles
5. Tăng medi_qcounter
6. Lưu vào localStorage
```

**localStorage sau đó:**
```
medi_profiles: [
  { id: "HS01", name: "...", hasActiveTicket: true },  // ✅ Đánh dấu có lịch
  ...
]
medi_tickets: [
  { id: "PK_NEW_123", profileId: "HS01", status: "Chờ duyệt", ... }  // ✅ Lịch mới
]
```

#### B. Bệnh nhân THANH TOÁN
```
1. Lấy ticket từ medi_tickets
2. Mở modal QR payment / VNPay
3. Nếu thanh toán thành công:
   - Cập nhật ticket.paymentStatus = "paid"
   - Lưu transactionId
   - Cập nhật medi_tickets
```

#### C. Bệnh nhân CHECK-IN (Khi đến khám)
```
1. Bệnh nhân xác nhận đã đến
2. Cập nhật ticket.status = "Đã đến" (hoặc do receptionist Update)
3. Lưu vào medi_tickets
```

### ReceptionistDashboard QUY TRÌNH:

#### I. KHỞI ĐỘNG HỆ THỐNG
```javascript
// Đoạn code trong ReceptionistDashboard.vue:
const loadAppointments = () => {
  const data = localStorage.getItem('activeTickets');  // ❌ SAI: Tìm 'activeTickets'
  if (data) {
    const tickets = JSON.parse(data);
    // Ánh xạ lại dữ liệu
    appointments.value = tickets.map(ticket => ({...}));
  }
};
```

⚠️ **ISSUE**: Code tìm `activeTickets` nhưng PatientPortal lưu vào `medi_tickets`

#### II. WALK-IN KHÁCH
```
1. Receptionist tạo patient walk-in mới
2. Tạo ticket object
3. Push vào localStorage.activeTickets
4. Thêm vào appointments list
```

#### III. XÁCH NHẬN / THANH TOÁN / IN PHIẾU
```
1. Đọc từ appointments.value (vào từ localStorage)
2. Cập nhật dữ liệu
3. Lưu lại vào localStorage.activeTickets
```

---

## 5️⃣ CÁC VẤN ĐỀ & CHỖ CẦN CẬP NHẬT

### 🔴 VẤNĐỀ CHÍNH:

1. **Key Mismatch** 
   - PatientPortal lưu: `medi_tickets`
   - ReceptionistDashboard tìm: `activeTickets`
   - → **Giải pháp**: Thống nhất sử dụng `medi_tickets`

2. **Dữ Liệu Hồ Sơ Bệnh Nhân Không Đồng Bộ**
   - PatientPortal: `medi_profiles` (array)
   - ReceptionistDashboard PatientProfile: Mock data (P001, P002)
   - → **Giải pháp**: Component đọc từ `medi_profiles`

3. **Dữ Liệu Lịch Hẹn Không Phải Tất Cả Được Preview**
   - ReceptionistBooking component: Mock schedules không được lưu
   - → **Giải pháp**: Tạo storage key `medi_schedules`

4. **Thông Báo Không Lưu Storage**
   - ReceptionistNotification: Gửi thông báo nhưng không lưu
   - → **Giải pháp**: Tạo storage key `medi_notifications`

5. **BHYT/Insurance Không Lưu Storage**
   - ReceptionistInsurance: Mock data không được lưu
   - → **Giải pháp**: Tạo storage key `medi_insurance_records`

---

## 6️⃣ NHỮNG CHỖ CẦN CẬP NHẬT

### A. ReceptionistDashboard.vue

**Sửa:**
```javascript
// ❌ CỰ (dòng ~290)
const loadAppointments = () => {
  const data = localStorage.getItem('activeTickets');  // ❌ SAI
  
// ✅ THÀNH
const loadAppointments = () => {
  const data = localStorage.getItem('medi_tickets');   // ✅ ĐÚNG
```

### B. ReceptionistPatientProfile.vue

**Sửa:**
```javascript
// ❌ CỰ (Mock data)
const patients = ref([
  { id: 'P001', name: 'Nguyễn Văn A', ... },
  { id: 'P002', name: 'Trần Thị B', ... },
]);

// ✅ THÀNH
const loadPatients = () => {
  try {
    const profiles = localStorage.getItem('medi_profiles');
    if (profiles) {
      patients.value = JSON.parse(profiles);
      return;
    }
  } catch (e) {}
  // Fallback
  patients.value = [
    { id: 'P001', name: 'Nguyễn Văn A', ... },
  ];
};

onMounted(() => loadPatients());
```

### C. ReceptionistBooking.vue

**Thêm:**
```javascript
// Lưu lịch hẹn vào localStorage
const submitBooking = () => {
  const newSchedule = {
    id: 'SCH_' + Date.now(),
    patientName: bookingForm.value.patientName,
    // ... các field khác
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  // Lưu vào localStorage
  const schedules = JSON.parse(localStorage.getItem('medi_schedules') || '[]');
  schedules.push(newSchedule);
  localStorage.setItem('medi_schedules', JSON.stringify(schedules));
  
  emit('schedule-created', newSchedule);
};
```

### D. ReceptionistCheckInService.vue

**Sửa:**
```javascript
// Khi check-in, cập nhật medi_tickets
const markComplete = (patientId) => {
  const tickets = JSON.parse(localStorage.getItem('medi_tickets') || '[]');
  const ticket = tickets.find(t => t.profileId === patientId);
  if (ticket) {
    ticket.status = 'Đã khám';
    localStorage.setItem('medi_tickets', JSON.stringify(tickets));
  }
};
```

### E. ReceptionistInsurance.vue

**Thêm:**
```javascript
const saveDocuments = () => {
  const insuranceRecord = {
    id: 'INS_' + Date.now(),
    patientName: documentForm.value.patientName,
    bhytNumber: documentForm.value.bhytNumber,
    // ... other fields
  };
  
  const records = JSON.parse(localStorage.getItem('medi_insurance_records') || '[]');
  records.push(insuranceRecord);
  localStorage.setItem('medi_insurance_records', JSON.stringify(records));
  
  emit('documents-saved');
};
```

### F. ReceptionistNotification.vue

**Thêm:**
```javascript
const sendNotification = () => {
  const notification = {
    id: 'NOTIF_' + Date.now(),
    type: notificationForm.value.type,
    patientId: notificationForm.value.patientId,
    channel: notificationForm.value.channel,
    content: notificationForm.value.content,
    status: 'sent',
    timestamp: new Date().toISOString()
  };
  
  const notifications = JSON.parse(localStorage.getItem('medi_notifications') || '[]');
  notifications.push(notification);
  localStorage.setItem('medi_notifications', JSON.stringify(notifications));
  
  emit('notification-sent');
};
```

---

## 7️⃣ CÁC LOCALSTORAGE KEYS CẦN CỘNG THÊM

| Key | Mục Đích | Cấu Trúc | Component |
|-----|---------|---------|-----------|
| `medi_schedules` | Danh sách lịch hẹn được tạo | Array of scheduling objects | ReceptionistBooking |
| `medi_insurance_records` | Hồ sơ BHYT được xác minh | Array of insurance objects | ReceptionistInsurance |
| `medi_notifications` | Lịch sử thông báo gửi | Array of notification objects | ReceptionistNotification |
| `medi_queue_history` | Lịch sử xếp hàng | Array of queue records | ReceptionistCheckInService |

---

## 8️⃣ ĐỬI CHIẾU QUNG TRÌNH - CÓ CHI TIẾT

### 🔄 FULL WORKFLOW: From Booking to Completion

```
BƯỚC 1: BỆNH NHÂN ĐẶT LỊCH (PatientPortal)
├─ Chọn hồ sơ → profiles.value
├─ Chọn chuyên khoa / ngày / giờ
├─ Tạo ticket object (status="Chờ duyệt")
├─ Push vào medi_tickets
├─ Cập nhật profile.hasActiveTicket=true
└─ Lưu localStorage

BƯỚC 2: BỆNH NHÂN THANH TOÁN (PatientPortal)
├─ Mở qr-payment / VNPay
├─ Thanh toán thành công
├─ Cập nhật ticket.paymentStatus="paid"
├─ Lưu transactionId
└─ Cập nhật medi_tickets

BƯỚC 3: RECEPTIONIST KHỞI ĐỘNG (ReceptionistDashboard)
├─ Đọc medi_tickets (❌ Hiện tại tìm activeTickets)
├─ Ánh xạ vào appointments.value
├─ Hiển thị ttrạng thái thanh toán / lịch hẹn
└─ Chờ bệnh nhân đến / check-in

BƯỚC 4: BỆNH NHÂN ĐẾN + CHECK-IN (ReceptionistCheckIn)
├─ Receptionist tìm bệnh nhân theo số điện thoại
├─ Xác nhận đến → cập nhật status="Đã đến"
├─ Lưu vào medi_tickets
└─ Thêm vào queue (ReceptionistQueue.vue)

BƯỚC 5: IN PHIẾU + PHÂN PHÒNG (ReceptionistQueue)
├─ Receptionist gán phòng (room="101")
├─ In phiếu số thứ tự
├─ Cập nhật ticket.room
└─ Lưu medi_tickets

BƯỚC 6: HOÀN THÀNH + THANH TOÁN LẠI (ReceptionistPayment)
├─ Receptionist xác nhận hoàn thành khám
├─ Cập nhật ticket.status="Đã khám"
├─ Nếu chưa thanh toán → click "Thu tiền"
├─ Cập nhật payment.Status="paid"
└─ Lưu medi_tickets

BƯỚC 7: ĐÁNH GIÁ (PatientPortal)
├─ Bệnh nhân xem lịch khám đã hoàn thành
├─ Click "Đánh giá"
├─ Chọn số sao + viết bình luận
├─ Cập nhật ticket.status="Đã đánh giá"
└─ Lưu medi_tickets
```

---

## 9️⃣ KHOẢNG CÁCH GIỮA 2 HƯỚNG HỌC KIẾN TRÚC

### PatientPortal - Model 1: **Local Storage Everything**
```
Patient Browser       localStorage
    ↓                    ↓
Input Data      →     Save (medi_*)
Read Data       ←     Load (medi_*)
    ↓                    ↓
Display / Update
```

### ReceptionistDashboard - Model 2: **Partial Integration** 
```
Receptionist Browser     localStorage
       ↓                    ↓
  Appointments    →     Read activeTickets (❌ WRONG KEY)
  Mock Patients   
  Walk-in Creation →    Save to activeTickets
       ↓                    ↓
  Display / Update   
```

### Ideal - Model 3: **Unified Data Sharing**
```
PatientPortal                    ReceptionistDashboard
    ↓                                ↓
  Input                         Monitor/Update  
    ↓                                ↓
  ← → localStorage (medi_*) ← → 
    ↓                                ↓
  Display/Update                Display/Update
```

---

## 🔟 SỰ KHÔNG NHẤT QUÁN HIỆN TẠI

| Quy Trình | PatientPortal | ReceptionistDashboard | Kết Quả |
|----------|----------------|----------------------|--------|
| **Đặt lịch** | Lưu medi_tickets | Đọc activeTickets ❌ | Dữ liệu không đồng bộ |
| **Hồ sơ bệnh nhân** | medi_profiles ✅ | Mock P001, P002 ❌ | Không thấy dữ liệu mới |
| **Lịch hẹn** | medi_tickets ✅ | appointments (read) ✅ | Tạm ổn |
| **Lịch sử nhắc hẹn** | medi_reminders ✅ | Không có ❌ | Không lưu thông báo |
| **Walk-in** | Tạo ticket ✅ | Lưu activeTickets (❌ sai key) | Chỉ receptionist thấy |

---

## 📊 KẾT LUẬN & RECOMMENDATIONS

### Mức Độ Ưu Tiên Cấp (Priority)

| Ưu Tiên | Công Việc | Tác Động | Độ Khó |
|---------|----------|---------|--------|
| 🔴 **CRITICAL** | Fix key mismatch (`activeTickets` → `medi_tickets`) | Cao - Toàn bộ hệ thống | Dễ |
| 🔴 **CRITICAL** | Kết nối ReceptionistPatientProfile với medi_profiles | Cao | Dễ |
| 🟠 **HIGH** | Kết nối ReceptionistBooking với localStorage | Cao | Trung bình |
| 🟠 **HIGH** | Tạo `medi_insurance_records` | Trung bình | Dễ |
| 🟠 **HIGH** | Tạo `medi_notifications` | Trung bình | Dễ |
| 🟡 **MEDIUM** | Tạo `medi_schedules` | Thấp | Trung bình |
| 🟡 **MEDIUM** | Tạo `medi_queue_history` | Thấp | Trung bình |

---

## 📝 CÁC FILE CẦN CẬP NHẬT

```
CẦN CẬP NHẬT (7 files):
├─ ReceptionistDashboard.vue (sửa key + updateLocalStorage())
├─ ReceptionistPatientProfile.vue (kết nối medi_profiles)
├─ ReceptionistBooking.vue (lưu medi_schedules)
├─ ReceptionistCheckInService.vue (lưu medi_queue_history)
├─ ReceptionistInsurance.vue (tạo medi_insurance_records)
├─ ReceptionistNotification.vue (tạo medi_notifications)
└─ PatientPortal.vue (đảm bảo watch() lưu tất cả thay đổi)
```

---

