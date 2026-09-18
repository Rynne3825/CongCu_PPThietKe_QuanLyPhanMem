<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PatientDoctorChat from '@/components/PatientDoctorChat.vue';
import { useUnreadMessages } from '@/composables/useUnreadMessages.js';

const router = useRouter();

// ================= HÀM TIỆN ÍCH =================
const loadData = (key, defaultData) => {
    try {
        const saved = localStorage.getItem(key);
        if (!saved || saved === 'undefined' || saved === 'null') return defaultData;
        return JSON.parse(saved);
    } catch (e) {
        return defaultData;
    }
};

const currentMenu = ref(localStorage.getItem('medi_doctor_menu') || 'overview');
watch(currentMenu, (val) => localStorage.setItem('medi_doctor_menu', val));
const currentLang = ref(localStorage.getItem('medi_lang') || 'vi');
watch(currentLang, (val) => localStorage.setItem('medi_lang', val));

const isDarkMode = ref(localStorage.getItem('medi_theme') === 'dark');
watch(isDarkMode, (val) => localStorage.setItem('medi_theme', val ? 'dark' : 'light'));

const translations = {
    vi: {
        overview: 'Tổng quan', approvals: 'Duyệt Lịch', completed: 'Đã Khám', documents: 'Tài liệu', medications: 'Đơn thuốc',
        settings: 'Cài đặt', options: 'Tùy chọn', logout: 'Đăng xuất', working: 'Làm việc', messages: 'Tin nhắn',
        pendingApproval: 'Lịch chờ duyệt', todayTickets: 'Lịch khám hôm nay', completedTickets: 'Đã khám',
        noPending: 'Không có lịch chờ duyệt', noToday: 'Không có lịch khám hôm nay', patientList: 'Danh Sách Bệnh Nhân',
        waitingCheckup: 'Chờ Khám', noWaitingCheckup: 'Không có bệnh nhân chờ khám', alreadyChecked: 'Đã Khám',
        noAlreadyChecked: 'Không có bệnh nhân đã khám', checkupDone: 'Khám Xong', approve: 'Duyệt', reject: 'Từ chối',
        details: 'Chi Tiết Lịch', action: 'Hành Động', allApproved: 'Tất cả lịch khám đã được duyệt',
        emr: 'Hồ Sơ & Bệnh Án Điện Tử', noEmr: 'Chưa có bệnh án điện tử', diagnosis: 'Chẩn đoán', prescription: 'Đơn thuốc',
        notes: 'Ghi chú', manageRx: 'Quản Lý Đơn Thuốc', noRx: 'Chưa có đơn thuốc nào', medName: 'Tên Thuốc',
        quantity: 'Số lượng', usage: 'Hướng dẫn', download: 'Tải Xuống', print: 'In Đơn', sysSettings: 'Cài đặt Hệ thống',
        sysNormal: 'Hệ thống đang hoạt động bình thường', syncDesc: 'Dữ liệu bệnh nhân được đồng bộ tự động từ hệ thống bệnh nhân',
        language: 'Ngôn ngữ / Language', appearance: 'Chế độ hiển thị / Appearance', lightMode: 'Sáng (Light)', darkMode: 'Tối (Dark)',
        patient: 'Bệnh Nhân', department: 'Khoa Công nghệ', doctor: 'BS.', listPending: 'Danh Sách Lịch Chờ Duyệt'
    },
    en: {
        overview: 'Overview', approvals: 'Approvals', completed: 'Completed', documents: 'Documents', medications: 'Prescriptions',
        settings: 'Settings', options: 'Options', logout: 'Logout', working: 'Working', messages: 'Messages',
        pendingApproval: 'Pending Approvals', todayTickets: 'Today\'s Appointments', completedTickets: 'Completed',
        noPending: 'No pending approvals', noToday: 'No appointments today', patientList: 'Patient List',
        waitingCheckup: 'Waiting', noWaitingCheckup: 'No patients waiting', alreadyChecked: 'Completed',
        noAlreadyChecked: 'No completed checkups', checkupDone: 'Complete', approve: 'Approve', reject: 'Reject',
        details: 'Details', action: 'Action', allApproved: 'All appointments approved',
        emr: 'Electronic Medical Records', noEmr: 'No medical records found', diagnosis: 'Diagnosis', prescription: 'Prescription',
        notes: 'Notes', manageRx: 'Prescriptions', noRx: 'No prescriptions found', medName: 'Medicine',
        quantity: 'Qty', usage: 'Usage', download: 'Download', print: 'Print', sysSettings: 'System Settings',
        sysNormal: 'System is running normally', syncDesc: 'Patient data is automatically synchronized from the patient system',
        language: 'Language / Ngôn ngữ', appearance: 'Appearance / Hiển thị', lightMode: 'Light', darkMode: 'Dark',
        patient: 'Patient', department: 'Tech Dept', doctor: 'Dr.', listPending: 'Pending Approvals List'
    }
};

const t = (key) => translations[currentLang.value]?.[key] || key;

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

const handleLogout = () => {
    router.push('/');
};

const menuItems = computed(() => [
    { id: 'overview', name: t('overview'), icon: 'fa-solid fa-border-all' },
    { id: 'approvals', name: t('approvals'), icon: 'fa-solid fa-check-circle' },
    { id: 'completed', name: t('completed'), icon: 'fa-solid fa-stethoscope' },
    { id: 'documents', name: t('documents'), icon: 'fa-solid fa-file-medical' },
    { id: 'medications', name: t('medications'), icon: 'fa-solid fa-pills' },
    { id: 'messages', name: t('messages'), icon: 'fa-regular fa-comments' },
]);

// ================= LOAD DỮ LIỆU TỪ BỆNH NHÂN =================
const activeTickets = ref(loadData('medi_tickets', []));
const medicalRecords = ref(loadData('medi_records', [])); 

// Theo dõi tin nhắn chưa đọc (bước: bs01)
const { totalUnread: doctorUnread, resetUnread: resetDoctorUnread } = useUnreadMessages('bs01');

onMounted(() => {
    localStorage.setItem('current_user_id', 'bs01'); // Mock as BS01
    
    // Listen to cross-tab updates for real-time sync without F5
    window.addEventListener('storage', (e) => {
        if (e.key === 'medi_tickets' && e.newValue) {
            activeTickets.value = JSON.parse(e.newValue);
        }
        if (e.key === 'medi_records' && e.newValue) {
            medicalRecords.value = JSON.parse(e.newValue);
        }
    });
});

watch(activeTickets, (val) => {
  localStorage.setItem('medi_tickets', JSON.stringify(val));
  // Trigger custom event for real-time update
  window.dispatchEvent(new CustomEvent('mediTicketsUpdated', { detail: val }));
}, { deep: true });
watch(medicalRecords, (val) => localStorage.setItem('medi_records', JSON.stringify(val)), { deep: true });

// ================= TÍNH TOÁN STATS ĐỘNG =================
const pendingTickets = computed(() => activeTickets.value.filter(t => t.status === 'Chờ duyệt'));
const completedTickets = computed(() => activeTickets.value.filter(t => t.status === 'Đã khám'));
const todayTickets = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return activeTickets.value.filter(t => t.dateRaw === today);
});

const stats = computed(() => [
    { title: t('pendingApproval'), value: pendingTickets.value.length.toString(), icon: 'fa-solid fa-hourglass-end', color: 'text-orange-500' },
    { title: t('todayTickets'), value: todayTickets.value.length.toString(), icon: 'fa-solid fa-calendar-check', color: 'text-green-500' },
    { title: t('completedTickets'), value: completedTickets.value.length.toString(), icon: 'fa-solid fa-check-double', color: 'text-blue-500' },
]);

// ================= HÀM QUẢN LÝ LỊCH =================
const approveTicket = (ticket) => {
    const index = activeTickets.value.findIndex(t => t.id === ticket.id);
    if (index !== -1) {
        activeTickets.value[index].status = 'Chờ khám';
        showToast('success', 'Duyệt Thành Công', 'Đã duyệt lịch khám của bệnh nhân ' + (ticket.profileName || ticket.patientName));
    }
};

const rejectTicket = (ticket) => {
    if (confirm('Bạn có chắc muốn từ chối lịch khám của ' + (ticket.profileName || ticket.patientName) + '?')) {
        const index = activeTickets.value.findIndex(t => t.id === ticket.id);
        if (index !== -1) {
            activeTickets.value[index].status = 'Bị từ chối';
            showToast('error', 'Từ Chối Lịch', 'Đã từ chối lịch khám của ' + (ticket.profileName || ticket.patientName));
        }
    }
};

const completeCheckup = (ticket) => {
    const index = activeTickets.value.findIndex(t => t.id === ticket.id);
    if (index !== -1) {
        activeTickets.value[index].status = 'Đã khám';
        
        // Tự động lưu EMR
        const emr = {
            id: 'EMR_' + Math.random().toString(36).substr(2, 9),
            patientName: (ticket.profileName || ticket.patientName),
            date: new Date().toLocaleDateString('vi-VN'),
            dept: ticket.dept,
            diagnosis: 'Khám sức khỏe định kỳ',
            prescription: '1. Paracetamol 500mg x 10 viên\n2. Vitamin C x 5 lọ',
            notes: 'Bệnh nhân cơ bản lành, khuyến cáo tái khám sau 1 tháng'
        };
        medicalRecords.value.push(emr);
        
        // Tự động lưu đơn thuốc
        const prescription = {
            id: 'RX_' + Math.random().toString(36).substr(2, 9),
            patientName: (ticket.profileName || ticket.patientName),
            date: new Date().toLocaleDateString('vi-VN'),
            medicines: [
                { name: 'Paracetamol 500mg', quantity: 10, usage: '2 viên/ngày' },
                { name: 'Vitamin C', quantity: 5, usage: '1 lọ/ngày' }
            ]
        };
        prescriptions.value.push(prescription);
        
        showToast('success', 'Khám Xong', 'Bệnh nhân ' + ticket.profileName + ' có thể đánh giá dịch vụ. EMR & Đơn thuốc đã được lưu.');
    }
};

// ================= DANH SÁCH ĐƠN THUỐC =================
const defaultPrescriptions = [
    {
        id: 'RX_001',
        patientName: 'Lê văn Hoài Rin',
        date: '15/04/2026',
        medicines: [
            { name: 'Paracetamol 500mg', quantity: 10, usage: '2 viên/ngày' },
            { name: 'Oresol', quantity: 5, usage: 'Pha nước uống' }
        ]
    }
];
const prescriptions = ref(loadData('medi_prescriptions', defaultPrescriptions));
watch(prescriptions, (val) => localStorage.setItem('medi_prescriptions', JSON.stringify(val)), { deep: true });

// ================= TẢI XUỐNG & IN ĐƠN THUỐC =================
const downloadPrescription = (rx) => {
    // Tạo nội dung CSV
    let csvContent = 'MediSmart - Đơn Thuốc Điện Tử\n';
    csvContent += '=====================================\n\n';
    csvContent += `Mã đơn: ${rx.id}\n`;
    csvContent += `Bệnh nhân: ${rx.patientName}\n`;
    csvContent += `Ngày cấp: ${rx.date}\n\n`;
    csvContent += 'DANH SÁCH THUỐC:\n';
    csvContent += '-------------------------------------\n';
    csvContent += 'STT,Tên Thuốc,Số Lượng,Hướng Dẫn Sử Dụng\n';
    
    rx.medicines.forEach((med, idx) => {
        csvContent += `${idx + 1},"${med.name}",${med.quantity},"${med.usage}"\n`;
    });
    
    csvContent += '\n=====================================\n';
    csvContent += 'Hướng dẫn: Mang đơn này đến nhà thuốc để lấy thuốc\n';
    csvContent += 'Hạn sử dụng: 30 ngày kể từ ngày cấp đơn\n';
    
    // Tạo blob và download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Don_Thuoc_${rx.id}_${rx.patientName.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('success', 'Tải Xuống Thành Công', `Đơn thuốc ${rx.id} đã được tải xuống`);
};

const printPrescription = (rx) => {
    // Tạo nội dung HTML để in
    const printContent = `
        <html>
            <head>
                <meta charset="UTF-8">
                <title>Đơn Thuốc ${rx.id}</title>
                <style>
                    body { font-family: 'Times New Roman', Times, serif; padding: 20px; line-height: 1.4; color: #000; font-size: 14px; }
                    .container { max-width: 900px; margin: 0 auto; background: #fff; }
                    .header-top { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
                    .header-top .left span { display: block; margin-bottom: 5px; }
                    .header-top .right { text-align: right; }
                    .header-top .right .code-box { border: 1px solid #333; padding: 3px 10px; font-weight: bold; margin-left: 5px; display: inline-block; }
                    
                    .title { text-align: center; color: #3b5998; font-size: 24px; font-weight: bold; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px; }
                    
                    .patient-info { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
                    .patient-info td { padding: 4px 0; vertical-align: top; }
                    .patient-info .label { color: #555; margin-right: 5px; }
                    
                    .section-title { font-weight: bold; font-size: 14px; margin-top: 15px; margin-bottom: 5px; }
                    
                    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
                    .data-table th, .data-table td { border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 8px 5px; text-align: left; }
                    .data-table th { background-color: #fcfcfc; font-weight: bold; color: #333; }
                    
                    .treatment-type { margin: 10px 0 20px; font-size: 13px; }
                    .treatment-type input[type="radio"] { margin-right: 3px; margin-left: 15px; vertical-align: middle; }
                    
                    .footer-notes { font-size: 13px; line-height: 1.8; margin-top: 20px; }
                    .signature-area { margin-top: 20px; display: flex; justify-content: flex-end; text-align: center; }
                    .signature-box { width: 250px; }
                    
                    @media print {
                        body { margin: 0; padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header-top">
                        <div class="left">
                            <span>Tên đơn vị: <strong>Đồ án nhóm</strong></span>
                            <span>Địa chỉ: 03 Quang Trung</span>
                        </div>
                        <div class="right">
                            Mã đơn thuốc: <span class="code-box">${rx.id || '25005P184831-C'}</span>
                        </div>
                    </div>
                    
                    <div class="title">ĐƠN THUỐC</div>
                    
                    <table class="patient-info">
                        <tr>
                            <td colspan="2"><span class="label">Họ tên:</span> <strong>${rx.patientName || 'Nguyễn Văn A'}</strong></td>
                            <td><span class="label">Ngày sinh:</span> 15/04/1990</td>
                            <td><span class="label">Cân nặng:</span> 57</td>
                            <td><span class="label">Giới tính:</span> Nam</td>
                        </tr>
                        <tr>
                            <td colspan="2"><span class="label">Mã số BHYT (nếu có):</span> DN40123456789</td>
                            <td colspan="2"><span class="label">CMT/CCCD (nếu có):</span> 012345678901</td>
                            <td><span class="label">Mã định danh y tế:</span></td>
                        </tr>
                        <tr>
                            <td colspan="2"><span class="label">Số điện thoại:</span> 0987654321</td>
                            <td colspan="3"><span class="label">Địa chỉ liên hệ:</span> Đà Nẵng</td>
                        </tr>
                        <tr>
                            <td colspan="5"><span class="label">Mã định danh công dân:</span></td>
                        </tr>
                    </table>
                    
                    <div class="section-title">Chẩn đoán</div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width: 10%;">Mã</th>
                                <th style="width: 45%;">Chẩn đoán</th>
                                <th style="width: 45%;">Kết luận</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>M53.1</td>
                                <td>Hội chứng cổ vai cánh tay</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="treatment-type">
                        <span class="label">Lưu ý:</span> Không<br>
                        <span class="label">Hình thức điều trị:</span> 
                        <input type="radio" checked> Nội trú
                        <input type="radio"> Ngoại trú
                    </div>
                    
                    <div class="section-title">Thuốc điều trị</div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Mã thuốc</th>
                                <th>Hoạt chất</th>
                                <th>Tên thuốc</th>
                                <th>ĐVT</th>
                                <th>SL</th>
                                <th>Cách dùng</th>
                                <th>Đã bán</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rx.medicines && rx.medicines.length > 0 ? rx.medicines.map((med, idx) => `
                                <tr>
                                    <td>40.${1000 + idx}</td>
                                    <td>${med.name.split(' ')[0]}</td>
                                    <td>${med.name}</td>
                                    <td>Viên</td>
                                    <td>${med.quantity}</td>
                                    <td>${med.usage}</td>
                                    <td></td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td>40.1054</td>
                                    <td>Vitamin B6</td>
                                    <td>Vitamin B6 100mg - T23</td>
                                    <td>Ống</td>
                                    <td>1</td>
                                    <td>1 ống/lần * 1 lần/ngày</td>
                                    <td></td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                    
                    <div>
                        <strong>Lời dặn:</strong> Bất thường đến khám lại
                    </div>
                    
                    <div class="signature-area">
                        <div class="signature-box">
                            <p>Ngày ${new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                            <p style="font-weight: bold; margin-bottom: 70px;">Bác sĩ Nguyễn Văn A</p>
                        </div>
                    </div>
                    
                    <div class="footer-notes">
                        <p>Lịch tái khám sau ........... ngày hoặc khi có biểu hiện bất thường</p>
                        <p>Khám lại mang theo đơn này</p>
                        <p>Tên bố hoặc mẹ của trẻ hoặc người đưa trẻ đến khám chữa bệnh ............................................</p>
                    </div>
                </div>
                
                <script>
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    };
                </` + `script>
            </bo` + `dy>
        </htm` + `l>
    `;
    
    // Mở cửa sổ in
    const printWindow = window.open('', '', 'height=800,width=900');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    showToast('success', 'Chuẩn Bị In', `Đơn thuốc ${rx.id} đang chuẩn bị in`);
};
</script>

<template>
  <div :class="['text-slate-800 flex h-screen overflow-hidden font-sans transition-colors duration-500', isDarkMode ? 'theme-dark bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30']">
      <aside class="w-64 flex flex-col z-20 bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950 shadow-2xl shadow-black/40">
          <!-- Logo -->
          <div class="px-6 pt-7 pb-5 border-b border-white/10">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
                <i class="fa-solid fa-briefcase-medical text-white text-lg"></i>
              </div>
              <span class="text-xl font-black tracking-tight text-white">MediSmart</span>
            </div>
          </div>
          <!-- Doctor Profile Card -->
          <div class="mx-4 mt-5 mb-2 p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/15 shadow-inner">
            <div class="flex items-center gap-3">
              <div class="relative">
                <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-black text-lg shadow-md">A</div>
                <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-800"></span>
              </div>
              <div>
                <p class="text-white font-bold text-sm leading-tight">BS. Nguyễn Văn A</p>
                <p class="text-blue-300 text-xs font-medium mt-0.5">Khoa Công nghệ</p>
              </div>
            </div>
          </div>
          
          <nav class="flex-1 overflow-y-auto py-4 px-4 space-y-1.5 custom-scrollbar">
              <a v-for="item in menuItems" :key="item.id" @click="item.id === 'messages' ? (currentMenu = item.id, resetDoctorUnread()) : currentMenu = item.id" 
                 :class="[currentMenu === item.id ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 scale-[1.01]' : 'text-slate-400 hover:bg-white/10 hover:text-white', 'flex items-center px-4 py-3 rounded-2xl cursor-pointer font-medium transition-all duration-200 group relative']">
                  <i :class="[item.icon, 'w-5 text-base transition-transform duration-300 group-hover:scale-110', currentMenu === item.id ? 'text-white' : 'text-slate-400']"></i>
                  <span class="flex-1 ml-3 text-sm">{{ item.name }}</span>
                  <span v-if="item.id === 'approvals' && pendingTickets.length > 0" class="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">{{ pendingTickets.length }}</span>
                  <span v-if="item.id === 'messages' && doctorUnread > 0" class="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-sm animate-pulse">{{ doctorUnread }}</span>
              </a>
              
              <div class="pt-4 mt-4 border-t border-white/10">
                <p class="px-4 text-[10px] font-bold uppercase tracking-widest mb-2 text-slate-500">{{ t('options') }}</p>
                <a @click="currentMenu = 'settings'" :class="[currentMenu === 'settings' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-white/10 hover:text-white', 'flex items-center px-4 py-3 rounded-2xl cursor-pointer font-medium transition-all duration-200 group']">
                  <i class="fa-solid fa-gear w-5 text-base transition-transform duration-300 group-hover:rotate-90"></i><span class="ml-3 text-sm">{{ t('settings') }}</span>
                </a>
              </div>
          </nav>

          <div class="p-4 border-t border-white/10">
              <button @click="handleLogout" class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all duration-300 active:scale-95 bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:text-red-300 border border-red-500/20">
                <i class="fa-solid fa-right-from-bracket"></i> <span class="text-sm">{{ t('logout') }}</span>
              </button>
          </div>
      </aside>

      <main class="flex-1 flex flex-col h-screen overflow-hidden relative">
          <div class="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10 animate-pulse" style="animation-duration: 8s;"></div>
          <div class="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10 animate-pulse" style="animation-duration: 10s;"></div>

          <header :class="['h-16 px-8 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl transition-colors duration-300 border-b', isDarkMode ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/80 border-slate-200/60 shadow-sm']">
              <div class="flex items-center gap-3">
                <div :class="['w-8 h-8 rounded-lg flex items-center justify-center text-sm', isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600']">
                  <i :class="menuItems.find(m => m.id === currentMenu)?.icon || 'fa-solid fa-house'"></i>
                </div>
                <h2 :class="['text-lg font-extrabold tracking-tight', isDarkMode ? 'text-white' : 'text-slate-800']">{{ menuItems.find(m => m.id === currentMenu)?.name || (currentMenu === 'settings' ? t('settings') : t('working')) }}</h2>
              </div>
              <div class="flex items-center gap-3">
                <div :class="['px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5', isDarkMode ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600']">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span> Đang trực
                </div>
                <div :class="['px-3 py-1.5 rounded-xl text-xs font-medium', isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500']">{{ new Date().toLocaleDateString('vi-VN', {weekday:'long', day:'2-digit', month:'2-digit'}) }}</div>
              </div>
          </header>

          <div :class="['flex-1 relative z-0', currentMenu === 'messages' ? 'overflow-hidden' : 'overflow-y-auto p-8 custom-scrollbar']" data-lenis-prevent>
              <Transition name="fade" mode="out-in">
              <div v-if="currentMenu === 'overview'" class="space-y-6" key="overview">
                  <!-- Welcome Banner -->
                  <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 shadow-2xl shadow-blue-500/20">
                    <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px); background-size: 24px 24px;"></div>
                    <div class="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div class="relative z-10 flex items-center justify-between">
                      <div>
                        <p class="text-blue-200 text-sm font-bold uppercase tracking-widest mb-1">Chào mừng trở lại 👋</p>
                        <h2 class="text-white text-2xl font-black">BS. Nguyễn Văn A</h2>
                        <p class="text-blue-200 text-sm mt-1 font-medium">Khoa Công nghệ • {{ new Date().toLocaleDateString('vi-VN', {weekday:'long', day:'2-digit', month:'long', year:'numeric'}) }}</p>
                      </div>
                      <div class="hidden md:flex items-center gap-3">
                        <div class="text-center bg-white/15 backdrop-blur rounded-2xl px-5 py-3 border border-white/20">
                          <p class="text-2xl font-black text-white">{{ todayTickets.length }}</p>
                          <p class="text-blue-200 text-xs font-bold mt-0.5">Hôm nay</p>
                        </div>
                        <div class="text-center bg-white/15 backdrop-blur rounded-2xl px-5 py-3 border border-white/20">
                          <p class="text-2xl font-black text-white">{{ completedTickets.length }}</p>
                          <p class="text-blue-200 text-xs font-bold mt-0.5">Đã khám</p>
                        </div>
                        <div class="text-center bg-white/15 backdrop-blur rounded-2xl px-5 py-3 border border-white/20">
                          <p class="text-2xl font-black text-white">{{ pendingTickets.length }}</p>
                          <p class="text-blue-200 text-xs font-bold mt-0.5">Chờ duyệt</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Stat Cards -->
                  <div class="grid grid-cols-3 gap-5">
                    <div v-for="(stat, i) in stats" :key="stat.title"
                      :class="['relative overflow-hidden p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer group',
                        i === 0 ? (isDarkMode ? 'bg-gradient-to-br from-orange-900/30 to-slate-800 border-orange-700/30 hover:shadow-orange-500/10' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100 hover:shadow-orange-400/20') :
                        i === 1 ? (isDarkMode ? 'bg-gradient-to-br from-emerald-900/30 to-slate-800 border-emerald-700/30 hover:shadow-emerald-500/10' : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100 hover:shadow-emerald-400/20') :
                                  (isDarkMode ? 'bg-gradient-to-br from-blue-900/30 to-slate-800 border-blue-700/30 hover:shadow-blue-500/10' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100 hover:shadow-blue-400/20')
                      ]">
                      <div class="flex items-start justify-between mb-4">
                        <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform duration-300',
                          i === 0 ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-orange-400/40' :
                          i === 1 ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-emerald-400/40' :
                                    'bg-gradient-to-br from-blue-400 to-cyan-500 text-white shadow-blue-400/40'
                        ]">
                          <i :class="stat.icon"></i>
                        </div>
                        <span :class="['text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg',
                          i === 0 ? (isDarkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600') :
                          i === 1 ? (isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600') :
                                    (isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600')
                        ]">Live</span>
                      </div>
                      <p :class="['text-4xl font-black mb-1', isDarkMode ? 'text-white' : 'text-slate-800']">{{ stat.value }}</p>
                      <p class="text-slate-500 text-sm font-semibold">{{ stat.title }}</p>
                      <div :class="['absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity',
                        i === 0 ? 'bg-orange-400' : i === 1 ? 'bg-emerald-400' : 'bg-blue-400'
                      ]"></div>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-8 mt-4">
                      <div :class="['p-7 rounded-3xl transition-all duration-300 shadow-lg', isDarkMode ? 'bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 shadow-black/20' : 'bg-white/80 backdrop-blur-xl border border-blue-100 shadow-blue-500/5']">
                          <h3 :class="['text-lg font-extrabold mb-6 flex items-center', isDarkMode ? 'text-slate-200' : 'text-slate-800']">
                              <div class="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mr-3"><i class="fa-solid fa-hourglass-end"></i></div>
                              {{ t('pendingApproval') }}
                          </h3>
                          <div class="space-y-4">
                              <div v-if="pendingTickets.length === 0" class="text-center py-8 text-slate-500 dark:text-slate-400 font-medium">
                                  <div :class="['w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3', isDarkMode ? 'bg-slate-800' : 'bg-slate-100']"><i :class="['fa-solid fa-inbox text-2xl', isDarkMode ? 'text-slate-500' : 'text-slate-400']"></i></div>
                                  {{ t('noPending') }}
                              </div>
                              <TransitionGroup name="list" tag="div" class="space-y-4">
                                  <div v-for="ticket in pendingTickets" :key="ticket.id" :class="['p-4 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:shadow-md', isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100 shadow-sm']">
                                      <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-400 to-red-500 rounded-l-2xl"></div>
                                      <div class="pl-2">
                                          <p :class="['font-bold text-lg', isDarkMode ? 'text-slate-200' : 'text-slate-800']">{{ ticket.profileName || ticket.patientName }}</p>
                                          <div class="flex items-center gap-3 mt-2 text-xs font-medium">
                                              <span class="flex items-center text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md"><i class="fa-regular fa-clock mr-1.5"></i>{{ ticket.time }}</span>
                                              <span class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">{{ ticket.dept }}</span>
                                          </div>
                                      </div>
                                  </div>
                              </TransitionGroup>
                          </div>
                      </div>

                      <div :class="['p-7 rounded-3xl transition-all duration-300 shadow-lg', isDarkMode ? 'bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 shadow-black/20' : 'bg-white/80 backdrop-blur-xl border border-green-100 shadow-green-500/5']">
                          <h3 :class="['text-lg font-extrabold mb-6 flex items-center', isDarkMode ? 'text-slate-200' : 'text-slate-800']">
                              <div class="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mr-3"><i class="fa-solid fa-calendar-check"></i></div>
                              {{ t('todayTickets') }}
                          </h3>
                          <div class="space-y-4">
                              <div v-if="todayTickets.length === 0" class="text-center py-8 text-slate-500 dark:text-slate-400 font-medium">
                                  <div :class="['w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3', isDarkMode ? 'bg-slate-800' : 'bg-slate-100']"><i :class="['fa-solid fa-calendar text-2xl', isDarkMode ? 'text-slate-500' : 'text-slate-400']"></i></div>
                                  {{ t('noToday') }}
                              </div>
                              <TransitionGroup name="list" tag="div" class="space-y-4">
                                  <div v-for="ticket in todayTickets" :key="ticket.id" :class="['p-4 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:shadow-md', isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100 shadow-sm']">
                                      <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-green-400 to-emerald-500 rounded-l-2xl"></div>
                                      <div class="pl-2">
                                          <p :class="['font-bold text-lg', isDarkMode ? 'text-slate-200' : 'text-slate-800']">{{ ticket.profileName || ticket.patientName }}</p>
                                          <div class="flex items-center gap-3 mt-2 text-xs font-medium">
                                              <span class="flex items-center text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md"><i class="fa-regular fa-clock mr-1.5"></i>{{ ticket.time }}</span>
                                              <span class="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">{{ ticket.dept }}</span>
                                          </div>
                                      </div>
                                  </div>
                              </TransitionGroup>
                          </div>
                      </div>
                  </div>
              </div>

              <div v-else-if="currentMenu === 'approvals'" class="space-y-6" key="approvals">
                  <div :class="['p-8 rounded-3xl shadow-xl transition-all duration-300', isDarkMode ? 'bg-slate-800/80 backdrop-blur-xl border border-slate-700 shadow-black/20' : 'bg-white/90 backdrop-blur-xl border border-slate-100 shadow-slate-200/50']">
                      <h3 :class="['text-xl font-extrabold mb-6 pb-4 border-b flex items-center', isDarkMode ? 'text-white border-slate-700' : 'border-slate-100 text-slate-800']">
                          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-400 to-red-500 text-white flex items-center justify-center mr-4 shadow-lg shadow-orange-500/30"><i class="fa-solid fa-clipboard-list"></i></div>
                          {{ t('listPending') }}
                      </h3>
                      
                      <div v-if="pendingTickets.length === 0" class="text-center py-16">
                          <div class="w-24 h-24 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
                              <i class="fa-solid fa-check-double text-5xl text-green-500"></i>
                          </div>
                          <p class="text-slate-500 text-xl font-bold">{{ t('allApproved') }} 🎉</p>
                      </div>

                      <TransitionGroup name="list" tag="div" class="space-y-5" v-else>
                          <div v-for="ticket in pendingTickets" :key="ticket.id" :class="['border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group', isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-orange-500/50' : 'bg-white border-slate-100 hover:border-orange-200']">
                              <div class="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500"></div>
                              <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                  <div class="md:col-span-4 flex items-center gap-4">
                                      <div class="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold text-xl">{{ (ticket.profileName || ticket.patientName || 'N').charAt(0) }}</div>
                                      <div>
                                          <p class="text-[10px] text-slate-400 uppercase font-black tracking-wider">{{ t('patient') }}</p>
                                          <p :class="['text-xl font-extrabold mt-0.5', isDarkMode ? 'text-white' : 'text-slate-800']">{{ ticket.profileName || ticket.patientName }}</p>
                                          <p class="text-sm text-slate-500 mt-1 font-medium"><i class="fa-solid fa-phone mr-1.5 opacity-70"></i>{{ ticket.profilePhone || ticket.phone }}</p>
                                      </div>
                                  </div>

                                  <div class="md:col-span-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                                      <p class="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">{{ t('details') }}</p>
                                      <p :class="['text-sm font-bold flex items-center gap-2', isDarkMode ? 'text-slate-200' : 'text-slate-700']"><i class="fa-regular fa-calendar-days text-blue-500"></i> {{ ticket.date }} <span class="text-slate-300 dark:text-slate-600">|</span> <i class="fa-regular fa-clock text-blue-500"></i> {{ ticket.time }}</p>
                                      <p class="text-sm text-blue-600 font-bold mt-1.5 bg-blue-100/50 dark:bg-blue-900/20 inline-block px-2.5 py-0.5 rounded-md">{{ ticket.dept }}</p>
                                  </div>

                                  <div class="md:col-span-4">
                                      <p class="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-2 text-right hidden md:block">{{ t('action') }}</p>
                                      <div class="flex gap-3 mt-1 justify-end">
                                          <button @click="rejectTicket(ticket)" class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 active:scale-95 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:hover:bg-red-600">
                                              <i class="fa-solid fa-times mr-1"></i>{{ t('reject') }}
                                          </button>
                                          <button @click="approveTicket(ticket)" class="flex-1 max-w-[140px] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 active:scale-95 shadow-lg shadow-green-500/30">
                                              <i class="fa-solid fa-check mr-1.5"></i>{{ t('approve') }}
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </TransitionGroup>
                  </div>
              </div>

              <div v-else-if="currentMenu === 'completed'" class="space-y-6" key="completed">
                  <div :class="['p-8 rounded-3xl shadow-xl transition-all duration-300', isDarkMode ? 'bg-slate-800/80 backdrop-blur-xl border border-slate-700 shadow-black/20' : 'bg-white/90 backdrop-blur-xl border border-slate-100 shadow-slate-200/50']">
                      <h3 :class="['text-xl font-extrabold mb-8 pb-4 border-b flex items-center', isDarkMode ? 'text-white border-slate-700' : 'border-slate-100 text-slate-800']">
                          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-500 text-white flex items-center justify-center mr-4 shadow-lg shadow-blue-500/30"><i class="fa-solid fa-users-medical"></i></div>
                          {{ t('patientList') }}
                      </h3>
                      
                      <div class="mb-10">
                          <h4 class="font-black text-blue-500 mb-4 text-sm uppercase tracking-widest flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> {{ t('waitingCheckup') }}</h4>
                          <div v-if="activeTickets.filter(t => t.status === 'Chờ khám').length === 0" :class="['text-center py-8 text-slate-400 rounded-2xl border border-dashed', isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200']">
                              <p class="font-medium">{{ t('noWaitingCheckup') }}</p>
                          </div>
                          <TransitionGroup name="list" tag="div" class="space-y-4" v-else>
                              <div v-for="ticket in activeTickets.filter(t => t.status === 'Chờ khám')" :key="ticket.id" :class="['border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-md', isDarkMode ? 'bg-blue-900/10 border-blue-900/30' : 'border-blue-100 bg-blue-50/50']">
                                  <div class="flex items-center gap-4">
                                      <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center font-bold text-lg shadow-inner"><i class="fa-solid fa-user"></i></div>
                                      <div>
                                          <p :class="['font-extrabold text-lg', isDarkMode ? 'text-white' : 'text-slate-800']">{{ ticket.profileName || ticket.patientName }}</p>
                                          <div class="flex items-center gap-3 mt-1 text-xs font-medium text-slate-500">
                                              <span class="bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm border dark:border-slate-700"><i class="fa-regular fa-clock text-blue-500 mr-1"></i>{{ ticket.time }}</span>
                                              <span class="bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm border dark:border-slate-700"><i class="fa-solid fa-stethoscope text-blue-500 mr-1"></i>{{ ticket.dept }}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <button @click="completeCheckup(ticket)" class="w-full md:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                                      <i class="fa-solid fa-check-double"></i>{{ t('checkupDone') }}
                                  </button>
                              </div>
                          </TransitionGroup>
                      </div>

                      <div>
                          <h4 class="font-black text-emerald-500 mb-4 text-sm uppercase tracking-widest flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-emerald-500"></div> {{ t('alreadyChecked') }}</h4>
                          <div v-if="completedTickets.length === 0" :class="['text-center py-8 text-slate-400 rounded-2xl border border-dashed', isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200']">
                              <p class="font-medium">{{ t('noAlreadyChecked') }}</p>
                          </div>
                          <TransitionGroup name="list" tag="div" class="grid grid-cols-1 md:grid-cols-2 gap-4" v-else>
                              <div v-for="ticket in completedTickets" :key="ticket.id" :class="['border rounded-2xl p-5 transition-all hover:shadow-md', isDarkMode ? 'bg-emerald-900/10 border-emerald-900/30' : 'border-emerald-100 bg-emerald-50/30']">
                                  <div class="flex justify-between items-start">
                                      <div>
                                          <p :class="['font-extrabold', isDarkMode ? 'text-white' : 'text-slate-800']">{{ ticket.profileName || ticket.patientName }}</p>
                                          <p class="text-xs text-slate-500 mt-2 flex items-center gap-2"><i class="fa-regular fa-calendar-check text-emerald-500"></i>{{ ticket.date }}</p>
                                      </div>
                                      <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center text-lg"><i class="fa-solid fa-check"></i></div>
                                  </div>
                              </div>
                          </TransitionGroup>
                      </div>
                  </div>
              </div>

              <div v-else-if="currentMenu === 'documents'" class="space-y-6" key="documents">
                  <div :class="['p-8 rounded-3xl shadow-xl transition-all duration-300', isDarkMode ? 'bg-slate-800/80 backdrop-blur-xl border border-slate-700 shadow-black/20' : 'bg-white/90 backdrop-blur-xl border border-slate-100 shadow-slate-200/50']">
                      <h3 :class="['text-xl font-extrabold mb-8 pb-4 border-b flex items-center', isDarkMode ? 'text-white border-slate-700' : 'border-slate-100 text-slate-800']">
                          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center mr-4 shadow-lg shadow-purple-500/30"><i class="fa-solid fa-file-medical"></i></div>
                          {{ t('emr') }}
                      </h3>
                      
                      <div v-if="medicalRecords.length === 0" class="text-center py-16">
                          <div class="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                              <i class="fa-solid fa-folder-open text-5xl text-slate-300 dark:text-slate-600"></i>
                          </div>
                          <p class="text-slate-500 text-xl font-bold">{{ t('noEmr') }}</p>
                      </div>

                      <TransitionGroup name="list" tag="div" class="space-y-6" v-else>
                          <div v-for="record in medicalRecords" :key="record.id" :class="['border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group', isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-purple-500/50' : 'bg-white border-slate-100 hover:border-purple-200']">
                              <div class="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500"></div>
                              <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                                  <div class="flex items-center gap-4">
                                      <div class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 font-bold flex items-center justify-center shadow-inner"><i class="fa-solid fa-user-injured"></i></div>
                                      <div>
                                          <p :class="['font-extrabold text-xl', isDarkMode ? 'text-white' : 'text-slate-800']">{{ record.patientName }}</p>
                                          <p class="text-xs text-slate-500 mt-1 font-medium flex items-center gap-3">
                                              <span class="flex items-center"><i class="fa-solid fa-calendar text-purple-500 mr-1.5"></i>{{ record.date }}</span>
                                              <span class="flex items-center"><i class="fa-solid fa-stethoscope text-purple-500 mr-1.5"></i>{{ record.dept }}</span>
                                          </p>
                                      </div>
                                  </div>
                                  <span class="mt-4 md:mt-0 text-xs font-black tracking-widest bg-purple-100 dark:bg-purple-900/30 text-purple-600 px-4 py-2 rounded-xl shadow-sm">{{ record.id }}</span>
                              </div>

                              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div :class="['p-4 rounded-xl border transition-colors', isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-50 border-slate-100']">
                                      <p :class="['text-[10px] uppercase font-black tracking-wider mb-2 text-slate-400']"><i class="fa-solid fa-microscope text-blue-500 mr-1"></i>{{ t('diagnosis') }}</p>
                                      <p :class="['font-medium', isDarkMode ? 'text-slate-300' : 'text-slate-700']">{{ record.diagnosis }}</p>
                                  </div>
                                  <div :class="['p-4 rounded-xl border transition-colors', isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-50 border-slate-100']">
                                      <p :class="['text-[10px] uppercase font-black tracking-wider mb-2 text-slate-400']"><i class="fa-solid fa-pills text-green-500 mr-1"></i>{{ t('prescription') }}</p>
                                      <p :class="['font-medium', isDarkMode ? 'text-slate-300' : 'text-slate-700']">{{ record.prescription }}</p>
                                  </div>
                                  <div :class="['p-4 rounded-xl border transition-colors', isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-50 border-slate-100']">
                                      <p :class="['text-[10px] uppercase font-black tracking-wider mb-2 text-slate-400']"><i class="fa-solid fa-pen-to-square text-orange-500 mr-1"></i>{{ t('notes') }}</p>
                                      <p :class="['font-medium', isDarkMode ? 'text-slate-300' : 'text-slate-700']">{{ record.notes }}</p>
                                  </div>
                              </div>
                          </div>
                      </TransitionGroup>
                  </div>
              </div>

              <div v-else-if="currentMenu === 'medications'" class="space-y-6" key="medications">
                  <div :class="['p-8 rounded-3xl shadow-xl transition-all duration-300', isDarkMode ? 'bg-slate-800/80 backdrop-blur-xl border border-slate-700 shadow-black/20' : 'bg-white/90 backdrop-blur-xl border border-slate-100 shadow-slate-200/50']">
                      <h3 :class="['text-xl font-extrabold mb-8 pb-4 border-b flex items-center', isDarkMode ? 'text-white border-slate-700' : 'border-slate-100 text-slate-800']">
                          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center mr-4 shadow-lg shadow-pink-500/30"><i class="fa-solid fa-prescription-bottle-medical"></i></div>
                          {{ t('manageRx') }}
                      </h3>
                      
                      <div v-if="prescriptions.length === 0" class="text-center py-16">
                          <div class="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                              <i class="fa-solid fa-pills text-5xl text-slate-300 dark:text-slate-600"></i>
                          </div>
                          <p class="text-slate-500 text-xl font-bold">{{ t('noRx') }}</p>
                      </div>

                      <TransitionGroup name="list" tag="div" class="space-y-6" v-else>
                          <div v-for="rx in prescriptions" :key="rx.id" :class="['border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group', isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-pink-500/50' : 'bg-white border-slate-100 hover:border-pink-200']">
                              <div class="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500"></div>
                              <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                                  <div class="flex items-center gap-4">
                                      <div class="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 font-bold flex items-center justify-center shadow-inner text-xl"><i class="fa-solid fa-file-prescription"></i></div>
                                      <div>
                                          <p :class="['font-extrabold text-xl', isDarkMode ? 'text-white' : 'text-slate-800']">{{ rx.patientName }}</p>
                                          <p class="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2">
                                              <i class="fa-regular fa-calendar-days text-pink-500"></i>{{ rx.date }}
                                          </p>
                                      </div>
                                  </div>
                                  <span class="mt-4 md:mt-0 text-xs font-black tracking-widest bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-pink-500/30">RX-{{ rx.id }}</span>
                              </div>

                              <div :class="['rounded-2xl border overflow-hidden transition-colors', isDarkMode ? 'border-slate-700/50 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50']">
                                  <table class="w-full text-sm">
                                      <thead :class="isDarkMode ? 'bg-slate-800/80 border-b border-slate-700' : 'bg-slate-100/80 border-b border-slate-200'">
                                          <tr>
                                              <th :class="['p-4 text-left font-extrabold uppercase text-[10px] tracking-wider', isDarkMode ? 'text-slate-400' : 'text-slate-500']">{{ t('medName') }}</th>
                                              <th :class="['p-4 text-center font-extrabold uppercase text-[10px] tracking-wider', isDarkMode ? 'text-slate-400' : 'text-slate-500']">{{ t('quantity') }}</th>
                                              <th :class="['p-4 text-left font-extrabold uppercase text-[10px] tracking-wider', isDarkMode ? 'text-slate-400' : 'text-slate-500']">{{ t('usage') }}</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          <tr v-for="(med, idx) in rx.medicines" :key="idx" :class="['border-t transition-colors', isDarkMode ? 'border-slate-800/50 hover:bg-slate-800/80' : 'border-slate-100 hover:bg-white']">
                                              <td :class="['p-4 font-bold flex items-center gap-3', isDarkMode ? 'text-slate-200' : 'text-slate-700']">
                                                  <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs"><i class="fa-solid fa-capsules text-slate-500"></i></div>
                                                  {{ med.name }}
                                              </td>
                                              <td class="p-4 text-center">
                                                  <span class="bg-slate-700 text-white px-2.5 py-1 rounded-md font-bold text-xs shadow-sm">{{ med.quantity }}</span>
                                              </td>
                                              <td :class="['p-4 font-medium italic', isDarkMode ? 'text-slate-400' : 'text-slate-500']">{{ med.usage }}</td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </div>

                              <div class="mt-6 flex flex-col md:flex-row gap-3">
                                  <button @click="downloadPrescription(rx)" class="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 shadow-sm flex items-center justify-center gap-2">
                                      <i class="fa-solid fa-download"></i>{{ t('download') }}
                                  </button>
                                  <button @click="printPrescription(rx)" class="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                                      <i class="fa-solid fa-print"></i>{{ t('print') }}
                                  </button>
                              </div>
                          </div>
                      </TransitionGroup>
                  </div>
              </div>

              <div v-else-if="currentMenu === 'settings'" class="max-w-3xl mx-auto space-y-6" key="settings">
                  <div :class="['p-8 rounded-3xl shadow-xl transition-all duration-300', isDarkMode ? 'bg-slate-800/80 backdrop-blur-xl border border-slate-700 shadow-black/20' : 'bg-white/90 backdrop-blur-xl border border-slate-100 shadow-slate-200/50']">
                      <h3 :class="['text-xl font-extrabold mb-8 border-b pb-6 flex items-center', isDarkMode ? 'text-white border-slate-700' : 'border-slate-100 text-slate-800']">
                          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-600 to-slate-800 text-white flex items-center justify-center mr-4 shadow-lg shadow-slate-500/30"><i class="fa-solid fa-sliders"></i></div>
                          {{ t('sysSettings') }}
                      </h3>
                      
                      <div class="space-y-8">
                          <!-- Language Setting -->
                          <div class="flex items-center justify-between p-6 rounded-2xl transition-colors border hover:shadow-md" :class="isDarkMode ? 'bg-slate-900/50 border-slate-700 hover:border-blue-500/30' : 'bg-slate-50 border-slate-100 hover:border-blue-200'">
                              <div>
                                  <p :class="['font-extrabold text-lg flex items-center', isDarkMode ? 'text-white' : 'text-slate-800']">
                                      <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center mr-3"><i class="fa-solid fa-earth-americas"></i></div>
                                      {{ t('language') }}
                                  </p>
                                  <p class="text-sm text-slate-500 mt-2 pl-14">Thay đổi ngôn ngữ hiển thị của toàn bộ hệ thống</p>
                              </div>
                              <select v-model="currentLang" :class="['border-2 rounded-xl px-5 py-3 w-48 font-bold focus:outline-none transition-all shadow-sm cursor-pointer appearance-none text-center', isDarkMode ? 'bg-slate-800 border-slate-600 text-white focus:border-blue-500 hover:border-blue-400' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 hover:border-blue-300']">
                                  <option value="vi">🇻🇳 Tiếng Việt</option>
                                  <option value="en">🇺🇸 English</option>
                              </select>
                          </div>

                          <!-- Theme Setting -->
                          <div class="flex items-center justify-between p-6 rounded-2xl transition-colors border hover:shadow-md" :class="isDarkMode ? 'bg-slate-900/50 border-slate-700 hover:border-indigo-500/30' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'">
                              <div>
                                  <p :class="['font-extrabold text-lg flex items-center', isDarkMode ? 'text-white' : 'text-slate-800']">
                                      <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mr-3"><i class="fa-solid fa-palette"></i></div>
                                      {{ t('appearance') }}
                                  </p>
                                  <p class="text-sm text-slate-500 mt-2 pl-14">Chuyển đổi giao diện Sáng / Tối thông minh</p>
                              </div>
                              <div class="flex items-center p-1.5 rounded-2xl shadow-inner border transition-all" :class="isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-slate-300/50'">
                                  <button @click="isDarkMode = false" :class="['px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2', !isDarkMode ? 'bg-white text-blue-600 shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-700']">
                                      <i class="fa-solid fa-sun text-lg"></i> {{ t('lightMode') }}
                                  </button>
                                  <button @click="isDarkMode = true" :class="['px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2', isDarkMode ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 transform scale-105' : 'text-slate-500 hover:text-slate-700']">
                                      <i class="fa-solid fa-moon text-lg"></i> {{ t('darkMode') }}
                                  </button>
                              </div>
                          </div>
                      </div>

                      <div :class="['mt-10 pt-8 border-t flex items-center gap-4', isDarkMode ? 'border-slate-700/50' : 'border-slate-100']">
                          <div class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-500 flex items-center justify-center text-xl"><i class="fa-solid fa-shield-check"></i></div>
                          <div>
                              <p class="font-bold text-green-600 dark:text-green-400 mb-1 flex items-center gap-2">{{ t('sysNormal') }} <span class="relative flex h-2.5 w-2.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span></span></p>
                              <p class="text-slate-500 text-xs font-medium">{{ t('syncDesc') }}</p>
                          </div>
                      </div>
                  </div>
              </div>
              
              <div v-else-if="currentMenu === 'messages'" class="absolute inset-0" key="messages">
                  <PatientDoctorChat />
              </div>
              </Transition>
          </div>
      </main>

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
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
.toast-enter-active { animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { animation: slideOutRight 0.3s ease-in-out; }
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(100px) scale(0.9); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}
@keyframes slideOutRight {
  from { opacity: 1; transform: translateX(0) scale(1); }
  to { opacity: 0; transform: translateX(100px) scale(0.9); }
}
</style>
