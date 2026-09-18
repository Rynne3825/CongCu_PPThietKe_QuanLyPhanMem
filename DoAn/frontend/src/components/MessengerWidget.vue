<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';

// Khai báo prop 'role' để biết ai đang dùng (bác sĩ hay bệnh nhân)
const props = defineProps({
    role: {
        type: String,
        default: 'patient' // 'patient' hoặc 'doctor'
    }
});

const isChatOpen = ref(false);
const chatInput = ref('');
const chatBodyRef = ref(null);

// ================ LOGIC ĐỒNG BỘ TIN NHẮN REAL-TIME ================
const loadChatHistory = () => {
    try {
        const saved = localStorage.getItem('medi_live_chat');
        return saved ? JSON.parse(saved) : [
            { sender: 'system', text: 'Hệ thống kết nối thành công. Bạn có thể bắt đầu trò chuyện.' }
        ];
    } catch (e) {
        return [];
    }
};

const messages = ref(loadChatHistory());

// Lắng nghe sự kiện storage để đồng bộ giữa 2 tab (Bác sĩ <-> Bệnh nhân)
const handleStorageChange = (e) => {
    if (e.key === 'medi_live_chat') {
        messages.value = JSON.parse(e.newValue);
        scrollToBottom();
    }
};

onMounted(() => {
    window.addEventListener('storage', handleStorageChange);
});

onUnmounted(() => {
    window.removeEventListener('storage', handleStorageChange);
    endCall(); // Tắt camera nếu đang gọi mà đổi trang
});

const scrollToBottom = async () => {
    await nextTick();
    if (chatBodyRef.value) {
        chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight;
    }
};

const sendMessage = () => {
    if (!chatInput.value.trim()) return;
    
    messages.value.push({
        sender: props.role,
        text: chatInput.value,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    });
    
    // Lưu vào LocalStorage để tab bên kia nhận được
    localStorage.setItem('medi_live_chat', JSON.stringify(messages.value));
    chatInput.value = '';
    scrollToBottom();
};

// ================ LOGIC GỌI VIDEO & AUDIO (WEBRTC MÔ PHỎNG) ================
const callState = ref('none'); // 'none', 'ringing', 'connected'
const isVideoCall = ref(false);
const localVideoRef = ref(null);
const localStream = ref(null);

const startCall = async (videoMode = false) => {
    isVideoCall.value = videoMode;
    callState.value = 'ringing';
    
    if (videoMode) {
        try {
            // Xin quyền mở Camera và Mic thật của máy tính
            localStream.value = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setTimeout(() => {
                if (localVideoRef.value) localVideoRef.value.srcObject = localStream.value;
            }, 100);
        } catch (e) {
            alert('Không thể truy cập Camera. Chuyển sang gọi thoại.');
            isVideoCall.value = false;
        }
    }

    // Mô phỏng đầu dây bên kia bắt máy sau 3 giây
    setTimeout(() => {
        if (callState.value === 'ringing') {
            callState.value = 'connected';
            messages.value.push({
                sender: 'system',
                text: `${props.role === 'patient' ? 'Bác sĩ' : 'Bệnh nhân'} đã bắt đầu cuộc gọi ${videoMode ? 'Video' : 'Thoại'}.`
            });
            localStorage.setItem('medi_live_chat', JSON.stringify(messages.value));
            scrollToBottom();
        }
    }, 3000);
};

const endCall = () => {
    if (callState.value !== 'none') {
        messages.value.push({ sender: 'system', text: 'Cuộc gọi đã kết thúc.' });
        localStorage.setItem('medi_live_chat', JSON.stringify(messages.value));
        scrollToBottom();
    }
    
    callState.value = 'none';
    if (localStream.value) {
        // Tắt đèn camera
        localStream.value.getTracks().forEach(track => track.stop());
        localStream.value = null;
    }
};

const clearChat = () => {
    if(confirm('Xóa toàn bộ lịch sử trò chuyện?')) {
        messages.value = [{ sender: 'system', text: 'Đã xóa lịch sử trò chuyện.' }];
        localStorage.setItem('medi_live_chat', JSON.stringify(messages.value));
    }
};
</script>

<template>
  <div class="fixed bottom-6 left-6 z-[100] flex flex-col items-start">
      <transition name="chat-slide">
          <div v-if="isChatOpen" class="bg-white w-80 sm:w-[350px] h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 mb-4 origin-bottom-left">
              <div class="bg-gradient-to-r from-blue-600 to-blue-700 p-3 flex justify-between items-center text-white shadow-md z-10">
                  <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/50 relative">
                          <i :class="role === 'patient' ? 'fa-solid fa-user-doctor' : 'fa-solid fa-user'" class="text-white"></i>
                          <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-blue-600 rounded-full"></span>
                      </div>
                      <div>
                          <p class="font-bold text-sm">{{ role === 'patient' ? 'BS. Hỗ trợ trực tuyến' : 'Bệnh Nhân' }}</p>
                          <p class="text-[10px] text-blue-100 opacity-80">Đang hoạt động</p>
                      </div>
                  </div>
                  <div class="flex items-center space-x-3 text-lg">
                      <button @click="startCall(false)" class="hover:text-gray-300 transition"><i class="fa-solid fa-phone"></i></button>
                      <button @click="startCall(true)" class="hover:text-gray-300 transition"><i class="fa-solid fa-video"></i></button>
                      <div class="w-px h-4 bg-white/30 mx-1"></div>
                      <button @click="isChatOpen = false" class="hover:text-gray-300 transition"><i class="fa-solid fa-minus"></i></button>
                  </div>
              </div>
              
              <div ref="chatBodyRef" class="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3 custom-scrollbar">
                  <div v-for="(msg, i) in messages" :key="i" 
                       :class="['flex flex-col', msg.sender === 'system' ? 'items-center' : msg.sender === role ? 'items-end' : 'items-start']">
                      
                      <span v-if="msg.sender === 'system'" class="bg-gray-200 text-gray-500 text-[10px] px-3 py-1 rounded-full my-1">
                          {{ msg.text }}
                      </span>
                      
                      <div v-else :class="['max-w-[75%] rounded-2xl p-3 text-sm shadow-sm relative group', 
                                  msg.sender === role ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm']">
                          <p style="word-wrap: break-word;">{{ msg.text }}</p>
                          <p :class="['text-[9px] mt-1 opacity-70 text-right', msg.sender === role ? 'text-blue-100' : 'text-gray-400']">{{ msg.time }}</p>
                      </div>
                  </div>
              </div>

              <div class="p-3 bg-white border-t border-gray-100 flex items-center space-x-2">
                  <button @click="clearChat" class="text-gray-400 hover:text-red-500 transition px-2"><i class="fa-solid fa-trash-can"></i></button>
                  <input v-model="chatInput" @keyup.enter="sendMessage" type="text" placeholder="Aa" 
                         class="flex-1 bg-gray-100 rounded-full px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm">
                  <button @click="sendMessage" class="text-blue-600 text-xl hover:text-blue-800 transition px-2"><i class="fa-solid fa-paper-plane"></i></button>
              </div>
          </div>
      </transition>

      <button v-show="!isChatOpen" @click="isChatOpen = true" 
              class="w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl hover:bg-blue-700 transition transform hover:scale-110 animate-bounce-slow relative">
          <i class="fa-brands fa-facebook-messenger"></i>
          <span class="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
      </button>

      <div v-if="callState !== 'none'" class="fixed inset-0 bg-slate-900/95 z-[200] flex flex-col items-center justify-center text-white backdrop-blur-sm">
          
          <div v-if="isVideoCall" class="absolute inset-0 flex items-center justify-center overflow-hidden z-0">
               <div class="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center">
                   <div class="w-32 h-32 bg-slate-700 rounded-full flex items-center justify-center mb-4 border-4 border-slate-600">
                       <i :class="role === 'patient' ? 'fa-solid fa-user-doctor' : 'fa-solid fa-user'" class="text-6xl text-slate-500"></i>
                   </div>
                   <p v-if="callState === 'ringing'" class="text-xl animate-pulse">Đang đổ chuông...</p>
               </div>
               
               <video ref="localVideoRef" autoplay muted playsinline class="absolute bottom-8 right-8 w-48 h-64 bg-black object-cover rounded-xl border-2 border-white shadow-2xl"></video>
          </div>

          <div class="z-10 flex flex-col items-center mt-[-10vh]">
              <div v-if="!isVideoCall" class="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(37,99,235,0.5)]">
                  <i :class="role === 'patient' ? 'fa-solid fa-user-doctor' : 'fa-solid fa-user'" class="text-6xl text-white"></i>
              </div>
              <h2 class="text-3xl font-bold mb-2">{{ role === 'patient' ? 'BS. Hỗ trợ' : 'Bệnh Nhân' }}</h2>
              <p class="text-lg opacity-80" :class="{'animate-pulse': callState === 'ringing'}">
                  {{ callState === 'ringing' ? 'Đang kết nối...' : '00:01' }}
              </p>
          </div>

          <div class="absolute bottom-16 flex space-x-6 z-10">
              <button v-if="isVideoCall" class="w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-2xl backdrop-blur-md transition">
                  <i class="fa-solid fa-video-slash"></i>
              </button>
              <button class="w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-2xl backdrop-blur-md transition">
                  <i class="fa-solid fa-microphone-slash"></i>
              </button>
              <button @click="endCall" class="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(220,38,38,0.6)] transition transform hover:scale-110">
                  <i class="fa-solid fa-phone-slash"></i>
              </button>
          </div>
      </div>
  </div>
</template>

<style scoped>
.animate-bounce-slow {
    animation: bounce 3s infinite;
}
.chat-slide-enter-active, .chat-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.chat-slide-enter-from, .chat-slide-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(20px) translateX(-20px);
}
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>     