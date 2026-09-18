# 📌 LOCALSTORAGE KEYS & INTEGRATION CHECKLIST

## 🗂️ LocalStorage Keys Overview

### PatientPortal Keys (6 keys)
```
✅ medi_user              → User profile (name, dob, phone, address)
✅ medi_profiles          → Patient profiles array
✅ medi_tickets           → Appointments/bookings array
✅ medi_reminders         → Health reminders array
✅ medi_qcounter          → Global queue counter (number)
✅ medi_chat              → Chatbot conversation history
```

### ReceptionistDashboard Keys
```
❌ activeTickets          → WRONG! Should be medi_tickets
⚠️  (Create needed keys)  → medi_schedules, medi_notifications, medi_insurance_records
```

---

## 📊 Data Structure Reference

### Ticket/Appointment Structure
```javascript
{
  id: "PK_NEW_123",
  profileId: "HS01",
  profileName: "Nguyễn Văn A",
  profilePhone: "0901234567",
  profileAddress: "Hải Châu, Đà Nẵng",
  dateRaw: "2026-04-15",
  date: "15/04/2026",
  time: "08:30 - 09:00",
  dept: "Nội tổng quát",
  queueNumber: 12,
  status: "Chờ duyệt",           // Chờ duyệt | Đã đến | Đã khám | Đã đánh giá
  paymentStatus: "unpaid",        // unpaid | processing | paid
  amount: 150000,
  transactionId: "VNPay_19283",   // Optional
  doctorName: "PGS.TS Nguyễn Văn A",
  doctorId: "doctor1",
  paymentMethod: "Thanh toán tại quầy",
  room: "101",                    // Optional
  isWalkIn: false
}
```

### Profile Structure
```javascript
{
  id: "HS01",
  name: "Nguyễn Văn A",
  phone: "0901234567",
  dob: "15/04/1990",              // VN format in storage
  address: "Hải Châu, Đà Nẵng",
  bhyt: "DN40123456789",
  hasActiveTicket: false          // Patient can't book if true
}
```

---

## ⚠️ Critical Issues & Quick Fixes

### Issue #1: Key Mismatch
**File:** `ReceptionistDashboard.vue` line ~290

❌ BEFORE:
```javascript
const data = localStorage.getItem('activeTickets');
```

✅ AFTER:
```javascript
const data = localStorage.getItem('medi_tickets');
```

---

### Issue #2: Mock Patient Data in ReceptionistPatientProfile
**File:** `ReceptionistPatientProfile.vue`

❌ BEFORE:
```javascript
const patients = ref([
  { id: 'P001', name: 'Nguyễn Văn A', ... },
  { id: 'P002', name: 'Trần Thị B', ... }
]);
```

✅ AFTER:
```javascript
const loadPatients = () => {
  const raw = localStorage.getItem('medi_profiles');
  if (raw) {
    patients.value = JSON.parse(raw);
  }
};

onMounted(() => loadPatients());
```

---

### Issue #3: updateLocalStorage() Missing
**File:** `ReceptionistDashboard.vue`

❌ MISSING after confirmArrival/updateRoom/confirmPayment

✅ ADD:
```javascript
const updateLocalStorage = () => {
  localStorage.setItem('medi_tickets', JSON.stringify(appointments.value));
};
```

---

## ✅ Component Integration Checklist

- [ ] **ReceptionistDashboard.vue**
  - [ ] Fix: Change 'activeTickets' → 'medi_tickets'
  - [ ] Add: updateLocalStorage() function
  - [ ] Add: Call updateLocalStorage() after confirmArrival, updateRoom, confirmPayment

- [ ] **ReceptionistPatientProfile.vue**
  - [ ] Replace mock data with localStorage read
  - [ ] Load from 'medi_profiles' on mount
  - [ ] Save back to 'medi_profiles' when adding/editing

- [ ] **ReceptionistBooking.vue**
  - [ ] Create schedules → save to 'medi_schedules'
  - [ ] Load schedules from 'medi_schedules'
  - [ ] Update 'medi_tickets' when booking confirmed

- [ ] **ReceptionistCheckInService.vue**
  - [ ] Load patients from 'medi_profiles'
  - [ ] When check-in: update 'medi_tickets' status
  - [ ] Save queue history to 'medi_queue_history'

- [ ] **ReceptionistInsurance.vue**
  - [ ] Create new key 'medi_insurance_records'
  - [ ] Save insurance data on form submit
  - [ ] Load insurance records on mount

- [ ] **ReceptionistNotification.vue**
  - [ ] Create new key 'medi_notifications'
  - [ ] Save sent notifications
  - [ ] Load notification history

- [ ] **ReceptionistReport.vue**
  - [ ] Use 'medi_tickets' + 'medi_notifications' for reports
  - [ ] Filter by date range from localStorage data

---

## 🔄 Data Flow Diagram

```
PatientPortal (Write)          ReceptionistDashboard (Read/Write)
    |                                    |
    v                                    v
medi_user            ←→ (Sync)        Header Display
medi_profiles        ←→ (Sync)        PatientProfile Component
medi_tickets         ←→ (Sync)        All Components
medi_reminders       ←→ (Write Only)  -
medi_qcounter        ←→ (Sync)        Queue Management
medi_chat            ←→ (Write Only)  -
                                      ↓
                    CREATE (if missing):
                    medi_schedules       ← ReceptionistBooking
                    medi_insurance_records ← ReceptionistInsurance
                    medi_notifications   ← ReceptionistNotification
                    medi_queue_history   ← ReceptionistCheckInService
```

---

## 📋 New Keys to Create

| Key | Purpose | Component | Sample Value |
|-----|---------|-----------|---|
| `medi_schedules` | Booking schedules list | ReceptionistBooking | `[{id, patientName, date, time, ...}]` |
| `medi_insurance_records` | Insurance verification | ReceptionistInsurance | `[{id, bhytNumber, status, ...}]` |
| `medi_notifications` | Notification history | ReceptionistNotification | `[{id, type, content, status, ...}]` |
| `medi_queue_history` | Queue transaction log | ReceptionistCheckInService | `[{id, patientId, timestamp, ...}]` |

---

## 🎯 Implementation Priority

1. **CRITICAL** (Do First - Blocks everything)
   - Fix activeTickets → medi_tickets
   - Add updateLocalStorage() to ReceptionistDashboard
   - Connect PatientProfile to medi_profiles

2. **HIGH** (Do Next - Affects data consistency) 
   - ReceptionistBooking → medi_schedules
   - ReceptionistInsurance → medi_insurance_records
   - ReceptionistCheckInService → medi_queue_history

3. **MEDIUM** (Nice to Have)
   - ReceptionistNotification → medi_notifications
   - ReceptionistReport improvements

---

## 📚 Key Takeaways

✅ **Current State:** PatientPortal data is locally isolated
❌ **Problem:** ReceptionistDashboard uses wrong storage and mock data
🎯 **Solution:** Standardize all components to use consistent localStorage keys
🔒 **Benefit:** Data syncs automatically, no server needed during local dev

---

