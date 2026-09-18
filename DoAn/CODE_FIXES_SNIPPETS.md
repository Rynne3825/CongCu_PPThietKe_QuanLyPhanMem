# 🔧 CODE SNIPPETS - Ready-to-Use Fixes

## 1️⃣ ReceptionistDashboard.vue - Critical Fix

### Fix #1: Change localStorage key
```javascript
// Line ~290 in loadAppointments()
// ❌ REMOVE THIS:
// const data = localStorage.getItem('activeTickets');

// ✅ CHANGE TO:
const data = localStorage.getItem('medi_tickets');
```

### Fix #2: Add updateLocalStorage() function
```javascript
// Add this function in the <script setup>
const updateLocalStorage = () => {
  localStorage.setItem('medi_tickets', JSON.stringify(appointments.value));
};
```

### Fix #3: Call updateLocalStorage() in methods
```javascript
// After confirmArrival()
const confirmArrival = (aptId) => {
  const apt = appointments.value.find(a => a.id === aptId);
  if (apt) {
    apt.status = 'Đã đến';
    updateLocalStorage();  // ✅ ADD THIS
    showToast('success', 'Xác nhận thành công', `${apt.patientName} đã đến khám`);
  }
};

// After updateRoom()
const updateRoom = (event) => {
  const { aptId, room } = event;
  const apt = appointments.value.find(a => a.id === aptId);
  if (apt) {
    apt.room = room;
    updateLocalStorage();  // ✅ ADD THIS
  }
};

// After confirmPayment()
const confirmPayment = (aptId) => {
  const apt = appointments.value.find(a => a.id === aptId);
  if (apt) {
    apt.paymentStatus = 'paid';
    updateLocalStorage();  // ✅ ADD THIS
    showToast('success', 'Thu tiền thành công', `...`);
  }
};
```

---

## 2️⃣ ReceptionistPatientProfile.vue - Connect to medi_profiles

### Full Integration Code
```vue
<script setup>
import { ref, computed, onMounted } from 'vue';

const emit = defineEmits(['patient-selected', 'patient-saved']);

const searchQuery = ref('');
const selectedPatient = ref(null);
const isEditMode = ref(false);
const editForm = ref({
  id: '',
  name: '',
  phone: '',
  dob: '',
  gender: '',
  address: '',
  bhyt: '',
  notes: '',
  visits: 0,
  lastVisit: ''
});

// ✅ NEW: Load from localStorage instead of mock data
const patients = ref([]);

const loadPatients = () => {
  try {
    const raw = localStorage.getItem('medi_profiles');
    if (raw) {
      const profiles = JSON.parse(raw);
      // Transform from medi_profiles format
      patients.value = profiles.map(p => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        dob: p.dob,
        gender: p.gender || 'Nam',
        address: p.address,
        bhyt: p.bhyt,
        notes: p.notes || '',
        visits: 0,
        lastVisit: 'N/A'
      }));
    } else {
      // Fallback to default if no data
      patients.value = [
        { id: 'P001', name: 'Nguyễn Văn A', phone: '0901234567', ... }
      ];
    }
  } catch (e) {
    console.error('Error loading patients:', e);
  }
};

// ✅ NEW: Save back to localStorage
const savePatient = () => {
  if (!editForm.value.name || !editForm.value.phone) {
    return; // Show error
  }

  if (isEditMode.value) {
    const index = patients.value.findIndex(p => p.id === editForm.value.id);
    if (index !== -1) {
      patients.value[index] = { ...editForm.value };
    }
  } else {
    const newId = 'HS' + String(patients.value.length + 1).padStart(2, '0');
    patients.value.push({
      id: newId,
      ...editForm.value
    });
  }

  // ✅ Save to localStorage
  localStorage.setItem('medi_profiles', JSON.stringify(patients.value));
  
  resetForm();
  emit('patient-saved', editForm.value);
};

const resetForm = () => {
  editForm.value = {
    id: '', name: '', phone: '', dob: '', gender: '', address: '', bhyt: '', notes: '', visits: 0, lastVisit: ''
  };
  isEditMode.value = false;
};

const selectPatient = (patient) => {
  selectedPatient.value = patient;
  emit('patient-selected', patient);
};

const searchPatients = () => {
  // Already handled by computed filteredPatients
};

const filteredPatients = computed(() => {
  if (!searchQuery.value) return patients.value;
  const q = searchQuery.value.toLowerCase();
  return patients.value.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.phone.includes(q) ||
    p.bhyt.includes(q)
  );
});

// ✅ NEW: Load on mount
onMounted(() => {
  loadPatients();
});
</script>
```

---

## 3️⃣ ReceptionistBooking.vue - Save to medi_schedules

### Add to <script setup>
```javascript
import { ref, computed, onMounted } from 'vue';

const emit = defineEmits(['schedule-created', 'schedule-updated', 'schedule-cancelled']);

const bookingForm = ref({
  patientName: '',
  phone: '',
  doctorId: '',
  room: '',
  date: '',
  time: '',
  serviceType: 'general',
  notes: ''
});

// ✅ NEW: Schedules from localStorage
const schedules = ref([]);

const loadSchedules = () => {
  try {
    const raw = localStorage.getItem('medi_schedules');
    schedules.value = raw ? JSON.parse(raw) : [];
  } catch (e) {
    schedules.value = [];
  }
};

// ✅ NEW: Save schedule to localStorage
const submitBooking = () => {
  if (!bookingForm.value.patientName || !bookingForm.value.phone || !bookingForm.value.doctorId) {
    return; // Show validation error
  }

  const newSchedule = {
    id: 'SCH_' + Date.now(),
    patientName: bookingForm.value.patientName,
    phone: bookingForm.value.phone,
    doctorId: bookingForm.value.doctorId,
    doctorName: getDoctorName(bookingForm.value.doctorId),
    room: bookingForm.value.room,
    date: bookingForm.value.date,
    time: bookingForm.value.time,
    serviceType: bookingForm.value.serviceType,
    notes: bookingForm.value.notes,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  // Save to localStorage
  schedules.value.push(newSchedule);
  localStorage.setItem('medi_schedules', JSON.stringify(schedules.value));

  // Reset form
  bookingForm.value = {
    patientName: '', phone: '', doctorId: '', room: '', date: '', time: '', serviceType: 'general', notes: ''
  };

  emit('schedule-created', newSchedule);
};

// ✅ NEW: Load on mount
onMounted(() => {
  loadSchedules();
});
```

---

## 4️⃣ ReceptionistCheckInService.vue - Update medi_tickets

### Add ticket update logic
```javascript
const submitCheckIn = () => {
  if (!checkInForm.value.patientName || !checkInForm.value.serviceType) {
    return; // Show error
  }

  // Create check-in record
  const checkInRecord = {
    id: 'CI_' + Date.now(),
    patientName: checkInForm.value.patientName,
    serviceType: checkInForm.value.serviceType,
    complaint: checkInForm.value.complaint,
    priority: checkInForm.value.priority,
    timestamp: new Date().toISOString(),
    status: 'checked-in'
  };

  // ✅ NEW: Update medi_tickets
  try {
    const tickets = JSON.parse(localStorage.getItem('medi_tickets') || '[]');
    const ticket = tickets.find(t => t.profileName.toLowerCase() === checkInForm.value.patientName.toLowerCase());
    if (ticket) {
      ticket.status = 'Đã đến';
      localStorage.setItem('medi_tickets', JSON.stringify(tickets));
    }
  } catch (e) {
    console.error('Error updating ticket:', e);
  }

  // Save to medi_queue_history
  try {
    const history = JSON.parse(localStorage.getItem('medi_queue_history') || '[]');
    history.push(checkInRecord);
    localStorage.setItem('medi_queue_history', JSON.stringify(history));
  } catch (e) {
    console.error('Error saving queue history:', e);
  }

  emit('patient-checked-in',
    { patientName: checkInForm.value.patientName, serviceType: checkInForm.value.serviceType }
  );

  // Reset form
  checkInForm.value = { patientName: '', serviceType: '', complaint: '', priority: 'normal' };
};

const markComplete = (patientId) => {
  try {
    const tickets = JSON.parse(localStorage.getItem('medi_tickets') || '[]');
    const ticket = tickets.find(t => t.profileName === patientId);
    if (ticket) {
      ticket.status = 'Đã khám';
      localStorage.setItem('medi_tickets', JSON.stringify(tickets));
    }
  } catch (e) {
    console.error('Error marking complete:', e);
  }

  emit('patient-completed', patientId);
};
```

---

## 5️⃣ ReceptionistInsurance.vue - Create medi_insurance_records

### Add to <script setup>
```javascript
import { ref, computed, onMounted } from 'vue';

const emit = defineEmits(['documents-saved']);

const searchQuery = ref('');
const selectedInsurance = ref(null);
const insuranceRecords = ref([]);

// Form for document submission
const documentForm = ref({
  patientName: '',
  bhytNumber: '',
  bhytType: 'employee',
  expiryDate: '',
  coPayPercentage: 80
});

// ✅ Load insurance records
const loadInsuranceRecords = () => {
  try {
    const raw = localStorage.getItem('medi_insurance_records');
    insuranceRecords.value = raw ? JSON.parse(raw) : [];
  } catch (e) {
    insuranceRecords.value = [];
  }
};

// ✅ Save documents
const saveDocuments = () => {
  if (!documentForm.value.patientName || !documentForm.value.bhytNumber) {
    return; // Show validation error
  }

  const insuranceRecord = {
    id: 'INS_' + Date.now(),
    patientName: documentForm.value.patientName,
    bhytNumber: documentForm.value.bhytNumber,
    bhytType: documentForm.value.bhytType,
    bhytStatus: 'active',
    expiryDate: documentForm.value.expiryDate,
    coPayPercentage: documentForm.value.coPayPercentage,
    documentsVerified: true,
    verifiedAt: new Date().toISOString()
  };

  // Add to records
  insuranceRecords.value.push(insuranceRecord);

  // Save to localStorage
  localStorage.setItem('medi_insurance_records', JSON.stringify(insuranceRecords.value));

  // Reset form
  documentForm.value = {
    patientName: '', bhytNumber: '', bhytType: 'employee', expiryDate: '', coPayPercentage: 80
  };

  emit('documents-saved');
};

const filteredRecords = computed(() => {
  if (!searchQuery.value) return insuranceRecords.value;
  const q = searchQuery.value.toLowerCase();
  return insuranceRecords.value.filter(r =>
    r.patientName.toLowerCase().includes(q) || r.bhytNumber.includes(q)
  );
});

const selectInsurance = (insurance) => {
  selectedInsurance.value = insurance;
};

const searchInsurance = () => {
  // Already handled by computed
};

onMounted(() => {
  loadInsuranceRecords();
});
```

---

## 6️⃣ ReceptionistNotification.vue - Create medi_notifications

### Add to <script setup>
```javascript
import { ref, computed, onMounted } from 'vue';

const emit = defineEmits(['notification-sent', 'template-used']);

const notificationForm = ref({
  type: '',
  patientId: '',
  channel: '',
  content: '',
  sendImmediately: true,
  scheduledTime: ''
});

const notifications = ref([]);

// ✅ Load notifications
const loadNotifications = () => {
  try {
    const raw = localStorage.getItem('medi_notifications');
    notifications.value = raw ? JSON.parse(raw) : [];
  } catch (e) {
    notifications.value = [];
  }
};

// ✅ Send notification
const sendNotification = () => {
  if (!notificationForm.value.type || !notificationForm.value.patientId || !notificationForm.value.channel) {
    return; // Show validation
  }

  const notification = {
    id: 'NOTIF_' + Date.now(),
    type: notificationForm.value.type,
    patientId: notificationForm.value.patientId,
    channel: notificationForm.value.channel,
    content: notificationForm.value.content,
    status: 'sent',
    timestamp: new Date().toISOString(),
    sendImmediately: notificationForm.value.sendImmediately,
    scheduledTime: notificationForm.value.scheduledTime || null
  };

  // Add to list
  notifications.value.push(notification);

  // Save to localStorage
  localStorage.setItem('medi_notifications', JSON.stringify(notifications.value));

  // Reset form
  notificationForm.value = {
    type: '', patientId: '', channel: '', content: '', sendImmediately: true, scheduledTime: ''
  };

  emit('notification-sent');
};

const sentCount = computed(() =>
  notifications.value.filter(n => n.status === 'sent').length
);

const pendingCount = computed(() =>
  notifications.value.filter(n => n.status === 'pending').length
);

const countByChannel = (channel) =>
  notifications.value.filter(n => n.channel === channel && n.status === 'sent').length;

onMounted(() => {
  loadNotifications();
});
```

---

## 7️⃣ Helper Function - getDoctorName()

Add this to any component that needs it:

```javascript
const getDoctorName = (doctorId) => {
  const doctors = {
    'doctor1': 'Bác Sĩ Nguyễn Văn A',
    'doctor2': 'Bác Sĩ Trần Thị B',
    'doctor3': 'Bác Sĩ Lê Văn C'
  };
  return doctors[doctorId] || 'Bác Sĩ Chưa Xác Định';
};
```

---

## 8️⃣ Recommended: Create a composable for localStorage operations

### Create file: `frontend/src/composables/useLocalStorage.js`

```javascript
import { ref, watch } from 'vue';

export const useLocalStorage = (key, defaultValue) => {
  const loadData = () => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved || saved === 'undefined' || saved === 'null') {
        return defaultValue;
      }
      return JSON.parse(saved);
    } catch (e) {
      return defaultValue;
    }
  };

  const data = ref(loadData());

  watch(data, (newValue) => {
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (e) {
      console.error(`Error saving to localStorage[${key}]:`, e);
    }
  }, { deep: true });

  return data;
};
```

### Usage in any component:
```javascript
import { useLocalStorage } from '@/composables/useLocalStorage';

const appointments = useLocalStorage('medi_tickets', []);
const patients = useLocalStorage('medi_profiles', []);
// No need for manual watch() or localStorage.setItem()!
```

---

## ✅ Testing Checklist

After applying fixes, test these scenarios:

- [ ] Create appointment in PatientPortal → Verify in ReceptionistDashboard
- [ ] Confirm arrival in ReceptionistDashboard → Verify localStorage updated
- [ ] Add patient profile in ReceptionistPatientProfile → Verify in medi_profiles
- [ ] Create booking in ReceptionistBooking → Verify in medi_schedules
- [ ] Send notification → Verify in medi_notifications
- [ ] Check insurance → Verify in medi_insurance_records
- [ ] Complete patient check-in → Verify in medi_queue_history
- [ ] Refresh page → Verify all data persists

---

