<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import PatientDoctorChat from '@/components/PatientDoctorChat.vue';
import { useUnreadMessages } from '@/composables/useUnreadMessages.js';

const router = useRouter();

onMounted(() => {
    localStorage.setItem('current_user_id', 'benhnhan');
    
    // Listen to cross-tab updates for real-time sync without F5
    window.addEventListener('storage', (e) => {
        if (e.key === 'medi_tickets' && e.newValue) {
            activeTickets.value = JSON.parse(e.newValue);
        }
    });
    
    // Hero slideshow auto-rotate
    heroTimer = setInterval(() => {
        heroSlideIndex.value = (heroSlideIndex.value + 1) % heroImages.length;
    }, 3000);
});

// Hero slideshow
const heroImages = [
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=2091&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=2128&auto=format&fit=crop'
];
const heroSlideIndex = ref(0);
let heroTimer = null;

onUnmounted(() => {
    if (heroTimer) clearInterval(heroTimer);
});

// Theo dõi tin nhắn chưa đọc
const { totalUnread, resetUnread } = useUnreadMessages('benhnhan');

// ================= THÔNG TIN ĐIỀU HƯỚNG =================
const currentView = ref(localStorage.getItem('medi_patient_view') || 'home');
watch(currentView, (val) => localStorage.setItem('medi_patient_view', val)); 
const searchTab = ref('doctor'); 
const searchTransitionName = ref('slide-left');
const setSearchTab = (tab) => {
    if (tab === searchTab.value) return;
    searchTransitionName.value = tab === 'medicine' ? 'slide-left' : 'slide-right';
    searchTab.value = tab;
};

// ================= HÀM LƯU TRỮ CHỐNG F5 =================
const loadData = (key, defaultData) => {
    try {
        const saved = localStorage.getItem(key);
        if (!saved || saved === 'undefined' || saved === 'null') return defaultData;
        return JSON.parse(saved);
    } catch (e) {
        return defaultData;
    }
};

// ================= THÔNG TIN NGƯỜI DÙNG (HEADER) =================
const defaultUser = { name: 'Lê văn Hoài Rin', dob: '1990-04-15', phone: '0901234567', address: 'Hải Châu, Đà Nẵng' };
const loggedInUser = ref(loadData('medi_user', defaultUser));
watch(loggedInUser, (val) => localStorage.setItem('medi_user', JSON.stringify(val)), { deep: true });

const showUserProfileModal = ref(false);

// ================= TOAST NOTIFICATIONS =================
const toastNotification = ref(null);
const showToast = (type = 'info', title = '', message = '', duration = 3000) => {
    toastNotification.value = { type, title, message, id: Date.now() };
    if (duration > 0) {
        setTimeout(() => {
            toastNotification.value = null;
        }, duration);
    }
};

const saveUserProfile = () => {
    showUserProfileModal.value = false;
    showToast('success', 'Thành công', 'Cập nhật hồ sơ cá nhân thành công!');
    if(profiles.value.length > 0) {
        profiles.value[0].name = loggedInUser.value.name;
        profiles.value[0].phone = loggedInUser.value.phone;
        profiles.value[0].dob = loggedInUser.value.dob;
        profiles.value[0].address = loggedInUser.value.address;
    }
};

const logout = () => {
    try { router.push('/'); } 
    catch (e) { window.location.href = '/'; }
};

// ================= HÀM TIỆN ÍCH NGÀY THÁNG =================
const formatDateToVN = (dateStr) => {
    if(!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

// ================= HÀM CHUYỂN ĐỔI SỐ THỨ TỰ =================
const formatQueueNumber = (num) => {
    if (!num) return [];
    return String(num).split('').map(Number);
};

const getReminderDate = (dateStr) => {
    if(!dateStr) return '';
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1); // Trừ đi 1 ngày
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

// ================= THÔNG BÁO & NHẮC NHỞ =================
const showNotifications = ref(false);
const notifications = ref([
    { id: 1, title: 'Nhắc nhở lịch khám', message: 'Lịch khám của bạn sẽ diễn ra vào 08:30 ngày mai. Vui lòng đến đúng giờ.', time: '10 phút trước', isRead: false },
    { id: 2, title: 'Cập nhật hồ sơ', message: 'Hồ sơ bệnh án điện tử của bạn đã được cập nhật.', time: '2 ngày trước', isRead: true }
]);

const defaultReminders = [
    { id: 1, time: '08:00', task: 'Uống thuốc hạ huyết áp (1 viên)', isDone: false },
    { id: 2, time: '13:00', task: 'Uống Vitamin C bổ sung', isDone: false },
    { id: 3, time: '20:00', task: 'Đo lại huyết áp trước khi ngủ', isDone: false }
];
const healthReminders = ref(loadData('medi_reminders', defaultReminders));
watch(healthReminders, (val) => localStorage.setItem('medi_reminders', JSON.stringify(val)), { deep: true });

// ================= DỮ LIỆU GIẢ LẬP =================
const services = ref([
    { title: 'Phòng khám', desc: 'Đặt khám theo gói dịch vụ chất lượng, dịch vụ xét nghiệm', icon: 'fa-regular fa-hospital', color: 'text-blue-500', bg: 'bg-blue-100' },
    { title: 'Bác sĩ', desc: 'Đặt khám trực tiếp tới đội ngũ bác sĩ có trình độ cao', icon: 'fa-solid fa-user-doctor', color: 'text-indigo-500', bg: 'bg-indigo-100' },
    { title: 'Cẩm Nang', desc: 'Với lượng bài đăng phong phú, chuyên mục Cẩm nang', icon: 'fa-solid fa-book-medical', color: 'text-green-500', bg: 'bg-green-100' },
    { title: 'Cộng Đồng', desc: 'Cộng đồng y tế đông đảo với sự tham gia của các bác sĩ', icon: 'fa-solid fa-users', color: 'text-orange-500', bg: 'bg-orange-100' },
]);

const activeServiceModal = ref(null); 
const handleServiceClick = (title) => {
    if(title === 'Phòng khám') activeServiceModal.value = 'clinic';
    if(title === 'Cộng Đồng') activeServiceModal.value = 'community';
    if(title === 'Bác sĩ') { 
        currentView.value = 'home'; searchTab.value = 'doctor'; 
        window.scrollTo({ top: 500, behavior: 'smooth' }); 
    }
    if(title === 'Cẩm Nang') currentView.value = 'news';
};

const daNangClinics = ref([
    { name: 'Bệnh viện Đà Nẵng', address: '124 Hải Phòng, Thạch Thang, Hải Châu, Đà Nẵng' },
    { name: 'Bệnh viện C Đà Nẵng', address: '122 Hải Phòng, Thạch Thang, Hải Châu, Đà Nẵng' },
    { name: 'Bệnh viện Hoàn Mỹ Đà Nẵng', address: '291 Nguyễn Văn Linh, Thạc Gián, Thanh Khê, Đà Nẵng' },
    { name: 'Phòng khám Đa khoa Tâm Trí', address: '64 Cách Mạng Tháng 8, Khuê Trung, Cẩm Lệ, Đà Nẵng' }
]);

const searchDoctorQuery = ref('');
const doctors = ref([
    { id: 1, name: 'PGS.TS Nguyễn Văn A', spec: 'Khoa Tim mạch', rating: 4.9, reviews: 120, image: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png' },
    { id: 2, name: 'ThS.BS Trần Thị B', spec: 'Khoa Thần kinh', rating: 4.8, reviews: 95, image: 'https://cdn-icons-png.flaticon.com/512/3774/3774221.png' },
    { id: 3, name: 'BS.CKII Lê Văn C', spec: 'Tai Mũi Họng', rating: 4.7, reviews: 88, image: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png' },
    { id: 4, name: 'TS.BS Phạm Quang D', spec: 'Khoa Nhi', rating: 4.9, reviews: 210, image: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png' },
    { id: 5, name: 'BS.CKI Nguyễn Thị E', spec: 'Da liễu', rating: 4.6, reviews: 54, image: 'https://cdn-icons-png.flaticon.com/512/3774/3774221.png' },
    { id: 6, name: 'ThS.BS Hoàng Văn F', spec: 'Tiêu hóa', rating: 4.8, reviews: 130, image: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png' },
    { id: 7, name: 'BS. Võ Thị G', spec: 'Phụ sản', rating: 4.9, reviews: 300, image: 'https://cdn-icons-png.flaticon.com/512/3774/3774221.png' },
    { id: 8, name: 'TS.BS Đặng Văn H', spec: 'Cơ Xương Khớp', rating: 4.7, reviews: 80, image: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png' },
    { id: 9, name: 'BS.CKII Trần Văn I', spec: 'Khoa Mắt', rating: 4.8, reviews: 110, image: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png' },
    { id: 10, name: 'BS. Nguyễn Tấn K', spec: 'Răng Hàm Mặt', rating: 4.6, reviews: 45, image: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png' },
]);

const searchMedicineQuery = ref('');
const medicinePrefixes = ['Para', 'Amo', 'Cefa', 'Ome', 'Pana', 'Decol', 'Alpha', 'Vita', 'Magne', 'Calci'];
const medicineSuffixes = ['cetamol', 'xicillin', 'lexin', 'prazole', 'dol', 'gen', 'choay', 'min C', 'sium', 'um D3'];
const generateMedicines = () => {
    let meds = [];
    let id = 1;
    for(let i = 0; i < 10; i++) {
        for(let j = 0; j < 10; j++) {
            meds.push({
                id: id++,
                name: medicinePrefixes[i] + medicineSuffixes[j] + ` ${Math.floor(Math.random() * 500 + 10)}mg`,
                price: `${(Math.floor(Math.random() * 200) + 10)}.000 VNĐ / Hộp`,
                use: i % 2 === 0 ? 'Giảm đau, hạ sốt' : (i % 3 === 0 ? 'Vitamin bổ sung' : 'Kháng sinh')
            });
        }
    }
    return meds;
};
const medicines = ref(generateMedicines());

const filteredDoctors = computed(() => {
    if (!searchDoctorQuery.value) return doctors.value;
    const q = searchDoctorQuery.value.toLowerCase();
    return doctors.value.filter(d => d.name.toLowerCase().includes(q) || d.spec.toLowerCase().includes(q));
});

const filteredMedicines = computed(() => {
    if (!searchMedicineQuery.value) return medicines.value;
    const q = searchMedicineQuery.value.toLowerCase();
    return medicines.value.filter(m => m.name.toLowerCase().includes(q));
});

const newsList = ref([
    { id: 1, title: 'Cảnh báo dịch sốt xuất huyết gia tăng trong mùa mưa', date: '15/04/2026', image: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=500&h=300&fit=crop' },
    { id: 2, title: 'Phòng khám tích hợp công nghệ AI vào quy trình chẩn đoán', date: '12/04/2026', image: 'https://images.unsplash.com/photo-1576091160550-2173ff9e5eb2?w=500&h=300&fit=crop' },
    { id: 3, title: 'Những thực phẩm nên ăn để tăng sức đề kháng', date: '10/04/2026', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&h=300&fit=crop' },
    { id: 4, title: 'Lịch nghỉ lễ Giỗ tổ Hùng Vương của Trung tâm Y tế', date: '05/04/2026', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=500&h=300&fit=crop' }
]);

// ================= DỮ LIỆU HỒ SƠ & LỊCH HẸN =================
const defaultProfiles = [
    { id: 'HS01', name: loggedInUser.value.name, phone: loggedInUser.value.phone, dob: '15/04/1990', address: loggedInUser.value.address, bhyt: 'DN40123456789', hasActiveTicket: false },
    { id: 'HS02', name: 'Nguyễn Thị Quỳnh Như', phone: '0909876543', dob: '20/10/1965', address: 'Liên Chiểu, Đà Nẵng', bhyt: '', hasActiveTicket: false }
];
const profiles = ref(loadData('medi_profiles', defaultProfiles));
watch(profiles, (val) => localStorage.setItem('medi_profiles', JSON.stringify(val)), { deep: true });

const defaultTickets = [
    { 
        id: 'PK_OLD_001', profileId: 'HS01', profileName: loggedInUser.value.name, profileAddress: loggedInUser.value.address, profilePhone: loggedInUser.value.phone, 
        dateRaw: '2026-04-10', date: '10/04/2026', time: '08:30 - 09:00', dept: 'Nội tổng quát', queueNumber: 12, status: 'Đã khám',
        paymentStatus: 'paid', amount: 150000, transactionId: 'VNPay_19283'
    }
];
const activeTickets = ref(loadData('medi_tickets', defaultTickets));
watch(activeTickets, (val) => {
  localStorage.setItem('medi_tickets', JSON.stringify(val));
  // Trigger custom event for real-time update
  window.dispatchEvent(new CustomEvent('mediTicketsUpdated', { detail: val }));
}, { deep: true });

const globalQueueCounter = ref(Number(loadData('medi_qcounter', 1)));
watch(globalQueueCounter, (val) => localStorage.setItem('medi_qcounter', val.toString()));

// ================= ĐÁNH GIÁ & PHẢN HỒI =================
const isRatingModalOpen = ref(false);
const currentRatingData = ref({ ticketId: null, doctorName: '', stars: 5, comment: '' });

const openRatingModal = (ticket) => {
    currentRatingData.value = { ticketId: ticket.id, doctorName: ticket.dept, stars: 5, comment: '' };
    isRatingModalOpen.value = true;
};

const submitRating = () => {
    if(currentRatingData.value.stars === 0) {
        showToast('warning', 'Cảnh báo', 'Vui lòng chọn số sao đánh giá!');
        return;
    }
    const ticketIndex = activeTickets.value.findIndex(t => t.id === currentRatingData.value.ticketId);
    if(ticketIndex !== -1) {
        activeTickets.value[ticketIndex].status = 'Đã đánh giá';
    }
    showToast('success', 'Cảm ơn', 'Phản hồi của bạn giúp chúng tôi cải thiện dịch vụ tốt hơn!');
    isRatingModalOpen.value = false;
};

// ================= BỆNH ÁN ĐIỆN TỬ =================
const showEMRModal = ref(false);
const activeEMR = ref({
    date: '10/01/2026', dept: 'Nội tổng quát', doctor: 'PGS.TS Nguyễn Văn A', 
    diagnosis: 'Viêm họng cấp tính, theo dõi sốt siêu vi.',
    prescription: '1. Paracetamol 500mg x 10 viên (Ngày 2 viên sáng tối)\n2. Oresol x 5 gói (Pha nước uống)'
});
const openEMR = () => { showEMRModal.value = true; };

// ================= QUY TRÌNH ĐẶT LỊCH =================
const bookingTab = ref('tickets'); 
const isBookingModalOpen = ref(false);
const bookingStep = ref(1); 
const selectedProfileId = ref(null);
const newBooking = ref({ hospital: 'Trung tâm y tế Đồ Án', dept: '', date: '', time: '', doctorId: '' });

// Quản lý biên lai và thanh toán
const currentCheckoutTicket = ref(null);
const showReceiptModal = ref(false);
const receiptTicket = ref(null);

const getDoctorName = (doctorId) => {
  const doctors = {
    'doctor1': 'Bác Sĩ Nguyễn Văn A',
    'doctor2': 'Bác Sĩ Trần Thị B',
    'doctor3': 'Bác Sĩ Lê Văn C'
  };
  return doctors[doctorId] || 'Chưa xác định';
};

const hasActiveTicket = (profileId) => {
  return activeTickets.value.some(t => 
    t.profileId === profileId && 
    (t.status === 'Chờ duyệt' || t.status === 'Chờ khám' || t.status === 'Đang khám')
  );
};

const startBooking = () => {
    isBookingModalOpen.value = true;
    bookingStep.value = 1;
    selectedProfileId.value = null;
    newBooking.value = { hospital: 'Trung tâm y tế Đồ Án', dept: '', date: '', time: '' };
};

const rescheduleAppointment = (ticket) => {
    // Cho phép tái đặt lịch khám cho hồ sơ đã khám xong
    const profile = profiles.value.find(p => p.id === ticket.profileId);
    if (profile) {
        profile.hasActiveTicket = false; 
    }
    isBookingModalOpen.value = true;
    bookingStep.value = 1;
    selectedProfileId.value = ticket.profileId;
    newBooking.value = { hospital: 'Trung tâm y tế Đồ Án', dept: '', date: '', time: '' };
};

const nextBookingStep = () => {
    if (bookingStep.value === 1 && !selectedProfileId.value) {
        showToast('warning', 'Thông báo', 'Vui lòng chọn 1 hồ sơ!');
        return;
    }
    if (bookingStep.value === 2 && (!newBooking.value.dept || !newBooking.value.date || !newBooking.value.time || !newBooking.value.doctorId)) {
        showToast('warning', 'Thông báo', 'Vui lòng chọn đầy đủ chuyên khoa, bác sĩ, ngày và giờ khám!');
        return;
    }
    bookingStep.value++;
};

const submitBooking = () => {
    const profile = profiles.value.find(p => p.id === selectedProfileId.value);
    
    // Chỉ không cho phép đặt lịch nếu đang khám (status = 'Chờ duyệt' hoặc 'Chờ khám')
    const hasActiveTicket = activeTickets.value.some(t => 
        t.profileId === profile.id && 
        (t.status === 'Chờ duyệt' || t.status === 'Chờ khám' || t.status === 'Đang khám')
    );
    
    if (hasActiveTicket) {
        showToast('error', 'Lỗi', 'Hồ sơ này đã có lịch hẹn chưa khám. Vui lòng khám xong mới đặt tiếp!');
        return;
    }

    const qNumber = globalQueueCounter.value++; 

    const newTicket = {
        id: 'PK_NEW_' + Math.floor(Math.random() * 1000),
        patientName: profile.name,
        phone: profile.profilePhone,
        profileId: profile.id,
        profileName: profile.name,
        profileAddress: profile.address, 
        profilePhone: profile.phone,
        dateRaw: newBooking.value.date,     
        date: formatDateToVN(newBooking.value.date),
        appointmentTime: newBooking.value.time,
        time: newBooking.value.time,
        dept: newBooking.value.dept,
        doctorId: newBooking.value.doctorId,
        doctorName: getDoctorName(newBooking.value.doctorId),
        queueNumber: qNumber,
        status: 'Chờ duyệt',
        paymentStatus: 'unpaid',
        price: 200000,
        amount: 200000
    };

    activeTickets.value.push(newTicket);
    
    // LƯU VÀO LOCALSTORAGE medi_tickets (cho lễ tân thấy)
    const medi_tickets = JSON.parse(localStorage.getItem('medi_tickets') || '[]');
    medi_tickets.push(newTicket);
    localStorage.setItem('medi_tickets', JSON.stringify(medi_tickets));
    
    // Trigger custom event for real-time update in same tab
    window.dispatchEvent(new CustomEvent('mediTicketsUpdated', { detail: medi_tickets }));
    
    currentCheckoutTicket.value = newTicket;
    
    // Chuyển sang Bước 4 (Hóa đơn - Chọn thanh toán)
    bookingStep.value = 4; 
};

// Khách hàng bấm thanh toán sau
const payLater = () => {
    isBookingModalOpen.value = false;
    bookingTab.value = 'tickets';
};

// ================= LOGIC QUÉT MÃ QR =================
const showQRModal = ref(false);
const ticketBeingPaid = ref(null);
const isConfirmingPayment = ref(false);

const handlePayment = (ticket) => {
    // Thay vì chạy api luôn, giờ ta lưu ticket lại và mở popup mã QR
    ticketBeingPaid.value = ticket;
    showQRModal.value = true;
};

const confirmQRPayment = async () => {
    const ticket = ticketBeingPaid.value;
    if (!ticket) return;

    isConfirmingPayment.value = true;
    ticket.paymentStatus = 'processing';
    
    try {
        const response = await fetch('http://127.0.0.1:8000/api/payment/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                patient_id: ticket.profileName, 
                amount: ticket.amount, 
                status: 'paid' 
            })
        });
        
        const data = await response.json();
        
        setTimeout(() => {
            if (data.status === 'success') {
                ticket.paymentStatus = 'paid';
                ticket.transactionId = data.transaction_id || 'VNPay_' + Math.floor(Math.random() * 99999);
                
                // UPDATE medi_tickets localStorage
                const medi_tickets = JSON.parse(localStorage.getItem('medi_tickets') || '[]');
                const ticketIndex = medi_tickets.findIndex(t => t.id === ticket.id);
                if (ticketIndex !== -1) {
                    medi_tickets[ticketIndex] = ticket;
                    localStorage.setItem('medi_tickets', JSON.stringify(medi_tickets));
                    // Trigger custom event for real-time update
                    window.dispatchEvent(new CustomEvent('mediTicketsUpdated', { detail: medi_tickets }));
                }
                
                showQRModal.value = false; // Đóng popup QR
                
                // Nếu đang ở trong luồng đặt lịch, tự động nhảy sang bước 5 (Biên lai)
                if (isBookingModalOpen.value && bookingStep.value === 4) {
                    bookingStep.value = 5;
                }
            } else {
                ticket.paymentStatus = 'unpaid';
                showToast('error', 'Thanh toán thất bại', data.message);
            }
            isConfirmingPayment.value = false;
        }, 1500);

    } catch (error) {
        // Fallback demo khi chạy ko cần backend
        setTimeout(() => { 
            ticket.paymentStatus = 'paid'; 
            ticket.transactionId = 'DEMO_PAY_' + Math.floor(Math.random() * 99999);
            
            // UPDATE medi_tickets localStorage
            const medi_tickets = JSON.parse(localStorage.getItem('medi_tickets') || '[]');
            const ticketIndex = medi_tickets.findIndex(t => t.id === ticket.id);
            if (ticketIndex !== -1) {
                medi_tickets[ticketIndex] = ticket;
                localStorage.setItem('medi_tickets', JSON.stringify(medi_tickets));
                // Trigger custom event for real-time update
                window.dispatchEvent(new CustomEvent('mediTicketsUpdated', { detail: medi_tickets }));
            }
            
            showQRModal.value = false;
            
            if (isBookingModalOpen.value && bookingStep.value === 4) {
                bookingStep.value = 5;
            }
            isConfirmingPayment.value = false;
        }, 1500);
    }
};

// ================= HỒ SƠ & HỦY PHIẾU =================
const openReceipt = (ticket) => {
    receiptTicket.value = ticket;
    showReceiptModal.value = true;
};

const cancelTicket = (ticketId) => {
    if(confirm('Bạn có chắc chắn muốn hủy phiếu đặt khám này không?')) {
        const ticket = activeTickets.value.find(t => t.id === ticketId);
        if(ticket) {
            const profile = profiles.value.find(p => p.id === ticket.profileId);
            if(profile) profile.hasActiveTicket = false; 
            activeTickets.value = activeTickets.value.filter(t => t.id !== ticketId); 
            showToast('success', 'Thành công', 'Đã hủy phiếu khám thành công!');
        }
    }
};

const isProfileModalOpen = ref(false);
const profileFormTab = ref('patient'); 
const isEditing = ref(false);
const currentProfileForm = ref({ id: '', name: '', phone: '', dob: '', address: '', bhyt: '' });

const openCreateProfile = () => {
    isEditing.value = false;
    currentProfileForm.value = { id: '', name: '', phone: '', dob: '', address: '', bhyt: '' };
    isProfileModalOpen.value = true;
};

const openEditProfile = (profile) => {
    isEditing.value = true;
    currentProfileForm.value = { ...profile };
    isProfileModalOpen.value = true;
};

const saveProfile = () => {
    if(!currentProfileForm.value.name || !currentProfileForm.value.phone) {
        showToast('warning', 'Thông báo', 'Vui lòng nhập Tên và Số điện thoại!');
        return;
    }
    
    if (isEditing.value) {
        // Cập nhật hồ sơ hiện có
        const index = profiles.value.findIndex(p => p.id === currentProfileForm.value.id);
        if (index !== -1) {
            profiles.value[index] = {
                id: currentProfileForm.value.id,
                name: currentProfileForm.value.name,
                phone: currentProfileForm.value.phone,
                dob: currentProfileForm.value.dob,
                address: currentProfileForm.value.address,
                bhyt: currentProfileForm.value.bhyt,
                hasActiveTicket: profiles.value[index].hasActiveTicket // Giữ lại trạng thái lịch hẹn
            };
            showToast('success', 'Thành công', 'Cập nhật hồ sơ thành công!');
        }
    } else {
        // Tạo hồ sơ mới
        const newId = 'HS' + String(profiles.value.length + 1).padStart(2, '0');
        profiles.value.push({
            id: newId,
            name: currentProfileForm.value.name,
            phone: currentProfileForm.value.phone,
            dob: currentProfileForm.value.dob,
            address: currentProfileForm.value.address,
            bhyt: currentProfileForm.value.bhyt,
            hasActiveTicket: false
        });
        showToast('success', 'Thành công', 'Tạo hồ sơ mới thành công!');
    }
    
    // Reset form và đóng modal
    currentProfileForm.value = { id: '', name: '', phone: '', dob: '', address: '', bhyt: '' };
    isProfileModalOpen.value = false;
};

// ================= CHATBOT AI =================
const isChatOpen = ref(false);
const chatInput = ref('');

const defaultChat = [
    { sender: 'bot', text: 'Xin chào! Mình là Trợ lý AI. Mình có thể giúp gì cho bạn hôm nay?', options: ['Đặt lịch khám', 'Xem lịch hẹn', 'Hỏi đáp sức khỏe'] }
];

const savedChat = loadData('medi_chat', defaultChat).map(msg => {
    if (msg.fullText) msg.text = msg.fullText; // Restore any interrupted typing
    return msg;
});
const chatMessages = ref(savedChat);
watch(chatMessages, (val) => localStorage.setItem('medi_chat', JSON.stringify(val)), { deep: true });

const isBotTyping = ref(false);
const chatBodyRef = ref(null);

const scrollChatToBottom = async () => {
    await nextTick();
    if(chatBodyRef.value) chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight;
};

const handleChatOption = (option, index) => {
    if (index !== undefined && chatMessages.value[index]) {
        chatMessages.value[index].options = null; // Hide options after click
    }
    sendChatMessage(option, true);
};

const botState = ref('idle');
const chatBookingTemp = ref({});

const sendChatMessage = (text, isUser = true, options = null) => {
    if(!text.trim()) return;
    if(isUser) {
        chatMessages.value.push({ sender: 'user', text });
        chatInput.value = '';
        scrollChatToBottom();
        processBotLogic(text);
    } else {
        isBotTyping.value = false; // Hide typing indicator
        const words = text.split(/(?<=\s)/);
        const msgIndex = chatMessages.value.length;
        const rawMsg = { sender: 'bot', text: '', fullText: text, options: null, isTyping: true };
        chatMessages.value.push(rawMsg);
        scrollChatToBottom();
        
        let wordIdx = 0;
        const typeInterval = setInterval(() => {
            if (wordIdx < words.length) {
                chatMessages.value[msgIndex].text += words[wordIdx];
                wordIdx++;
                scrollChatToBottom();
            } else {
                clearInterval(typeInterval);
                chatMessages.value[msgIndex].isTyping = false;
                chatMessages.value[msgIndex].options = options;
                scrollChatToBottom();
            }
        }, 80);
    }
};

const processBotLogic = async (input) => {
    const text = input.trim();
    const removeDiacritics = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
    const lowerInput = removeDiacritics(text);
    const healthTopics = [
        { keys: ['sot','giam sot','nhiet do','ha sot'], answer_vi: '🌡️ **Cách xử lý khi bị sốt:**\n• Uống nhiều nước, chườm khăn ấm.\n• Nếu sốt > 38.5°C: dùng Paracetamol.\n• ⚠️ Sốt > 3 ngày → đến bệnh viện ngay!', options: ['Đau dạ dày','Cúm / Hô hấp','Đặt lịch khám','Trở về Menu'] },
        { keys: ['da day','bung','tieu hoa','buon non','o chua','day hoi'], answer_vi: '🫁 **Đau dạ dày & Tiêu hoá:**\n• Đau thượng vị, ợ hơi, ợ chua, chướng bụng.\n• Ăn đúng giờ, hạn chế đồ cay chua, tránh căng thẳng.\n• ⚠️ Đau dữ dội, nôn ra máu → cấp cứu ngay!', options: ['Sốt / Hạ nhiệt','Cúm / Hô hấp','Đặt lịch khám','Trở về Menu'] },
        { keys: ['cum','ho','viem hong','ho hap','khan tieng'], answer_vi: '😷 **Phòng ngừa cúm & Ho hấp:**\n• Rửa tay thường xuyên, đeo khẩu trang.\n• Uống nước ấm + mật ong + gừng.\n• 💉 Tiêm vắc xin phòng cúm mỗi năm!', options: ['Sốt / Hạ nhiệt','Đau dạ dày','Đặt lịch khám','Trở về Menu'] },
        { keys: ['huyet ap','cao huyet','tim mach','tim'], answer_vi: '❤️ **Huyết áp & Tim mạch:**\n• Bình thường: 90/60 – 120/80 mmHg.\n• Phòng ngừa: ăn nhạt, tập thể dục ≥ 30 phút/ngày, kiểm tra định kỳ.', options: ['Tiểu đường','Đặt lịch khám','Trở về Menu'] },
        { keys: ['tieu duong','duong huyet','insulin'], answer_vi: '🍬 **Tiểu đường:**\n• Triệu chứng: khát nước, tiểu nhiều, mờ mắt.\n• Ăn ít đường, rau xanh nhiều, tập đều đặn.', options: ['Huyết áp','Đặt lịch khám','Trở về Menu'] },
        { keys: ['dau dau','nua dau','migraine'], answer_vi: '🤕 **Đau đầu / Migraine:**\n• Thường do căng thẳng, mất ngủ, mất nước.\n• Nghỉ ngơi nơi yên tĩnh, uống đủ nước ≥ 2L/ngày.', options: ['Mất ngủ / Stress','Đặt lịch khám','Trở về Menu'] },
        { keys: ['mat ngu','ngu khong ngon','stress','lo au','cang thang','met moi'], answer_vi: '😴 **Mất ngủ & Sức khoẻ tâm lý:**\n• Ngủ đúng giờ, 7–9 tiếng/đêm.\n• Hạn chế điện thoại trước ngủ, thiền định 10 phút.\n• ⚠️ Buồn kéo dài → gặp chuyên gia tâm lý!', options: ['Đau đầu','Đặt lịch khám','Trở về Menu'] },
    ];
    const healthMenuOpts = ['Sốt / Hạ nhiệt','Đau dạ dày / Tiêu hoá','Cúm / Hô hấp','Huyết áp / Tim mạch','Tiểu đường','Đau đầu / Migraine','Mất ngủ / Stress','Đặt lịch khám','Trở về Menu'];
    const findH = (q) => healthTopics.find(t => t.keys.some(k => new RegExp(`\\b${k}\\b`).test(q)));
    
    if (lowerInput.includes('tro ve menu') || lowerInput === 'menu') {
        botState.value = 'idle';
        sendChatMessage('Mình đã trở về Menu chính. Bạn cần giúp gì?', false, ['Đặt lịch khám', 'Xem lịch hẹn', 'Hỏi đáp sức khỏe']);
        return;
    }

    const hm = findH(lowerInput);
    if (hm && (botState.value === 'idle' || botState.value === 'health_qa') && !lowerInput.includes('dat lich') && !lowerInput.includes('lich hen')) {
        isBotTyping.value = true;
        setTimeout(() => { sendChatMessage(hm.answer_vi, false, hm.options); botState.value = 'idle'; }, 700);
        return;
    }
    
    if (botState.value === 'idle') {
        if (lowerInput.includes('den trang dat lich')) {
            sendChatMessage('Hệ thống đang chuyển bạn đến trang Đặt lịch & Hồ sơ...', false);
            currentView.value = 'booking'; bookingTab.value = 'tickets';
        } else if (lowerInput.includes('dat lich kham') || lowerInput.includes('dat lich')) {
            botState.value = 'booking_profile';
            sendChatMessage('Bạn muốn đặt lịch khám cho hồ sơ nào?', false, profiles.value.map(p => p.name));
        } else if (lowerInput.includes('xem lich hen') || lowerInput.includes('lich hen')) {
            botState.value = 'view_tickets_choice';
            sendChatMessage('Bạn muốn xem lịch hẹn ở đây hay trang Quản lý?', false, ['Xem trong Trợ lý', 'Đến trang đặt lịch & hồ sơ', 'Trở về Menu']);
        } else if (lowerInput.includes('hoi dap') || lowerInput.includes('suc khoe') || lowerInput.includes('trieu chung') || lowerInput.includes('benh') || lowerInput.includes('thuoc')) {
            botState.value = 'health_qa';
            sendChatMessage('Bạn đang quan tâm chủ đề nào? Nhập câu hỏi hoặc chọn bên dưới 👇', false, healthMenuOpts);
        } else {
            sendChatMessage('Mình có thể giúp bạn với:', false, ['Đặt lịch khám', 'Xem lịch hẹn', 'Hỏi đáp sức khỏe']);
        }
    }
    else if (botState.value === 'health_qa') {
        sendChatMessage('Mình chưa tìm thấy thông tin. Hãy thử chọn hoặc nhập từ khoá khác:', false, healthMenuOpts);
        botState.value = 'idle';
    }
        else if (botState.value === 'view_tickets_choice') {
            if (lowerInput.includes('xem trong tro ly')) {
                if (activeTickets.value.length === 0) {
                    sendChatMessage('Bạn hiện chưa có lịch hẹn nào sắp tới.', false, ['Đặt lịch khám', 'Hỏi đáp sức khỏe', 'Trở về Menu']);
                } else {
                    let msg = '**Danh sách lịch hẹn của bạn:**<br><br>';
                    activeTickets.value.forEach((t, i) => {
                        msg += `**${i+1}. Bệnh nhân: ${t.profileName || t.patientName || 'Không rõ'}**<br>- Bác sĩ: ${t.doctorName} (${t.dept || 'Chưa rõ khoa'})<br>- Thời gian: ${t.time || t.appointmentTime || ''} | ${t.date || ''}<br>- Trạng thái: ${t.status}<br><br>`;
                    });
                    msg += '*Bạn có thể chuyển sang trang Đặt lịch & Hồ sơ để xem chi tiết và thanh toán.*';
                    sendChatMessage(msg, false, ['Đến trang đặt lịch & hồ sơ', 'Đặt lịch khám', 'Trở về Menu']);
                }
                botState.value = 'idle';
            } else if (lowerInput.includes('den trang dat lich')) {
                sendChatMessage('Hệ thống đang chuyển bạn đến trang Đặt lịch & Hồ sơ...', false, ['Trở về Menu']);
                currentView.value = 'booking';
                bookingTab.value = 'tickets';
                botState.value = 'idle';
            } else {
                sendChatMessage('Vui lòng chọn cách xem lịch hẹn:', false, ['Xem trong Trợ lý', 'Đến trang đặt lịch & hồ sơ', 'Trở về Menu']);
            }
        }
        else if (botState.value === 'booking_profile') {
            const profile = profiles.value.find(p => removeDiacritics(p.name) === lowerInput);
            if (profile) {
                chatBookingTemp.value.profileId = profile.id;
                chatBookingTemp.value.profileName = profile.name;
                botState.value = 'booking_dept';
                sendChatMessage(`Đã chọn hồ sơ **${profile.name}**.\n\nBạn muốn khám chuyên khoa nào?`, false, ['Khoa Tim mạch', 'Khoa Thần kinh', 'Tai Mũi Họng', 'Khoa Nhi', 'Nội tổng quát']);
            } else {
                sendChatMessage('Không tìm thấy hồ sơ này. Vui lòng chọn lại:', false, profiles.value.map(p => p.name));
            }
        }
        else if (botState.value === 'booking_dept') {
            chatBookingTemp.value.dept = text; 
            botState.value = 'booking_doctor';
            sendChatMessage(`Đã chọn **${text}**.\n\nVui lòng chọn Bác sĩ:`, false, ['Bác Sĩ Nguyễn Văn A', 'Bác Sĩ Trần Thị B', 'Bác Sĩ Lê Văn C']);
        }
        else if (botState.value === 'booking_doctor') {
            const doctorMap = {
                'bac si nguyen van a': 'doctor1',
                'bac si tran thi b': 'doctor2',
                'bac si le van c': 'doctor3'
            };
            const docId = doctorMap[lowerInput] || 'doctor1';
            chatBookingTemp.value.doctorId = docId;
            chatBookingTemp.value.doctorName = text;
            
            botState.value = 'booking_date';
            
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const formatDate = (d) => {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            };
            
            chatBookingTemp.value._tomorrowStr = formatDate(tomorrow);
            chatBookingTemp.value._todayStr = formatDate(today);
            
            sendChatMessage(`Đã chọn **${text}**.\n\nVui lòng chọn Ngày khám:`, false, [chatBookingTemp.value._todayStr, chatBookingTemp.value._tomorrowStr]);
        }
        else if (botState.value === 'booking_date') {
            chatBookingTemp.value.date = text;
            botState.value = 'booking_time';
            sendChatMessage(`Đã chọn ngày **${text}**.\n\nVui lòng chọn Giờ khám:`, false, ['08:00 - 09:00', '09:00 - 10:00', '14:00 - 15:00']);
        }
        else if (botState.value === 'booking_time') {
            chatBookingTemp.value.time = text;
            
            const profile = profiles.value.find(p => p.id === chatBookingTemp.value.profileId);
            const qNumber = globalQueueCounter.value++; 
            
            const newTicket = {
                id: 'PK_NEW_' + Math.floor(Math.random() * 1000),
                patientName: profile.name,
                phone: profile.phone,
                profileId: profile.id,
                profileName: profile.name,
                profileAddress: profile.address, 
                profilePhone: profile.phone,
                dateRaw: chatBookingTemp.value.date,     
                date: formatDateToVN(chatBookingTemp.value.date),
                appointmentTime: chatBookingTemp.value.time,
                time: chatBookingTemp.value.time,
                dept: chatBookingTemp.value.dept,
                doctorId: chatBookingTemp.value.doctorId,
                doctorName: chatBookingTemp.value.doctorName,
                queueNumber: qNumber,
                status: 'Chờ duyệt',
                paymentStatus: 'unpaid',
                price: 200000,
                amount: 200000
            };

            activeTickets.value.push(newTicket);
            
            const medi_tickets = JSON.parse(localStorage.getItem('medi_tickets') || '[]');
            medi_tickets.push(newTicket);
            localStorage.setItem('medi_tickets', JSON.stringify(medi_tickets));
            window.dispatchEvent(new CustomEvent('mediTicketsUpdated', { detail: medi_tickets }));
            
            sendChatMessage(`🎉 **ĐẶT LỊCH THÀNH CÔNG!**\n\nMã phiếu: ${newTicket.id}\nBệnh nhân: ${newTicket.profileName}\nChuyên khoa: ${newTicket.dept}\nBác sĩ: ${newTicket.doctorName}\nThời gian: ${newTicket.time} | ${newTicket.date}\n\nBạn có thể vào mục "Xem lịch hẹn" để thanh toán nhé!`, false, ['Xem lịch hẹn', 'Đặt lịch khám', 'Hỏi đáp sức khỏe']);
            
            botState.value = 'idle';
            chatBookingTemp.value = {};
        }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans text-slate-800 relative flex flex-col transition-colors duration-500">
    <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200 mix-blend-multiply filter blur-[100px] opacity-50 animate-blob"></div>
        <div class="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200 mix-blend-multiply filter blur-[100px] opacity-50 animate-blob animation-delay-2000"></div>
        <div class="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] rounded-full bg-cyan-200 mix-blend-multiply filter blur-[100px] opacity-50 animate-blob animation-delay-4000"></div>
    </div>

    <header class="relative z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm sticky top-0 transition-all duration-300">
      <div class="max-w-[1400px] mx-auto px-4 flex justify-between items-center h-20">
        <div class="flex items-center space-x-3 group cursor-pointer">
            <div class="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 transform group-hover:scale-105">
                <i class="fa-solid fa-briefcase-medical text-xl"></i>
            </div>
            <div>
                <span class="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 tracking-wider">Y TẾ</span>
                <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">MediSmart Patient</p>
            </div>
        </div>
        
        <nav class="hidden md:flex space-x-1 font-bold text-slate-500">
          <a @click="currentView = 'home'" :class="['cursor-pointer px-5 py-2.5 rounded-xl transition-all duration-300', currentView === 'home' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 hover:text-slate-800']">Trang chủ</a>
          <a @click="currentView = 'booking'" :class="['cursor-pointer px-5 py-2.5 rounded-xl transition-all duration-300', currentView === 'booking' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 hover:text-slate-800']">Đặt lịch & Hồ sơ</a>
          <a @click="currentView = 'news'" :class="['cursor-pointer px-5 py-2.5 rounded-xl transition-all duration-300', currentView === 'news' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 hover:text-slate-800']">Tin tức</a>
          <a @click="currentView = 'chat'; resetUnread()" :class="['cursor-pointer px-5 py-2.5 rounded-xl transition-all duration-300 relative', currentView === 'chat' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 hover:text-slate-800']"><i class="fa-regular fa-comment-dots mr-1"></i> Tin nhắn
            <span v-if="totalUnread > 0" class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">{{ totalUnread }}</span>
          </a>
        </nav>

        <div class="flex items-center space-x-4">
          <div class="relative">
              <button @click="showNotifications = !showNotifications" class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 text-slate-500 hover:bg-slate-100 hover:text-blue-600">
                  <i class="fa-solid fa-bell text-xl"></i>
              </button>
              <span class="absolute top-0 right-0 bg-red-500 w-3.5 h-3.5 rounded-full border-2 border-white animate-pulse"></span>
              
              <div v-if="showNotifications" class="absolute right-0 mt-3 w-80 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50">
                  <div class="p-4 border-b border-slate-100/50 font-extrabold text-slate-800 flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><i class="fa-solid fa-bell"></i></div>
                      Thông báo của bạn
                  </div>
                  <div class="max-h-64 overflow-y-auto custom-scrollbar">
                      <div v-for="notif in notifications" :key="notif.id" :class="['p-4 border-b border-slate-50 transition-colors hover:bg-slate-50 cursor-pointer', !notif.isRead ? 'bg-blue-50/50' : '']">
                          <p class="font-bold text-sm text-slate-800">{{ notif.title }}</p>
                          <p class="text-xs text-slate-500 mt-1">{{ notif.message }}</p>
                          <p class="text-[10px] text-slate-400 mt-2 font-medium"><i class="fa-regular fa-clock mr-1"></i> {{ notif.time }}</p>
                      </div>
                  </div>
              </div>
          </div>

          <div @click="showUserProfileModal = true" class="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all group">
              <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">{{ loggedInUser.name.charAt(0) }}</div>
              <div class="hidden md:block">
                  <p class="text-xs text-slate-400 font-bold uppercase">Bệnh nhân</p>
                  <p class="text-sm font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">{{ loggedInUser.name }}</p>
              </div>
          </div>
          <button @click="logout" class="w-10 h-10 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-sm hover:shadow-red-500/30">
            <i class="fa-solid fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-hidden relative">
        <Transition name="fade" mode="out-in">
            <div v-if="currentView === 'home'" key="home" class="animate-fade-in-up">
                <div class="relative h-[600px] bg-slate-900 flex items-center justify-center overflow-hidden rounded-b-[3rem] shadow-2xl">
                    <Transition name="hero-fade" mode="out-in">
                        <img :key="heroSlideIndex" :src="heroImages[heroSlideIndex]" class="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" />
                    </Transition>
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                    
                    <div class="relative z-10 w-full max-w-[1000px] px-6 text-center mt-10">
                        <div class="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold mb-6 tracking-wide shadow-lg">Hệ Thống Y Tế Thế Hệ Mới</div>
                        <h1 class="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-cyan-200 mb-6 drop-shadow-2xl leading-tight">Chăm Sóc Sức Khỏe <br/> <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Thông Minh & Tận Tâm</span></h1>
                        <p class="text-xl text-blue-50/80 mb-14 font-medium max-w-2xl mx-auto">Trải nghiệm dịch vụ đặt lịch khám bệnh trực tuyến nhanh chóng, tiện lợi với sự hỗ trợ của trí tuệ nhân tạo AI.</p>

                        <div class="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden text-left max-w-3xl mx-auto transform hover:scale-[1.02] transition-all duration-300">
                            <div class="flex border-b border-white/10">
                                <button @click="setSearchTab('doctor')" :class="{'bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-extrabold shadow-lg': searchTab === 'doctor', 'bg-transparent text-white/70 hover:bg-white/5 hover:text-white font-bold': searchTab !== 'doctor'}" class="flex-1 py-4 text-center transition-all text-lg">
                                    <i class="fa-solid fa-user-doctor mr-2"></i> TÌM KIẾM BÁC SĨ
                                </button>
                                <button @click="setSearchTab('medicine')" :class="{'bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-extrabold shadow-lg': searchTab === 'medicine', 'bg-transparent text-white/70 hover:bg-white/5 hover:text-white font-bold': searchTab !== 'medicine'}" class="flex-1 py-4 text-center transition-all text-lg">
                                    <i class="fa-solid fa-pills mr-2"></i> TRA CỨU GIÁ THUỐC
                                </button>
                            </div>
                            
                            <div class="p-8 flex flex-col md:flex-row items-end gap-4 overflow-hidden">
                                <Transition :name="searchTransitionName" mode="out-in">
                                <div class="flex-1 w-full" v-if="searchTab === 'doctor'" key="doc">
                                    <label class="block text-white/80 text-sm font-bold mb-2">Bạn cần tìm gì?</label>
                                    <div class="relative">
                                        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                                        <input v-model="searchDoctorQuery" type="text" placeholder="Tên bác sĩ, phòng khám, chuyên khoa..." class="w-full bg-white/90 border-0 p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-blue-500/30 text-slate-800 font-medium placeholder-slate-400 shadow-inner transition-all">
                                    </div>
                                </div>
                                <div class="flex-1 w-full" v-else-if="searchTab === 'medicine'" key="med">
                                    <label class="block text-white/80 text-sm font-bold mb-2">Nhập tên thuốc</label>
                                    <div class="relative">
                                        <i class="fa-solid fa-capsules absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                                        <input v-model="searchMedicineQuery" type="text" placeholder="Ví dụ: Paracetamol, Vitamin C..." class="w-full bg-white/90 border-0 p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-blue-500/30 text-slate-800 font-medium placeholder-slate-400 shadow-inner transition-all">
                                    </div>
                                </div>
                                </Transition>
                                <button class="w-full md:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-black py-4 px-10 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 transform hover:-translate-y-1 flex items-center justify-center gap-2">
                                    Tìm kiếm <i class="fa-solid fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            <div class="max-w-[1400px] mx-auto px-6 py-24">
                <div class="text-center mb-16">
                    <h2 class="text-4xl font-black text-slate-800 mb-4 tracking-tight">Dịch vụ y tế <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Toàn Diện</span></h2>
                    <p class="text-slate-500 font-medium max-w-2xl mx-auto">Cung cấp các giải pháp chăm sóc sức khỏe đa dạng, đáp ứng mọi nhu cầu của bạn và gia đình.</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div v-for="(srv, i) in services" :key="i" @click="handleServiceClick(srv.title)" class="cursor-pointer bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:border-blue-100 transition-all duration-300 transform hover:-translate-y-2 group text-center">
                        <div :class="`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 ${srv.bg} ${srv.color}`">
                            <i :class="srv.icon"></i>
                        </div>
                        <h3 class="font-extrabold text-xl mb-3 text-slate-800 group-hover:text-blue-600 transition-colors">{{ srv.title }}</h3>
                        <p class="text-sm text-slate-500 leading-relaxed">{{ srv.desc }}</p>
                    </div>
                </div>
            </div>

            <Transition :name="searchTransitionName" mode="out-in">
            <div v-if="searchTab === 'doctor'" key="docRes" class="max-w-[1400px] mx-auto px-6 py-16">
                <div class="flex items-end justify-between mb-12">
                    <div>
                        <h2 class="text-3xl font-black text-slate-800 tracking-tight">Xếp hạng <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Bác sĩ nổi bật</span></h2>
                        <p class="text-slate-500 mt-2 font-medium">Danh sách chuyên gia được bệnh nhân đánh giá cao nhất</p>
                    </div>
                    <button class="hidden md:flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition">Xem tất cả <i class="fa-solid fa-arrow-right"></i></button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    <div v-for="doc in filteredDoctors" :key="doc.id" class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
                        <div class="h-32 bg-gradient-to-br from-blue-50 to-cyan-50 relative flex justify-center">
                            <div class="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors"></div>
                            <img :src="doc.image" class="h-28 w-28 rounded-2xl border-4 border-white shadow-lg object-cover absolute -bottom-10 transform group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div class="pt-16 pb-6 px-6 text-center">
                            <h3 class="text-lg font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">{{ doc.name }}</h3>
                            <p class="text-blue-500 text-sm font-bold mt-1 bg-blue-50 inline-block px-3 py-1 rounded-full">{{ doc.spec }}</p>
                            <div class="flex justify-center items-center text-yellow-400 text-xs mt-4 mb-6">
                                <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                                <span class="text-slate-500 font-bold ml-1.5">({{ doc.rating }})</span>
                            </div>
                            <button @click="currentView = 'booking'; startBooking()" class="w-full bg-slate-50 text-slate-700 font-bold py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md flex justify-center items-center gap-2">
                                <i class="fa-solid fa-calendar-plus"></i> Đặt lịch ngay
                            </button>
                        </div>
                    </div>
                    <div v-if="filteredDoctors.length === 0" class="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                        <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-3xl mx-auto mb-4"><i class="fa-solid fa-user-doctor"></i></div>
                        <p class="text-slate-500 font-bold text-lg">Không tìm thấy bác sĩ phù hợp với tìm kiếm của bạn.</p>
                    </div>
                </div>
            </div>

            <div v-else-if="searchTab === 'medicine'" key="medRes" class="max-w-7xl mx-auto px-4 py-16 bg-gray-50">
                <h2 class="text-3xl font-black text-blue-900 mb-8 text-center">Bảng giá Thuốc tham khảo</h2>
                <div class="bg-white rounded-xl shadow-md overflow-hidden max-h-[500px] overflow-y-auto">
                    <table class="w-full text-left">
                        <thead class="bg-[#17c2a4] text-white sticky top-0">
                            <tr>
                                <th class="p-4 border-b font-bold">STT</th>
                                <th class="p-4 border-b font-bold">Tên Thuốc</th>
                                <th class="p-4 border-b font-bold">Công dụng chính</th>
                                <th class="p-4 border-b font-bold text-right">Đơn giá niêm yết</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(med, idx) in filteredMedicines" :key="med.id" class="hover:bg-teal-50 border-b border-gray-100">
                                <td class="p-4 text-gray-500">{{ idx + 1 }}</td>
                                <td class="p-4 font-bold text-teal-700">{{ med.name }}</td>
                                <td class="p-4 text-gray-600">{{ med.use }}</td>
                                <td class="p-4 font-bold text-red-500 text-right">{{ med.price }}</td>
                            </tr>
                            <tr v-if="filteredMedicines.length === 0">
                                <td colspan="4" class="p-8 text-center text-gray-500">Không tìm thấy loại thuốc này.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            </Transition>
        </div>

        <div v-else-if="currentView === 'news'" key="news" class="max-w-7xl mx-auto px-4 py-12">
            <h2 class="text-3xl font-bold text-gray-800 mb-8 border-l-4 border-blue-600 pl-4">TIN TỨC & CẨM NANG Y TẾ</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div v-for="news in newsList" :key="news.id" class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer group">
                    <div class="h-64 overflow-hidden">
                        <img :src="news.image" class="w-full h-full object-cover transform group-hover:scale-110 transition duration-500">
                    </div>
                    <div class="p-6">
                        <span class="text-xs font-bold text-blue-500 mb-2 block"><i class="fa-regular fa-clock"></i> {{ news.date }}</span>
                        <h3 class="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition">{{ news.title }}</h3>
                        <p class="text-gray-500 mt-2 line-clamp-2">Theo dõi các thông tin y khoa mới nhất và các cẩm nang bảo vệ sức khỏe cho gia đình bạn mỗi ngày...</p>
                    </div>
                </div>
            </div>
        </div>

        <div v-else-if="currentView === 'booking'" key="booking" class="max-w-5xl mx-auto px-4 py-8">
            <div class="flex justify-center mb-8 border-b-2 border-gray-200">
                <button @click="bookingTab = 'tickets'" :class="{'text-blue-600 border-b-4 border-blue-600': bookingTab === 'tickets', 'text-gray-500': bookingTab !== 'tickets'}" class="px-8 py-4 font-bold text-lg">
                    Phiếu Đặt Khám
                </button>
                <button @click="bookingTab = 'profiles'" :class="{'text-blue-600 border-b-4 border-blue-600': bookingTab === 'profiles', 'text-gray-500': bookingTab !== 'profiles'}" class="px-8 py-4 font-bold text-lg">
                    Hồ Sơ Của Tôi
                </button>
            </div>

            <Transition name="fade" mode="out-in">
            <div v-if="bookingTab === 'tickets'" key="tickets">
                
                <div class="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-8 shadow-sm">
                    <h3 class="font-bold text-orange-800 mb-3 text-lg"><i class="fa-solid fa-bell text-orange-500 mr-2 animate-pulse"></i> Nhắc nhở sức khỏe hôm nay</h3>
                    <ul class="space-y-3">
                        <li v-for="rm in healthReminders" :key="rm.id" class="flex items-center space-x-3 bg-white p-3 rounded-lg border border-orange-100">
                            <input type="checkbox" v-model="rm.isDone" class="w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500 cursor-pointer">
                            <span :class="{'line-through text-gray-400': rm.isDone, 'text-gray-800 font-medium': !rm.isDone}">
                                <b class="text-orange-600">{{ rm.time }}</b> - {{ rm.task }}
                            </span>
                        </li>
                    </ul>
                </div>

                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-gray-700">Phiếu khám của tôi</h2>
                    <button @click="startBooking" class="bg-blue-600 text-white font-bold px-6 py-2 rounded-lg shadow hover:bg-blue-700">
                        + ĐẶT LỊCH KHÁM MỚI
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div v-for="ticket in activeTickets" :key="ticket.id" class="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden relative flex flex-col">
                        <div :class="['absolute top-0 right-0 text-xs font-bold px-3 py-1 rounded-bl-lg text-white z-10', ticket.status === 'Đã khám' ? 'bg-green-500' : ticket.status === 'Đã đánh giá' ? 'bg-purple-500' : 'bg-yellow-500']">{{ ticket.status }}</div>
                        
                        <div class="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 flex justify-between text-center">
                            <div>
                                <p class="text-xs text-gray-500 font-bold uppercase">Ngày khám</p>
                                <p class="text-lg font-black text-red-500">{{ ticket.date }}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 font-bold uppercase">Giờ khám</p>
                                <p class="text-lg font-black text-red-500">{{ ticket.time }}</p>
                            </div>
                        </div>
                        
                        <div class="p-5 flex-1">
                            <p class="font-bold text-lg text-gray-800">{{ ticket.profileName }}</p>
                            <p class="text-sm text-gray-500 mb-1"><i class="fa-solid fa-phone w-4"></i> {{ ticket.profilePhone }}</p>
                            <p class="text-sm text-gray-500 mb-1"><i class="fa-solid fa-location-dot w-4"></i> {{ ticket.profileAddress }}</p>
                            <p class="text-gray-600 mt-2 border-t pt-2">Bệnh viện: Trung tâm y tế Đồ Án</p>
                            <p class="text-gray-600">Chuyên khoa: <span class="font-bold">{{ ticket.dept }}</span></p>
                            
                            <div class="mt-4 flex items-center justify-between">
                                <span class="bg-[#3bbae0] text-white px-4 py-1 rounded-full text-sm font-bold shadow-sm">Số thứ tự</span>
                                <div class="flex space-x-2">
                                    <span v-for="(num, idx) in formatQueueNumber(ticket.queueNumber)" :key="idx" class="w-8 h-8 flex items-center justify-center border-2 border-red-200 text-red-500 font-bold rounded-full bg-red-50">
                                        {{ num }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div v-if="ticket.paymentStatus === 'unpaid'" class="bg-red-50 border-t border-red-100 p-4">
                            <div class="flex justify-between items-center mb-2">
                                <p class="text-red-600 font-bold text-sm"><i class="fa-solid fa-circle-exclamation mr-1"></i> Chưa thanh toán ({{ ticket.amount.toLocaleString() }}đ)</p>
                                <button @click="handlePayment(ticket)" class="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded shadow text-sm font-bold transition">
                                    Thanh toán ngay
                                </button>
                            </div>
                            <p class="text-xs text-red-500 italic"><i class="fa-regular fa-clock"></i> Vui lòng thanh toán xác nhận trước ngày: <b>{{ getReminderDate(ticket.dateRaw) }}</b></p>
                        </div>
                        
                        <div v-else-if="ticket.paymentStatus === 'paid'" class="bg-green-50 border-t border-green-100 p-4 flex justify-between items-center">
                            <p class="text-green-600 font-bold text-sm"><i class="fa-solid fa-circle-check mr-1"></i> Đã thanh toán</p>
                            <button @click="openReceipt(ticket)" class="text-blue-600 hover:text-blue-800 text-sm font-bold underline"><i class="fa-solid fa-receipt"></i> Xem hóa đơn</button>
                        </div>

                        <div class="px-5 pb-5 bg-gray-50 border-t border-gray-100 pt-3">
                            <button v-if="ticket.status === 'Đã khám'" @click="openRatingModal(ticket)" class="w-full bg-orange-100 text-orange-600 font-bold hover:bg-orange-200 py-2 rounded-lg transition border border-orange-200 text-sm mb-2">
                                <i class="fa-solid fa-star mr-1"></i> Đánh giá dịch vụ
                            </button>
                            <button v-if="ticket.status === 'Đã khám'" @click="rescheduleAppointment(ticket)" class="w-full bg-green-100 text-green-600 font-bold hover:bg-green-200 py-2 rounded-lg transition border border-green-200 text-sm mb-2">
                                <i class="fa-solid fa-calendar-check mr-1"></i> Đặt lịch khám mới
                            </button>
                            <button v-if="ticket.status !== 'Đã đánh giá' && ticket.status !== 'Đã khám'" @click="cancelTicket(ticket.id)" class="w-full text-red-500 font-bold hover:bg-red-50 py-2 rounded-lg transition border border-red-200 text-sm">
                                <i class="fa-regular fa-trash-can mr-1"></i> Hủy phiếu đặt khám
                            </button>
                        </div>
                    </div>
                    
                    <div v-if="activeTickets.length === 0" class="col-span-2 text-center py-16 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <img src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png" class="w-32 h-32 mx-auto mb-4 opacity-50">
                        <h3 class="text-xl font-bold text-gray-600">Chưa đặt phiếu khám</h3>
                        <p class="text-gray-400 mt-2">Bạn hiện không có lịch hẹn khám nào sắp tới.</p>
                    </div>
                </div>
            </div>

            <div v-else-if="bookingTab === 'profiles'" key="profiles">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-gray-700">Danh sách Hồ sơ người bệnh</h2>
                    <button @click="openCreateProfile" class="bg-blue-600 text-white font-bold px-6 py-2 rounded-lg shadow hover:bg-blue-700">
                        + TẠO HỒ SƠ MỚI
                    </button>
                </div>

                <div class="space-y-4">
                    <div v-for="profile in profiles" :key="profile.id" class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition">
                        <div>
                            <h3 class="font-bold text-lg text-blue-800 uppercase">{{ profile.name }}</h3>
                            <p class="text-gray-600 text-sm mt-1"><i class="fa-solid fa-phone mr-1"></i> {{ profile.phone }} | <i class="fa-regular fa-calendar mr-1"></i> {{ profile.dob }}</p>
                            <p class="text-gray-600 text-sm mt-1"><i class="fa-solid fa-map-location-dot mr-1"></i> {{ profile.address }}</p>
                            <p v-if="profile.hasActiveTicket" class="text-xs font-bold text-orange-500 mt-2"><i class="fa-solid fa-triangle-exclamation"></i> Hồ sơ này đang có 1 lịch hẹn chờ khám</p>
                        </div>
                        <div class="flex flex-col space-y-2">
                            <button @click="openEMR" class="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm"><i class="fa-solid fa-file-medical"></i> Bệnh án điện tử</button>
                            <button @click="openEditProfile(profile)" class="border border-blue-500 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm"><i class="fa-solid fa-pen-to-square"></i> Cập nhật</button>
                        </div>
                    </div>
                </div>
            </div>
            </Transition>
        </div>

        <div v-else-if="currentView === 'chat'" key="chat" class="absolute inset-0">
            <PatientDoctorChat />
        </div>
        </Transition>
    </main>

    <footer v-show="currentView !== 'chat'" class="bg-gray-100 pt-10 pb-6 mt-12 border-t border-gray-200">
        <div class="max-w-7xl mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm text-gray-600">
                <div>
                    <h4 class="font-bold text-gray-800 mb-4 uppercase">Hướng dẫn</h4>
                    <ul class="space-y-2">
                        <li><a href="#" class="hover:text-blue-600 transition">Sơ đồ Trang Thông tin</a></li>
                        <li><a href="#" class="hover:text-blue-600 transition">Liên hệ</a></li>
                    </ul>
                </div>
                <div class="md:col-span-3">
                    <h4 class="font-bold text-gray-800 mb-4 uppercase">Liên kết Web</h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ul class="space-y-2">
                            <li><a href="#" class="hover:text-blue-600 transition"><i class="fa-solid fa-caret-right text-gray-400 mr-1"></i> Hội đồng Đại học & Ban giám đốc</a></li>
                            <li><a href="#" class="hover:text-blue-600 transition"><i class="fa-solid fa-caret-right text-gray-400 mr-1"></i> Khối Đào tạo</a></li>
                        </ul>
                        <ul class="space-y-2">
                            <li><a href="#" class="hover:text-blue-600 transition"><i class="fa-solid fa-caret-right text-gray-400 mr-1"></i> Khối Hành chính - Phục vụ</a></li>
                            <li><a href="#" class="hover:text-blue-600 transition"><i class="fa-solid fa-caret-right text-gray-400 mr-1"></i> Tra Cứu nhanh</a></li>
                        </ul>
                        <ul class="space-y-2">
                            <li><a href="#" class="hover:text-blue-600 transition"><i class="fa-solid fa-caret-right text-gray-400 mr-1"></i> Khối Nghiên Cứu - Ứng Dụng</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="border-t border-red-600 pt-6 text-center text-sm text-gray-600 space-y-1">
                <p>Copyright © 2026 - Bản quyền thuộc về Đồ án nhóm</p>
                <p>Địa chỉ: 254 Nguyễn Văn Linh, P. Thanh Khê - Tp. Đà Nẵng</p>
                <p>Điện thoại: (+84) 123.45678 - (+84) 012.210654</p>
            </div>
        </div>
    </footer>

    <div v-if="activeServiceModal === 'clinic'" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div class="bg-blue-600 text-white p-4 flex justify-between items-center">
                <h3 class="font-bold">HỆ THỐNG PHÒNG KHÁM LIÊN KẾT (ĐÀ NẴNG)</h3>
                <button @click="activeServiceModal = null" class="text-white text-xl"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="p-6 space-y-4">
                <div v-for="(clinic, i) in daNangClinics" :key="i" class="p-4 border rounded-lg bg-gray-50 flex items-start space-x-3">
                    <i class="fa-regular fa-hospital text-blue-500 text-2xl mt-1"></i>
                    <div><p class="font-bold text-gray-800">{{ clinic.name }}</p><p class="text-sm text-gray-600">{{ clinic.address }}</p></div>
                </div>
            </div>
        </div>
    </div>

    <div v-if="activeServiceModal === 'community'" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div class="bg-orange-500 text-white p-4 flex justify-between items-center">
                <h3 class="font-bold">CỘNG ĐỒNG Y TẾ (FACEBOOK)</h3>
                <button @click="activeServiceModal = null" class="text-white text-xl"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="p-6 space-y-3">
                <a href="https://www.facebook.com/ngtrhieu2005/" target="_blank" class="block w-full text-left p-4 border rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold transition"><i class="fa-brands fa-facebook text-xl mr-2"></i> Cộng đồng y khoa Việt Nam</a>
                <a href="https://www.facebook.com/Rynne3825" target="_blank" class="block w-full text-left p-4 border rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold transition"><i class="fa-brands fa-facebook text-xl mr-2"></i> Tạp chí y tế cộng đồng</a>
                <a href="https://www.facebook.com/quynh.nhu.520524" target="_blank" class="block w-full text-left p-4 border rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold transition"><i class="fa-brands fa-facebook text-xl mr-2"></i> Sức khỏe cộng đồng</a>
            </div>
        </div>
    </div>

    <div v-if="isRatingModalOpen" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div class="bg-orange-500 text-white p-4 flex justify-between items-center">
                <h3 class="font-bold tracking-wide"><i class="fa-solid fa-star mr-2"></i> ĐÁNH GIÁ DỊCH VỤ</h3>
                <button @click="isRatingModalOpen = false" class="hover:text-gray-200 text-xl"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="p-6 text-center space-y-4">
                <p class="text-gray-600">Bạn cảm thấy dịch vụ khám tại <b>{{ currentRatingData.doctorName }}</b> như thế nào?</p>
                <div class="flex justify-center space-x-2 text-4xl">
                    <i v-for="s in 5" :key="s" @click="currentRatingData.stars = s" :class="['fa-star cursor-pointer transition transform hover:scale-110', s <= currentRatingData.stars ? 'fa-solid text-yellow-400' : 'fa-regular text-gray-300']"></i>
                </div>
                <textarea v-model="currentRatingData.comment" placeholder="Chia sẻ trải nghiệm của bạn (không bắt buộc)..." class="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 h-24 text-sm mt-4"></textarea>
                <button @click="submitRating" class="w-full bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 shadow-md transition">GỬI ĐÁNH GIÁ</button>
            </div>
        </div>
    </div>

    <div v-if="showEMRModal" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div class="bg-green-600 text-white p-4 flex justify-between items-center">
                <h3 class="font-bold tracking-wide"><i class="fa-solid fa-file-medical mr-2"></i> BỆNH ÁN ĐIỆN TỬ LƯU TRỮ</h3>
                <button @click="showEMRModal = false" class="hover:text-gray-300 text-xl"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="p-6">
                <div class="border-2 border-green-100 rounded-xl p-5 bg-green-50/30">
                    <div class="flex justify-between border-b pb-3 mb-4">
                        <div><p class="text-sm text-gray-500">Ngày khám</p><p class="font-bold text-lg text-gray-800">{{ activeEMR.date }}</p></div>
                        <div class="text-right"><p class="text-sm text-gray-500">Bác sĩ phụ trách</p><p class="font-bold text-blue-700 text-lg">{{ activeEMR.doctor }}</p><p class="text-sm text-gray-500">{{ activeEMR.dept }}</p></div>
                    </div>
                    <div class="space-y-5">
                        <div><h4 class="font-bold text-green-700 uppercase text-sm mb-2"><i class="fa-solid fa-stethoscope mr-1"></i> Chẩn đoán</h4><p class="text-gray-800 bg-white p-4 rounded-lg border shadow-sm">{{ activeEMR.diagnosis }}</p></div>
                        <div><h4 class="font-bold text-green-700 uppercase text-sm mb-2"><i class="fa-solid fa-pills mr-1"></i> Đơn thuốc</h4><pre class="text-gray-800 bg-white p-4 rounded-lg border shadow-sm font-sans whitespace-pre-wrap leading-relaxed">{{ activeEMR.prescription }}</pre></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <Transition name="fade">
    <div v-if="isBookingModalOpen" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div class="bg-blue-600 text-white p-4 flex justify-between items-center">
                <button @click="isBookingModalOpen = false" class="text-white hover:text-gray-200"><i class="fa-solid fa-arrow-left"></i> Trở về</button>
                <h3 class="font-bold tracking-wide">QUY TRÌNH ĐẶT LỊCH</h3>
                <div class="w-6"></div>
            </div>

            <div v-if="bookingStep <= 3" class="px-6 py-4 border-b flex justify-between items-center relative bg-gray-50">
                <div class="absolute top-1/2 left-8 right-8 h-1 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
                <div class="absolute top-1/2 left-8 h-1 bg-orange-500 -z-10 transform -translate-y-1/2 transition-all duration-300" :style="{width: (bookingStep-1)*50 + '%'}"></div>
                <div :class="['w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 bg-white', bookingStep >= 1 ? 'border-orange-500 text-orange-500' : 'border-gray-300 text-gray-400']">1</div>
                <div :class="['w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 bg-white', bookingStep >= 2 ? 'border-orange-500 text-orange-500' : 'border-gray-300 text-gray-400']">2</div>
                <div :class="['w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 bg-white', bookingStep >= 3 ? 'border-orange-500 text-orange-500' : 'border-gray-300 text-gray-400']">3</div>
            </div>

            <div class="p-6 overflow-y-auto flex-1">
                <Transition name="fade" mode="out-in">
                <div v-if="bookingStep === 1" key="step1">
                    <h4 class="text-center font-bold text-gray-700 mb-4 uppercase">Chọn hồ sơ đặt khám</h4>
                    <div class="space-y-3">
                        <label v-for="p in profiles" :key="p.id" :class="['block border-2 rounded-xl p-4 cursor-pointer transition', selectedProfileId === p.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300', hasActiveTicket(p.id) ? 'opacity-50 cursor-not-allowed bg-gray-100' : '']">
                            <input type="radio" v-model="selectedProfileId" :value="p.id" class="hidden" :disabled="hasActiveTicket(p.id)">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="font-bold text-blue-900">{{ p.name }}</p>
                                    <p class="text-sm text-gray-500">{{ p.phone }}</p>
                                </div>
                                <i v-if="selectedProfileId === p.id" class="fa-solid fa-circle-check text-blue-500 text-2xl"></i>
                            </div>
                            <p v-if="hasActiveTicket(p.id)" class="text-xs text-red-500 mt-2 font-medium">* Đã có lịch khám, không thể đặt thêm.</p>
                        </label>
                    </div>
                </div>

                <div v-else-if="bookingStep === 2" class="space-y-4" key="step2">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Bệnh viện</label>
                        <input type="text" v-model="newBooking.hospital" disabled class="w-full border p-3 rounded-lg bg-gray-100 text-gray-600 font-medium">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Chuyên khoa (*)</label>
                        <select v-model="newBooking.dept" class="w-full border p-3 rounded-lg focus:outline-none focus:border-blue-500 bg-white">
                            <option value="" disabled>Chọn chuyên khoa</option>
                            <option value="Khoa Tim mạch">Khoa Tim mạch</option>
                            <option value="Khoa Thần kinh">Khoa Thần kinh</option>
                            <option value="Tai Mũi Họng">Tai Mũi Họng</option>
                            <option value="Khoa Nhi">Khoa Nhi</option>
                            <option value="Nội tổng quát">Nội tổng quát</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Bác sĩ (*)</label>
                        <select v-model="newBooking.doctorId" class="w-full border p-3 rounded-lg focus:outline-none focus:border-blue-500 bg-white">
                            <option value="" disabled>Chọn bác sĩ</option>
                            <option value="doctor1">Bác Sĩ Nguyễn Văn A</option>
                            <option value="doctor2">Bác Sĩ Trần Thị B</option>
                            <option value="doctor3">Bác Sĩ Lê Văn C</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày khám (*)</label>
                            <input type="date" v-model="newBooking.date" class="w-full border p-3 rounded-lg focus:outline-none focus:border-blue-500 bg-white">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Giờ khám (*)</label>
                            <select v-model="newBooking.time" class="w-full border p-3 rounded-lg focus:outline-none focus:border-blue-500 bg-white">
                                <option value="">Chọn giờ</option>
                                <option value="08:00 - 09:00">08:00 - 09:00</option>
                                <option value="09:00 - 10:00">09:00 - 10:00</option>
                                <option value="14:00 - 15:00">14:00 - 15:00</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div v-else-if="bookingStep === 3" class="space-y-4 text-sm" key="step3">
                    <h4 class="text-center font-bold text-gray-700 mb-4 uppercase">Xác nhận thông tin</h4>
                    <div class="bg-blue-50 p-5 rounded-xl border border-blue-200 space-y-3 text-gray-700 shadow-inner">
                        <div class="border-b border-blue-100 pb-3 mb-3">
                            <p class="font-black text-blue-800 text-lg">{{ profiles.find(p=>p.id === selectedProfileId)?.name }}</p>
                            <p><i class="fa-solid fa-phone w-4 text-gray-500"></i> {{ profiles.find(p=>p.id === selectedProfileId)?.phone }}</p>
                            <p><i class="fa-solid fa-location-dot w-4 text-gray-500"></i> {{ profiles.find(p=>p.id === selectedProfileId)?.address }}</p>
                        </div>
                        <p><span class="font-bold w-24 inline-block text-gray-500">Bệnh viện:</span> {{ newBooking.hospital }}</p>
                        <p><span class="font-bold w-24 inline-block text-gray-500">Chuyên khoa:</span> {{ newBooking.dept }}</p>
                        <p><span class="font-bold w-24 inline-block text-gray-500">Bác sĩ:</span> {{ getDoctorName(newBooking.doctorId) }}</p>
                        <p><span class="font-bold w-24 inline-block text-gray-500">Thời gian:</span> <span class="text-red-500 font-bold">{{ newBooking.time }} | {{ formatDateToVN(newBooking.date) }}</span></p>
                    </div>
                </div>

                <div v-else-if="bookingStep === 4" class="space-y-4" key="step4">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2 text-3xl"><i class="fa-solid fa-check"></i></div>
                        <h2 class="text-xl font-bold text-green-600 uppercase">Đặt lịch thành công</h2>
                        <p class="text-sm text-gray-500 mt-1">Hệ thống đã ghi nhận lịch hẹn của bạn.</p>
                    </div>
                    
                    <div class="bg-white border-2 border-dashed border-gray-300 p-5 rounded-xl mt-4 relative overflow-hidden shadow-sm">
                        <div class="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">CHƯA THANH TOÁN</div>
                        <h3 class="text-center font-black text-gray-800 text-lg mb-4 uppercase border-b pb-2">Hóa đơn điện tử</h3>
                        <div class="space-y-2 text-sm text-gray-600 mb-4">
                            <p class="flex justify-between"><span>Mã phiếu:</span> <span class="font-bold text-gray-800">{{ currentCheckoutTicket?.id }}</span></p>
                            <p class="flex justify-between"><span>Bệnh nhân:</span> <span class="font-bold text-gray-800">{{ currentCheckoutTicket?.profileName }}</span></p>
                            <p class="flex justify-between"><span>Chuyên khoa:</span> <span class="font-bold text-gray-800">{{ currentCheckoutTicket?.dept }}</span></p>
                            <p class="flex justify-between"><span>Lịch hẹn:</span> <span class="font-bold text-gray-800">{{ currentCheckoutTicket?.time }} - {{ currentCheckoutTicket?.date }}</span></p>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg flex justify-between items-center border border-gray-100">
                            <span class="font-bold text-gray-700">TỔNG VIỆN PHÍ:</span>
                            <span class="text-xl font-black text-red-600">{{ currentCheckoutTicket?.amount.toLocaleString() }}đ</span>
                        </div>
                        <p class="text-xs text-center text-red-500 mt-4 italic">
                            * Hạn chót thanh toán là ngày <b>{{ getReminderDate(currentCheckoutTicket?.dateRaw) }}</b>
                        </p>
                    </div>

                    <div class="flex space-x-3 mt-6">
                        <button @click="payLater" class="w-1/2 border-2 border-gray-300 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition">
                            Thanh toán sau
                        </button>
                        <button @click="handlePayment(currentCheckoutTicket)" class="w-1/2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-md transition flex items-center justify-center">
                            <i class="fa-solid fa-qrcode mr-2"></i> Quét QR Thanh toán
                        </button>
                    </div>
                </div>

                <div v-else-if="bookingStep === 5" class="text-center py-6" key="step5">
                    <img src="https://cdn-icons-png.flaticon.com/512/561/561169.png" class="w-24 mx-auto mb-4 opacity-80" alt="Receipt">
                    <h2 class="text-2xl font-black text-blue-600 mb-2 uppercase">Giao dịch thành công</h2>
                    <p class="text-gray-500 mb-6">Cảm ơn bạn đã thanh toán viện phí.</p>
                    
                    <div class="bg-blue-50 border border-blue-100 p-4 rounded-xl text-left text-sm mb-6 shadow-inner">
                        <p class="flex justify-between mb-2"><span>Mã giao dịch:</span> <span class="font-mono font-bold text-blue-800">{{ currentCheckoutTicket?.transactionId }}</span></p>
                        <p class="flex justify-between mb-2"><span>Ngày thanh toán:</span> <span class="font-bold text-gray-800">Hôm nay</span></p>
                        <p class="flex justify-between border-t border-blue-200 pt-2 mt-2"><span>Số tiền:</span> <span class="font-black text-red-600">{{ currentCheckoutTicket?.amount.toLocaleString() }}đ</span></p>
                    </div>

                    <button @click="isBookingModalOpen = false; bookingTab = 'tickets'" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-md">
                        TRỞ VỀ DANH SÁCH PHIẾU KHÁM
                    </button>
                </div>
                </Transition>
            </div>

            <div v-if="bookingStep <= 3" class="p-4 border-t bg-gray-50 flex space-x-4">
                <button v-if="bookingStep === 1" @click="isBookingModalOpen = false" class="w-1/2 border border-gray-300 bg-white text-gray-600 font-bold py-3 rounded-lg hover:bg-gray-100">HỦY BỎ</button>
                <button v-if="bookingStep > 1" @click="bookingStep--" class="w-1/2 border border-gray-300 bg-white text-gray-600 font-bold py-3 rounded-lg hover:bg-gray-100">QUAY LẠI</button>
                <button v-if="bookingStep < 3" @click="nextBookingStep" class="w-1/2 bg-[#3bbae0] text-white font-bold py-3 rounded-lg hover:bg-blue-500 ml-auto shadow-md">TIẾP TỤC</button>
                <button v-if="bookingStep === 3" @click="submitBooking" class="w-1/2 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 ml-auto shadow-md">XÁC NHẬN</button>
            </div>
        </div>
    </div>
    </Transition>

    <div v-if="showReceiptModal" class="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative">
            <div class="p-6 pt-8 text-center border-b border-dashed border-gray-300">
                <h3 class="font-black text-xl text-gray-800">MEDISMART</h3>
                <h2 class="mt-4 font-bold text-lg border-2 border-gray-800 inline-block px-4 py-1 uppercase tracking-widest">BIÊN LAI THU TIỀN</h2>
            </div>
            <div class="p-6 bg-gray-50/50 space-y-3 text-sm text-gray-700">
                <p class="flex justify-between"><span>Mã giao dịch:</span> <span class="font-mono font-bold text-blue-700">{{ receiptTicket?.transactionId }}</span></p>
                <div class="flex justify-between items-end mt-4 border-t pt-4">
                    <span class="font-bold text-gray-800 uppercase">TỔNG CỘNG:</span>
                    <span class="text-2xl font-black text-red-600">{{ receiptTicket?.amount.toLocaleString() }}đ</span>
                </div>
            </div>
            <div class="p-4 bg-gray-100 flex justify-center"><button @click="showReceiptModal = false" class="bg-gray-800 text-white font-bold py-2 px-8 rounded-lg">ĐÓNG</button></div>
        </div>
    </div>

    <div v-if="showQRModal" class="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-center">
            <div class="bg-[#ea0029] text-white p-4 flex justify-between items-center">
                <h3 class="font-bold tracking-wide">THANH TOÁN QUA VIETQR</h3>
                <button @click="showQRModal = false" class="text-white hover:text-gray-200 text-xl"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <div class="p-6">
                <p class="text-sm text-gray-500 mb-1">Mở App ngân hàng và quét mã</p>
                <p class="font-black text-3xl text-[#ea0029] mb-4">{{ ticketBeingPaid?.amount.toLocaleString() }}đ</p>

                <div class="border border-gray-200 shadow-sm rounded-xl p-3 inline-block mb-4">
                    <img src="./img/maqr.jpg" class="w-56 h-56 mx-auto rounded-lg" alt="QR Code Techcombank">
                </div>

                <button @click="confirmQRPayment" :disabled="isConfirmingPayment" class="w-full bg-[#ea0029] text-white font-bold py-3.5 rounded-xl hover:bg-red-700 shadow-md transition flex items-center justify-center disabled:bg-red-400">
                    <i v-if="isConfirmingPayment" class="fa-solid fa-spinner fa-spin mr-2"></i>
                    <span v-else>Xác nhận thanh toán</span>
                    <span v-if="isConfirmingPayment" class="ml-2">Đang xác nhận...</span>
                </button>
                <button @click="showQRModal = false" class="w-full mt-3 bg-white text-gray-500 border border-gray-300 font-bold py-2 rounded-xl">Hủy giao dịch</button>
            </div>
        </div>
    </div>

    <!-- MODAL CHỈNH SỬA HỒ SƠ CÁ NHÂN NGƯỜI DÙNG -->
    <div v-if="showUserProfileModal" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div class="bg-blue-600 text-white p-4 flex justify-between items-center">
                <h3 class="font-bold tracking-wide"><i class="fa-solid fa-user-circle mr-2"></i> CẬP NHẬT CÁ NHÂN</h3>
                <button @click="showUserProfileModal = false" class="text-white hover:text-gray-200 text-xl"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <div class="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                <!-- Tên -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Họ và Tên</label>
                    <input v-model="loggedInUser.name" type="text" placeholder="Nhập họ và tên" 
                        class="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <!-- Ngày sinh -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Ngày Sinh</label>
                    <input v-model="loggedInUser.dob" type="text" placeholder="VD: 1990-04-15" 
                        class="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <!-- Số điện thoại -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Số Điện Thoại</label>
                    <input v-model="loggedInUser.phone" type="tel" placeholder="Nhập số điện thoại" 
                        class="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <!-- Địa chỉ -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Địa Chỉ</label>
                    <input v-model="loggedInUser.address" type="text" placeholder="Nhập địa chỉ" 
                        class="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>

            <div class="p-4 border-t bg-gray-50 flex space-x-3">
                <button @click="showUserProfileModal = false" class="flex-1 border border-gray-300 text-gray-600 font-bold py-2.5 rounded-lg hover:bg-gray-100 transition">
                    Hủy bỏ
                </button>
                <button @click="saveUserProfile" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 shadow-md transition">
                    <i class="fa-solid fa-save mr-2"></i> Lưu thay đổi
                </button>
            </div>
        </div>
    </div>

    <!-- MODAL TẠO/CẬP NHẬT HỒ SƠ -->
    <Transition name="fade">
    <div v-if="isProfileModalOpen" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div class="bg-blue-600 text-white p-4 flex justify-between items-center">
                <h3 class="font-bold tracking-wide">{{ isEditing ? 'CẬP NHẬT HỒ SƠ' : 'TẠO HỒ SƠ MỚI' }}</h3>
                <button @click="isProfileModalOpen = false" class="text-white hover:text-gray-200 text-xl"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <div class="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                <!-- Tên -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Họ và Tên (*)</label>
                    <input v-model="currentProfileForm.name" type="text" placeholder="Nhập họ và tên" 
                        class="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <!-- Số điện thoại -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Số Điện Thoại (*)</label>
                    <input v-model="currentProfileForm.phone" type="tel" placeholder="Nhập số điện thoại" 
                        class="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <!-- Ngày sinh -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Ngày Sinh</label>
                    <input v-model="currentProfileForm.dob" type="text" placeholder="VD: 15/04/1990" 
                        class="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <!-- Địa chỉ -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Địa Chỉ</label>
                    <input v-model="currentProfileForm.address" type="text" placeholder="Nhập địa chỉ" 
                        class="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <!-- BHYT -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Số BHYT</label>
                    <input v-model="currentProfileForm.bhyt" type="text" placeholder="Nhập số BHYT (nếu có)" 
                        class="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>

            <div class="p-4 border-t bg-gray-50 flex space-x-3">
                <button @click="isProfileModalOpen = false" class="flex-1 border border-gray-300 text-gray-600 font-bold py-2.5 rounded-lg hover:bg-gray-100 transition">
                    Hủy bỏ
                </button>
                <button @click="saveProfile" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 shadow-md transition">
                    <i class="fa-solid fa-save mr-2"></i>{{ isEditing ? 'Cập nhật' : 'Tạo hồ sơ' }}
                </button>
            </div>
        </div>
    </div>
    </Transition>

    <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <transition name="fade">
            <div v-if="isChatOpen" class="bg-white w-80 sm:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 flex justify-between items-center text-white">
                    <div class="flex items-center space-x-2">
                        <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 text-xl shadow"><i class="fa-solid fa-robot"></i></div>
                        <div><p class="font-bold">Trợ lý y tế AI</p><p class="text-[10px] text-green-200"><i class="fa-solid fa-circle text-[8px]"></i> Đang trực tuyến</p></div>
                    </div>
                    <button @click="isChatOpen = false" class="hover:text-gray-200 text-xl"><i class="fa-solid fa-xmark"></i></button>
                </div>
                
                <div ref="chatBodyRef" data-lenis-prevent class="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
                    <div v-for="(msg, i) in chatMessages" :key="'msg-'+i" :class="['flex', msg.sender === 'user' ? 'justify-end' : 'justify-start']">
                        <div :class="['max-w-[90%] rounded-2xl p-3 text-sm shadow-sm', msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none']"
                        >
                            <span v-html="msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>')"></span>
                            <div v-if="msg.options" class="mt-3 flex flex-wrap gap-2">
                                <button v-for="opt in msg.options" :key="opt" @click="handleChatOption(opt, i)" class="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-100 transition">{{ opt }}</button>
                            </div>
                        </div>
                    </div>
                    <div v-if="isBotTyping" key="typing" class="flex justify-start">
                        <div class="bg-white border rounded-2xl rounded-bl-none p-3 shadow-sm flex space-x-1 items-center h-10 w-16 justify-center">
                            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div><div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div><div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                        </div>
                    </div>
                </div>

                <div class="p-3 bg-white border-t border-gray-100 flex items-center space-x-2">
                    <input v-model="chatInput" @keyup.enter="sendChatMessage(chatInput)" type="text" placeholder="Nhập triệu chứng hoặc yêu cầu..." class="flex-1 border-none bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm">
                    <button @click="sendChatMessage(chatInput)" class="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition shadow-md"><i class="fa-solid fa-paper-plane"></i></button>
                </div>
            </div>
        </transition>

        <transition name="fade">
            <button v-show="!isChatOpen" @click="isChatOpen = true" class="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl hover:bg-blue-700 transition transform hover:scale-110 hover:rotate-12 animate-bounce">
                <i class="fa-solid fa-comment-medical"></i>
            </button>
        </transition>
    </div>

    <!-- TOAST NOTIFICATIONS -->
    <div v-if="toastNotification" :key="toastNotification.id" class="fixed top-6 right-6 z-[100] toast-enter-active">
      <div :class="[
        'rounded-2xl shadow-2xl overflow-hidden border-l-4 flex items-start gap-4 p-5 max-w-sm backdrop-blur-sm',
        toastNotification.type === 'success' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-green-500 text-green-800' : 
        toastNotification.type === 'error' ? 'bg-gradient-to-r from-red-50 to-rose-50 border-l-red-500 text-red-800' :
        toastNotification.type === 'warning' ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-l-amber-500 text-amber-800' :
        'bg-gradient-to-r from-blue-50 to-cyan-50 border-l-blue-500 text-blue-800'
      ]">
        <div :class="[
          'w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0',
          toastNotification.type === 'success' ? 'bg-green-200 text-green-700' :
          toastNotification.type === 'error' ? 'bg-red-200 text-red-700' :
          toastNotification.type === 'warning' ? 'bg-amber-200 text-amber-700' :
          'bg-blue-200 text-blue-700'
        ]">
          <i :class="[
            'fa-solid',
            toastNotification.type === 'success' ? 'fa-circle-check' :
            toastNotification.type === 'error' ? 'fa-circle-xmark' :
            toastNotification.type === 'warning' ? 'fa-triangle-exclamation' :
            'fa-circle-info'
          ]"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-sm">{{ toastNotification.title }}</p>
          <p class="text-sm opacity-90 mt-1 leading-relaxed">{{ toastNotification.message }}</p>
        </div>
        <button @click="toastNotification = null" :class="[
          'text-xl hover:opacity-70 transition flex-shrink-0 mt-1',
          toastNotification.type === 'success' ? 'text-green-500' :
          toastNotification.type === 'error' ? 'text-red-500' :
          toastNotification.type === 'warning' ? 'text-amber-500' :
          'text-blue-500'
        ]">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-clamp: 2; overflow: hidden; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(20px); }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
.toast-slide-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-slide-leave-active { transition: all 0.25s ease-in; }
.toast-slide-enter-from { opacity: 0; transform: translateX(60px) scale(0.95); }
.toast-slide-leave-to { opacity: 0; transform: translateX(60px) scale(0.95); }

.slide-left-enter-active, .slide-left-leave-active,
.slide-right-enter-active, .slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-left-enter-from { opacity: 0; transform: translateX(30px); }
.slide-left-leave-to { opacity: 0; transform: translateX(-30px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-30px); }
.slide-right-leave-to { opacity: 0; transform: translateX(30px); }

.hero-fade-enter-active { transition: opacity 1.2s ease-in-out; }
.hero-fade-leave-active { transition: opacity 0.8s ease-in-out; }
.hero-fade-enter-from { opacity: 0; }
.hero-fade-leave-to { opacity: 0; }
</style>
