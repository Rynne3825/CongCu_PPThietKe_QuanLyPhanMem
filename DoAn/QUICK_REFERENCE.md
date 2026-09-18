# ⚡ QUICK REFERENCE - PatientPortal & ReceptionistDashboard Data Sync

## 🎯 1 Minute Summary

**Problem:** PatientPortal data (localStorage) ≠ ReceptionistDashboard data (mock + wrong key)

**Solution:** Unify all components to use same localStorage keys

**Result:** Full data sync with zero server needed

---

## 🔑 LocalStorage Keys (7 total)

```
PatientPortal (6 keys):
  ✅ medi_user              - User profile
  ✅ medi_profiles          - Patient profiles
  ✅ medi_tickets           - Appointments/bookings
  ✅ medi_reminders         - Health reminders
  ✅ medi_qcounter          - Queue counter  
  ✅ medi_chat              - Chat history

ReceptionistDashboard (4 NEW):
  📦 medi_schedules         - Booking schedules
  📦 medi_insurance_records - Insurance verification
  📦 medi_notifications     - Sent notifications
  📦 medi_queue_history     - Check-in history
```

---

## ❌ 3 Critical Issues

| Issue | File | Fix |
|-------|------|-----|
| **Key Mismatch** | ReceptionistDashboard.vue | Change `activeTickets` → `medi_tickets` |
| **Mock Patients** | ReceptionistPatientProfile.vue | Load from `medi_profiles` |
| **No Auto-Save** | ReceptionistDashboard.vue | Add `updateLocalStorage()` calls |

---

## 📋 Ticket/Appointment Structure

```javascript
{
  id: "PK_NEW_123",
  profileId: "HS01",
  profileName: "Nguyễn Văn A",
  date: "15/04/2026",
  time: "08:30 - 09:00", 
  dept: "Nội tổng quát",
  status: "Chờ duyệt", // or: Đã đến, Đã khám, Đã đánh giá
  paymentStatus: "unpaid", // or: paid, processing
  amount: 150000,
  room: "101"
}
```

---

## 🔧 3 Quick Fixes (15 minutes)

### Fix #1: ReceptionistDashboard.vue (line ~290)
```javascript
// ❌ BEFORE
const data = localStorage.getItem('activeTickets');

// ✅ AFTER  
const data = localStorage.getItem('medi_tickets');

// ✅ ADD THIS FUNCTION
const updateLocalStorage = () => {
  localStorage.setItem('medi_tickets', JSON.stringify(appointments.value));
};

// ✅ CALL IN: confirmArrival(), updateRoom(), confirmPayment()
```

### Fix #2: ReceptionistPatientProfile.vue
```javascript
// ❌ REMOVE mock data
// const patients = ref([{ id: 'P001', ... }]);

// ✅ ADD THIS
onMounted(() => {
  const raw = localStorage.getItem('medi_profiles');
  if (raw) patients.value = JSON.parse(raw);
});

// ✅ SAVE BACK
const savePatient = () => {
  localStorage.setItem('medi_profiles', JSON.stringify(patients.value));
};
```

### Fix #3: ReceptionistDashboard.vue (walk-in)
```javascript
// Find this line in createWalkIn():
// ❌ localStorage.getItem('activeTickets')

// ✅ Change to:
// localStorage.getItem('medi_tickets')
```

---

## 📊 4 Key Flows

```
1. Booking Flow:
   PatientPortal create ticket → medi_tickets
   ReceptionistDashboard reads ← medi_tickets
   Receptionist updates → medi_tickets → PatientPortal sees update ✓

2. Patient Profile Flow:
   PatientPortal create profile → medi_profiles ✓
   ReceptionistPatientProfile reads ← medi_profiles ✓
   Edits sync bidirectionally ✓

3. Check-in Flow:
   Patient arrives → Receptionist confirms
   Updates medi_tickets status → "Đã đến" ✓
   PatientPortal sees status change ✓

4. Payment Flow:
   PatientPortal QR pay → medi_tickets.paymentStatus = paid ✓
   ReceptionistPayment reads → all shown as paid ✓
```

---

## ✅ Components to Fix (9 total)

| Component | Key | Status |
|-----------|-----|--------|
| ReceptionistDashboard | medi_tickets | 🔴 CRITICAL |
| ReceptionistPatientProfile | medi_profiles | 🔴 CRITICAL |
| ReceptionistBooking | medi_schedules | 🟠 HIGH |
| ReceptionistCheckInService | medi_queue_history | 🟠 HIGH |
| ReceptionistInsurance | medi_insurance_records | 🟠 HIGH |
| ReceptionistNotification | medi_notifications | 🟡 MEDIUM |
| ReceptionistPayment | medi_tickets | ✅ OK |
| ReceptionistCheckIn | medi_tickets | ✅ OK |
| ReceptionistOverview | medi_tickets | ✅ OK |

---

## 🧪 Test in 5 Minutes

1. **Open** PatientPortal + ReceptionistDashboard (2 browser tabs)
2. **Book** appointment in PatientPortal
3. **Refresh** ReceptionistDashboard → See booking ✓
4. **Confirm** arrival in ReceptionistDashboard  
5. **Refresh** PatientPortal → See status "Đã đến" ✓

---

## 🎓 Architecture

```
Before (Broken):           After (Fixed):
PatientPortal              PatientPortal ──┐
  └─ medi_*                               ├─ medi_* (shared)
ReceptionistDashboard      ReceptionistDashboard ──┘
  ├─ mock data (❌)        → All from localStorage ✅
  ├─ activeTickets (❌)
  └─ disconnected (❌)
```

---

## 📂 Documentation Files

| File | Purpose |
|------|---------|
| `DATA_INTEGRATION_ANALYSIS.md` | Full 10-section analysis |
| `LOCALSTORAGE_KEYS_GUIDE.md` | All keys + structures |
| `CODE_FIXES_SNIPPETS.md` | Copy-paste ready code |
| `EXECUTION_PLAN.md` | 5-hour implementation plan |
| **This file** | 2-minute quick reference |

---

## 🚀 Next Steps

1. Apply 3 critical fixes (15 min)
2. Test basic booking → check-in flow
3. Connect 4 more components (2 hours)
4. Run full regression test (1 hour)
5. Deploy + monitor

**Total time:** ~4.5 hours end-to-end

---

## 💾 Useful Debug Commands

```javascript
// View all medi_* data
Object.keys(localStorage)
  .filter(k => k.startsWith('medi_'))
  .forEach(k => console.log(k, JSON.parse(localStorage.getItem(k))))

// Clear all data
Object.keys(localStorage)
  .filter(k => k.startsWith('medi_'))
  .forEach(k => localStorage.removeItem(k))

// Export as JSON
copy(JSON.stringify(
  Object.keys(localStorage)
    .filter(k => k.startsWith('medi_'))
    .reduce((acc, k) => ({...acc, [k]: JSON.parse(localStorage.getItem(k))}), {})
, null, 2))
```

---

## 📞 Quick Links

- **ReceptionistDashboard fix:** Line 290
- **PatientProfile fix:** Top of <script setup>
- **Insurance setup:** Add saveDocuments()
- **Notification setup:** Add sendNotification()

---

