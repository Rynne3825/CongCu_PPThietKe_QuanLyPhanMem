# 🚀 EXECUTION PLAN - Data Integration Implementation

## 📅 Timeline & Implementation Steps

### Phase 1: Critical Fixes (1-2 hours)
**Goal:** Fix data sync issues between PatientPortal and ReceptionistDashboard

#### Step 1.1: Fix ReceptionistDashboard localStorage key
- **File:** `frontend/src/views/ReceptionistDashboard.vue`
- **Changes:** 
  - Line ~290: Change `activeTickets` → `medi_tickets`
  - Add `updateLocalStorage()` function
  - Call it in `confirmArrival()`, `updateRoom()`, `confirmPayment()`
- **Estimated Time:** 15 minutes
- **Testing:** 
  - Book appointment in PatientPortal
  - Verify appears in ReceptionistDashboard  
  - Update status and refresh browser
  - Verify changes persist

#### Step 1.2: Connect ReceptionistPatientProfile to localStorage
- **File:** `frontend/src/components/receptionist/ReceptionistPatientProfile.vue`
- **Changes:**
  - Remove mock patient data (P001, P002)
  - Add `loadPatients()` from `medi_profiles`
  - Update `savePatient()` to write back to `medi_profiles`
- **Estimated Time:** 20 minutes
- **Testing:**
  - Add new patient in PatientPortal
  - Verify shows in ReceptionistPatientProfile
  - Edit patient in Receptionist
  - Verify updates in PatientPortal

#### Step 1.3: Update createWalkIn to use medi_tickets
- **File:** `frontend/src/views/ReceptionistDashboard.vue`
- **Changes:**
  - Change `localStorage.getItem('activeTickets')` → `medi_tickets`
  - Call `updateLocalStorage()` after creating walk-in
- **Estimated Time:** 10 minutes
- **Testing:**
  - Create walk-in in ReceptionistDashboard
  - Verify visible in PatientPortal appointments list

---

### Phase 2: High Priority - Data Persistence (1.5-2 hours)
**Goal:** Ensure all receptionist actions save to localStorage

#### Step 2.1: Connect ReceptionistBooking to localStorage
- **File:** `frontend/src/components/receptionist/ReceptionistBooking.vue`
- **New Key:** `medi_schedules`
- **Changes:**
  - Add `loadSchedules()` function
  - Update `submitBooking()` to save to `medi_schedules`
  - Update appointment's `doctorName` + `paymentMethod` fields
- **Estimated Time:** 25 minutes
- **Testing:**
  - Create booking in ReceptionistBooking
  - Verify `medi_schedules` in DevTools
  - Edit and cancel booking
  - Verify changes in localStorage

#### Step 2.2: Connect ReceptionistCheckInService to medi_tickets
- **File:** `frontend/src/components/receptionist/ReceptionistCheckInService.vue`
- **Changes:**
  - Load patients from `medi_profiles` instead of mock
  - When check-in: find and update corresponding ticket in `medi_tickets`
  - Update status to "Đã đến"
- **Estimated Time:** 20 minutes
- **Testing:**
  - Check-in patient that was booked via PatientPortal
  - Verify status updated in PatientPortal
  - Test walk-in created in ReceptionistDashboard

#### Step 2.3: Create ReceptionistInsurance storage
- **File:** `frontend/src/components/receptionist/ReceptionistInsurance.vue`
- **New Key:** `medi_insurance_records`
- **Changes:**
  - Add `loadInsuranceRecords()` function
  - Update `saveDocuments()` to save records
  - Load insurance list from localStorage
- **Estimated Time:** 20 minutes
- **Testing:**
  - Add insurance record
  - Verify `medi_insurance_records` created in localStorage
  - Search and select records
  - Refresh page and verify data persists

---

### Phase 3: Medium Priority - Additional Features (1-1.5 hours)
**Goal:** Add notification and queue history tracking

#### Step 3.1: Create ReceptionistNotification storage
- **File:** `frontend/src/components/receptionist/ReceptionistNotification.vue`
- **New Key:** `medi_notifications`
- **Changes:**
  - Add `loadNotifications()` function
  - Update `sendNotification()` to save records
  - Display sent/pending counts from localStorage
- **Estimated Time:** 20 minutes
- **Testing:**
  - Send notification
  - Verify `medi_notifications` in localStorage
  - Check notification history
  - Verify counts update

#### Step 3.2: Create ReceptionistCheckInService queue history
- **File:** `frontend/src/components/receptionist/ReceptionistCheckInService.vue`
- **New Key:** `medi_queue_history`
- **Changes:**
  - Add `markComplete()` to save queue history
  - Track check-in → completion transitions
- **Estimated Time:** 15 minutes
- **Testing:**
  - Check-in patient
  - Mark as complete
  - Verify `medi_queue_history` created
  - Verify timestamps recorded

#### Step 3.3: Create optional composable for reusability
- **File:** `frontend/src/composables/useLocalStorage.js`
- **Changes:**
  - Create helper composable for localStorage operations
  - Refactor existing components to use it
- **Estimated Time:** 20 minutes
- **Testing:**
  - Test composable with existing components
  - No functionality changes, just refactoring

---

## 📊 Implementation Summary Table

| Phase | Component | Key | Changes | Time | Priority |
|-------|-----------|-----|---------|------|----------|
| 1 | ReceptionistDashboard | medi_tickets | Fix key + add updateLocalStorage | 15min | 🔴 CRITICAL |
| 1 | ReceptionistPatientProfile | medi_profiles | Load/save patients | 20min | 🔴 CRITICAL |
| 1 | ReceptionistDashboard (walk-in) | medi_tickets | Fix key in createWalkIn | 10min | 🔴 CRITICAL |
| 2 | ReceptionistBooking | medi_schedules | Create & load schedules | 25min | 🟠 HIGH |
| 2 | ReceptionistCheckInService | medi_tickets | Update on check-in | 20min | 🟠 HIGH |
| 2 | ReceptionistInsurance | medi_insurance_records | Create & manage | 20min | 🟠 HIGH |
| 3 | ReceptionistNotification | medi_notifications | Create & track | 20min | 🟡 MEDIUM |
| 3 | ReceptionistCheckInService | medi_queue_history | Track history | 15min | 🟡 MEDIUM |
| 3 | composables | - | Create reusable helper | 20min | 🟡 MEDIUM |
| - | **TOTAL** | - | - | **4.5-5 hrs** | - |

---

## 🔄 Testing Flow by Role

### As Patient (PatientPortal)
```
1. Create profile → Verify in Receptionist
2. Book appointment → Verify shows in Receptionist CheckIn
3. Pay for appointment → Verify status updates when Receptionist confirms arrival
4. Check-in when arriving → Verify Receptionist sees status change
5. Complete visit → Verify can rate/review
```

### As Receptionist (ReceptionistDashboard)
```
1. See patient bookings from PatientPortal ✓
2. Create walk-in → Verify shows in PatientPortal if same browser
3. Confirm arrival → Verify PaymentStatus in PatientPortal
4. Manage patient profiles → Changes persist to PatientPortal
5. Send notifications → Saved in history
6. Create booking → Saved in medi_schedules
7. Check insurance → Saved in medi_insurance_records
```

---

## 🧪 Regression Testing

After all implementations, test these critical scenarios:

### Basic Flows
- [ ] Book appointment → confirm arrival → pay → check-in → rate
- [ ] Walk-in creation → check-in → payment
- [ ] Patient profile creation → edit → delete

### Data Persistence
- [ ] Refresh page during booking
- [ ] Refresh after payment confirmation
- [ ] Refresh after patient check-in
- [ ] Close and reopen browser

### Edge Cases
- [ ] Multiple appointments for same patient
- [ ] Back button navigation
- [ ] Simultaneous edits (Patient + Receptionist)
- [ ] Large data sets (100+ appointments)

### Cross-Component
- [ ] PatientPortal edit profile → ReceptionistPatientProfile shows update
- [ ] Receptionist mark paid → PatientPortal shows paid status
- [ ] Receptionist confirm arrival → PatientPortal shows arrival status

---

## 📋 Commit Strategy

Recommend these git commits:

```bash
# Phase 1
git commit -m "fix: Fix localStorage key mismatch in ReceptionistDashboard"
git commit -m "refactor: Connect ReceptionistPatientProfile to medi_profiles"
git commit -m "fix: Update walk-in creation to use medi_tickets"

# Phase 2
git commit -m "feat: Add medi_schedules integration to ReceptionistBooking"
git commit -m "feat: Add medi_insurance_records integration"
git commit -m "feat: Connect ReceptionistCheckInService to medi_tickets"

# Phase 3
git commit -m "feat: Add medi_notifications tracking"
git commit -m "feat: Add medi_queue_history tracking"
git commit -m "refactor: Extract localStorage logic to composable"

# Final
git commit -m "test: Add integration tests for localStorage sync"
```

---

## ⚠️ Known Issues & Workarounds

### Issue: Multiple tabs/windows out of sync
**Workaround:** Add storage event listener
```javascript
window.addEventListener('storage', (e) => {
  if (e.key === 'medi_tickets') {
    appointments.value = JSON.parse(e.newValue);
  }
});
```

### Issue: Data lost on form validation error
**Solution:** Keep form data in memory until confirmed

### Issue: Walk-in ticket not visible in PatientPortal
**Reason:** Walk-in created by Receptionist, not in patient's tickets
**Solution:** Filter `profileId === loggedInUser`

---

## 📈 Success Metrics

After implementation, measure:
- ✅ 100% of bookings sync between PatientPortal and Receptionist
- ✅ 0 data loss on page refresh
- ✅ <1 second latency for localStorage operations
- ✅ All 7 components use consistent storage keys
- ✅ Zero duplicate data inconsistencies
- ✅ 100% of tests pass

---

## 🚨 Rollback Plan

If anything breaks:

1. **Revert last commit** (git revert)
2. **Clear localStorage** in browser DevTools
3. **Reload page** to get fresh state
4. **Check error logs** and redo changes

To manually clear:
```javascript
// In browser console
localStorage.removeItem('medi_tickets');
localStorage.removeItem('medi_profiles');
localStorage.removeItem('medi_schedules');
// ... etc
```

---

## 📞 Support Resources

### Files to Reference
- [`DATA_INTEGRATION_ANALYSIS.md`] - Full analysis
- [`LOCALSTORAGE_KEYS_GUIDE.md`] - Key reference
- [`CODE_FIXES_SNIPPETS.md`] - Ready-to-use code

### Debug Commands
```javascript
// In browser console
// View all localStorage
Object.keys(localStorage).filter(k => k.startsWith('medi_')).forEach(k => 
  console.log(k, ':', JSON.parse(localStorage.getItem(k)))
);

// Export data
copy(JSON.stringify({
  tickets: JSON.parse(localStorage.getItem('medi_tickets')),
  profiles: JSON.parse(localStorage.getItem('medi_profiles')),
  schedules: JSON.parse(localStorage.getItem('medi_schedules')),
}, null, 2))
```

---

