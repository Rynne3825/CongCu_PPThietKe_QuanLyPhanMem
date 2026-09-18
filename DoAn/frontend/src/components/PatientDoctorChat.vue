<template>
  <div class="flex h-full w-full overflow-hidden bg-slate-50 relative">

    <!-- =========================================================
         VIDEO CALL FULLSCREEN OVERLAY
    ========================================================== -->
    <Transition name="call-fade">
    <div v-if="isInCall" class="fixed inset-0 z-[200] bg-slate-900 flex flex-col overflow-hidden">

      <!-- Remote video (full screen) -->
      <video
        ref="remoteVideoEl"
        autoplay
        playsinline
        class="absolute inset-0 w-full h-full object-cover"
        :class="activeCallType === 'audio' ? 'hidden' : ''"
      ></video>

      <!-- Audio-only background -->
      <div v-if="activeCallType === 'audio'" class="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center">
        <div class="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-5xl font-black shadow-2xl mb-5">
          {{ selectedChat?.name?.charAt(0) }}
        </div>
        <p class="text-white text-2xl font-bold">{{ selectedChat?.name }}</p>
        <p class="text-slate-400 mt-2 text-sm">Gọi thoại đang diễn ra</p>
      </div>

      <!-- Local video (picture-in-picture góc trên phải) -->
      <div v-if="activeCallType === 'video'" class="absolute top-4 right-4 w-36 h-24 sm:w-48 sm:h-32 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl z-10">
        <video ref="localVideoEl" autoplay playsinline muted class="w-full h-full object-cover scale-x-[-1]"></video>
        <div v-if="!isCameraOn" class="absolute inset-0 bg-slate-800 flex items-center justify-center">
          <i class="fa-solid fa-video-slash text-slate-400 text-xl"></i>
        </div>
      </div>

      <!-- Overlay info bar top -->
      <div class="relative z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/50 to-transparent">
        <div>
          <p class="text-white font-bold text-lg">{{ selectedChat?.name }}</p>
          <p class="text-emerald-400 text-sm font-semibold flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
            {{ formatDuration(callDuration) }}
          </p>
        </div>
        <span class="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
          {{ activeCallType === 'video' ? '📹 Video Call' : '🔊 Gọi thoại' }}
        </span>
      </div>

      <!-- Controls bar bottom -->
      <div class="relative z-10 mt-auto px-6 py-6 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-center gap-4">
        <!-- Mute -->
        <button
          @click="toggleMute"
          :class="['w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-all shadow-lg', isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm']"
          :title="isMuted ? 'Bỏ tắt micro' : 'Tắt micro'"
        >
          <i :class="isMuted ? 'fa-solid fa-microphone-slash' : 'fa-solid fa-microphone'"></i>
        </button>

        <!-- Camera (chỉ hiện khi video call) -->
        <button
          v-if="activeCallType === 'video'"
          @click="toggleCamera"
          :class="['w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-all shadow-lg', !isCameraOn ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm']"
          :title="isCameraOn ? 'Tắt camera' : 'Bật camera'"
        >
          <i :class="isCameraOn ? 'fa-solid fa-video' : 'fa-solid fa-video-slash'"></i>
        </button>

        <!-- Kết thúc -->
        <button
          @click="endCall"
          class="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-2xl shadow-xl shadow-red-500/40 transition-all transform hover:scale-105"
          title="Kết thúc"
        >
          <i class="fa-solid fa-phone-slash"></i>
        </button>
      </div>
    </div>
    </Transition>

    <!-- =========================================================
         INCOMING CALL MODAL
    ========================================================== -->
    <Transition name="modal-pop">
    <div v-if="incomingCallSignal" class="fixed inset-0 z-[190] bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div class="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
        <!-- Pulse avatar -->
        <div class="relative w-24 h-24 mx-auto mb-5">
          <div class="absolute inset-0 rounded-full animate-ping opacity-30"
            :class="incomingCallSignal.callType === 'video' ? 'bg-blue-400' : 'bg-emerald-400'"></div>
          <div class="w-full h-full rounded-full flex items-center justify-center text-white text-3xl font-black shadow-xl relative z-10"
            :class="incomingCallSignal.callType === 'video' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'">
            {{ incomingCallerName.charAt(0) }}
          </div>
        </div>
        <p class="text-slate-500 text-sm font-semibold mb-1">Cuộc gọi đến</p>
        <h3 class="text-2xl font-black text-slate-800 mb-1">{{ incomingCallerName }}</h3>
        <p class="text-slate-500 text-sm mb-8">{{ incomingCallSignal.callType === 'video' ? '📹 Gọi video' : '🔊 Gọi thoại' }}</p>
        <div class="flex gap-3">
          <button @click="acceptIncomingCall"
            class="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/30 transition-all">
            <i class="fa-solid fa-phone mr-2"></i>Trả lời
          </button>
          <button @click="declineIncomingCall"
            class="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all">
            <i class="fa-solid fa-phone-slash mr-2"></i>Từ chối
          </button>
        </div>
      </div>
    </div>
    </Transition>

    <!-- =========================================================
         OUTGOING CALL MODAL
    ========================================================== -->
    <Transition name="modal-pop">
    <div v-if="isCallingOut" class="fixed inset-0 z-[190] bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div class="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
        <div class="relative w-24 h-24 mx-auto mb-5">
          <div class="absolute inset-0 rounded-full animate-ping opacity-30"
            :class="outgoingCallType === 'video' ? 'bg-blue-400' : 'bg-emerald-400'"></div>
          <div class="w-full h-full rounded-full flex items-center justify-center text-white text-3xl font-black shadow-xl relative z-10"
            :class="outgoingCallType === 'video' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'">
            {{ selectedChat?.name?.charAt(0) }}
          </div>
        </div>
        <p class="text-slate-500 text-sm font-semibold mb-1">{{ outgoingCallType === 'video' ? '📹 Đang gọi video...' : '🔊 Đang gọi thoại...' }}</p>
        <h3 class="text-2xl font-black text-slate-800 mb-6">{{ selectedChat?.name }}</h3>
        <p class="text-slate-400 text-xs mb-6 animate-pulse">Đang chờ phía bên kia bắt máy...</p>
        <button @click="cancelOutgoingCall"
          class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all">
          <i class="fa-solid fa-phone-slash mr-2"></i>Hủy
        </button>
      </div>
    </div>
    </Transition>

    <!-- =========================================================
         ERROR TOAST
    ========================================================== -->
    <Transition name="toast-slide">
    <div v-if="errorMsg" class="fixed top-6 left-1/2 -translate-x-1/2 z-[210] bg-red-500 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2">
      <i class="fa-solid fa-circle-exclamation"></i>
      {{ errorMsg }}
    </div>
    </Transition>

    <!-- =========================================================
         SIDEBAR
    ========================================================== -->
    <div class="w-72 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col">
      <div class="p-5 border-b border-slate-100 flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl flex items-center justify-center shadow-md">
          <i class="fa-regular fa-comments text-lg"></i>
        </div>
        <h2 class="text-lg font-black text-slate-800">Trò chuyện</h2>
      </div>

      <div class="flex-1 overflow-y-auto">
        <TransitionGroup name="list" tag="div">
          <div
            v-for="chat in chatList"
            :key="chat.user_id"
            @click="selectChat(chat)"
            :class="[
              'flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 border-b border-slate-50 border-l-4',
              selectedChat?.user_id === chat.user_id
                ? 'bg-blue-50 border-l-blue-500'
                : 'hover:bg-slate-50 border-l-transparent'
            ]"
          >
            <div class="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow">
              {{ chat.name.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-slate-800 truncate text-sm">{{ chat.name }}</p>
              <p class="text-xs text-slate-500 truncate mt-0.5">{{ chat.last_message || 'Chưa có tin nhắn' }}</p>
            </div>
            <span v-if="chat.unread_count > 0"
              class="flex-shrink-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {{ chat.unread_count }}
            </span>
          </div>
        </TransitionGroup>
        <div v-if="chatList.length === 0" class="p-6 text-center text-slate-400 text-sm">
          <i class="fa-solid fa-inbox text-3xl mb-3 block"></i>
          Không có cuộc hội thoại nào
        </div>
      </div>
    </div>

    <!-- =========================================================
         MAIN CHAT AREA
    ========================================================== -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <template v-if="selectedChat">
        <!-- Chat Header -->
        <div class="flex-shrink-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md">
              {{ selectedChat.name.charAt(0) }}
            </div>
            <div>
              <h3 class="font-bold text-slate-800">{{ selectedChat.name }}</h3>
              <p class="text-xs text-blue-500 font-semibold uppercase tracking-wide">
                {{ selectedChat.role === 'doctor' ? 'Bác sĩ chuyên khoa' : 'Bệnh nhân' }}
              </p>
            </div>
          </div>

          <div class="flex gap-2">
            <button @click="startAudioCall"
              :disabled="isCallingOut || isInCall"
              class="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 text-emerald-600 rounded-xl font-semibold text-sm transition-all shadow-sm">
              <i class="fa-solid fa-phone"></i>
              <span>Gọi thoại</span>
            </button>
            <button @click="startVideoCall"
              :disabled="isCallingOut || isInCall"
              class="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-600 rounded-xl font-semibold text-sm transition-all shadow-sm">
              <i class="fa-solid fa-video"></i>
              <span>Video</span>
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div class="flex-1 overflow-y-auto p-5 bg-slate-50/70">
          <TransitionGroup name="list" tag="div" class="space-y-4">
            <div
              v-for="msg in messages"
              :key="msg.id"
              :class="['flex', msg.sender_id === currentUserId ? 'justify-end' : 'justify-start']"
            >
              <div :class="[
                'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed',
                msg.sender_id === currentUserId
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-br-sm'
                  : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm'
              ]">
                <p class="break-words">{{ msg.content }}</p>
                <p :class="['text-[10px] mt-1.5 text-right', msg.sender_id === currentUserId ? 'text-blue-100' : 'text-slate-400']">
                  {{ formatTime(msg.timestamp) }}
                </p>
              </div>
            </div>
          </TransitionGroup>
          <div ref="messagesEnd" class="h-4"></div>
        </div>

        <!-- Input -->
        <div class="flex-shrink-0 bg-white border-t border-slate-100 p-4">
          <div class="flex items-center gap-3 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-4 py-2">
            <input
              v-model="messageInput"
              @keyup.enter="sendMessage"
              type="text"
              placeholder="Nhập tin nhắn của bạn..."
              class="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-slate-700 placeholder-slate-400 text-sm py-1"
            />
            <button @click="sendMessage" :disabled="!messageInput.trim()"
              class="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-200 disabled:to-slate-200 text-white disabled:text-slate-400 rounded-xl transition-all shadow-md disabled:shadow-none">
              <i class="fa-solid fa-paper-plane text-sm"></i>
            </button>
          </div>
        </div>
      </template>

      <div v-else class="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
        <div class="relative w-24 h-24 mb-6">
          <div class="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping opacity-40"></div>
          <div class="w-full h-full bg-white rounded-full flex items-center justify-center shadow-xl">
            <i class="fa-regular fa-comments text-4xl text-blue-300"></i>
          </div>
        </div>
        <p class="text-xl font-bold text-slate-600">MediSmart Messenger</p>
        <p class="text-sm mt-2">Chọn một cuộc hội thoại để bắt đầu kết nối</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { messagingService } from '@/services/messagingService.js';
import { webrtcService } from '@/services/webrtcService.js';

// ===== USER IDENTITY =====
const currentPath = window.location.pathname;
const currentUserId = ref(currentPath.includes('admin') ? 'bs01' : 'benhnhan');

// ===== CHAT STATE =====
const chatList = ref([]);
const selectedChat = ref(null);
const messages = ref([]);
const messageInput = ref('');
const messagesEnd = ref(null);

// ===== CALL STATE =====
const isCallingOut = ref(false);
const outgoingCallType = ref('audio');
const isInCall = ref(false);
const activeCallType = ref('audio');
const incomingCallSignal = ref(null);
const callDuration = ref(0);
const isMuted = ref(false);
const isCameraOn = ref(true);
let callTimer = null;
const errorMsg = ref('');

// Streams lưu thành reactive refs — watch sẽ tự gán vào element
const localStream = ref(null);
const remoteStream = ref(null);

// Video elements
const localVideoEl = ref(null);
const remoteVideoEl = ref(null);

// Gán stream vào element ngay khi cả hai sẵn sàng
watch([localStream, localVideoEl], ([stream, el]) => {
  if (stream && el) el.srcObject = stream;
});
watch([remoteStream, remoteVideoEl], ([stream, el]) => {
  if (stream && el) {
    el.srcObject = stream;
    el.play().catch(() => {});
  }
});

// Tên người gọi đến (dịch ID sang tên)
const incomingCallerName = computed(() => {
  if (!incomingCallSignal.value) return '';
  const found = chatList.value.find(c => c.user_id === incomingCallSignal.value.from);
  return found?.name || incomingCallSignal.value.from;
});

// ===== CHAT FUNCTIONS =====

const loadChatList = async () => {
  const res = await messagingService.getChatList(currentUserId.value);
  if (res.chats) chatList.value = res.chats;
};

const selectChat = async (chat) => {
  selectedChat.value = chat;
  await loadConversation();
};

const loadConversation = async () => {
  if (!selectedChat.value) return;
  const res = await messagingService.getConversation(currentUserId.value, selectedChat.value.user_id);
  if (res.messages) {
    messages.value = res.messages;
    await nextTick();
    scrollToBottom();
  }
};

const sendMessage = async () => {
  if (!messageInput.value.trim() || !selectedChat.value) return;
  const msg = await messagingService.sendMessage(currentUserId.value, selectedChat.value.user_id, messageInput.value);
  messages.value.push(msg);
  messageInput.value = '';
  await nextTick();
  scrollToBottom();
  loadChatList();
};

const scrollToBottom = () => messagesEnd.value?.scrollIntoView({ behavior: 'smooth' });
const formatTime = (ts) => new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const formatDuration = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

const showError = (msg) => {
  errorMsg.value = msg;
  setTimeout(() => { errorMsg.value = ''; }, 4000);
};

// ===== CALL: GỌI ĐI =====

const startAudioCall = async () => {
  if (!selectedChat.value || isCallingOut.value || isInCall.value) return;
  try {
    isCallingOut.value = true;
    outgoingCallType.value = 'audio';
    const stream = await webrtcService.initiateCall(selectedChat.value.user_id, 'audio');
    localStream.value = stream;
  } catch (e) {
    isCallingOut.value = false;
    showError(e.message || 'Không thể bắt đầu cuộc gọi. Hãy cho phép truy cập microphone.');
  }
};

const startVideoCall = async () => {
  if (!selectedChat.value || isCallingOut.value || isInCall.value) return;
  try {
    isCallingOut.value = true;
    outgoingCallType.value = 'video';
    const stream = await webrtcService.initiateCall(selectedChat.value.user_id, 'video');
    localStream.value = stream; // watch sẽ tự gán vào element khi DOM sẵn sàng
  } catch (e) {
    isCallingOut.value = false;
    showError(e.message || 'Không thể bắt đầu cuộc gọi video. Hãy cho phép truy cập camera.');
  }
};

const cancelOutgoingCall = () => {
  webrtcService.declineCall(selectedChat.value?.user_id || '');
  isCallingOut.value = false;
};

// ===== CALL: NHẬN CUỘC GỌI =====

const acceptIncomingCall = async () => {
  if (!incomingCallSignal.value) return;
  const signal = incomingCallSignal.value;
  incomingCallSignal.value = null;

  // Chọn chat với người gọi
  const caller = chatList.value.find(c => c.user_id === signal.from);
  if (caller) selectedChat.value = caller;

  try {
    const stream = await webrtcService.acceptCall(signal);
    localStream.value = stream;   // watch tự gán vào localVideoEl
    activeCallType.value = signal.callType;
    isInCall.value = true;        // DOM render overlay → watch gán remoteStream nếu đã có
    startCallTimer();
  } catch (e) {
    showError(e.message || 'Không thể kết nối cuộc gọi. Hãy cho phép truy cập camera/micro.');
  }
};

const declineIncomingCall = () => {
  if (incomingCallSignal.value) {
    webrtcService.declineCall(incomingCallSignal.value.from);
    incomingCallSignal.value = null;
  }
};

// ===== CALL: TRONG CUỘC GỌI =====

const endCall = () => {
  webrtcService.endCall();
  cleanupCall();
};

const toggleMute = () => {
  isMuted.value = !isMuted.value;
  webrtcService.toggleMute(isMuted.value);
};

const toggleCamera = () => {
  isCameraOn.value = !isCameraOn.value;
  webrtcService.toggleCamera(isCameraOn.value);
};

const startCallTimer = () => {
  callDuration.value = 0;
  callTimer = setInterval(() => { callDuration.value++; }, 1000);
};

const cleanupCall = () => {
  isInCall.value = false;
  isCallingOut.value = false;
  incomingCallSignal.value = null;
  isMuted.value = false;
  isCameraOn.value = true;
  if (callTimer) { clearInterval(callTimer); callTimer = null; }
  callDuration.value = 0;
  // Xóa streams (watch sẽ tự clear srcObject)
  localStream.value = null;
  remoteStream.value = null;
  if (localVideoEl.value) localVideoEl.value.srcObject = null;
  if (remoteVideoEl.value) remoteVideoEl.value.srcObject = null;
};

// ===== WEBRTC CALLBACKS =====

const setupWebRTCCallbacks = () => {
  webrtcService.onIncomingCall = (signal) => {
    incomingCallSignal.value = signal;
  };

  webrtcService.onCallAnswered = () => {
    // Bên gọi: bên kia bắt máy → chuyển sang màn hình gọi
    isCallingOut.value = false;
    activeCallType.value = outgoingCallType.value;
    isInCall.value = true;
    startCallTimer();
    // Gán lại localStream để watch re-trigger sau khi DOM overlay render
    if (webrtcService.localStream) {
      const s = webrtcService.localStream;
      localStream.value = null;
      nextTick(() => { localStream.value = s; });
    }
  };

  webrtcService.onRemoteStream = (stream) => {
    // Lưu vào ref — watch sẽ gán vào element khi element sẵn sàng
    remoteStream.value = null;
    nextTick(() => { remoteStream.value = stream; });
  };

  webrtcService.onCallDeclined = () => {
    isCallingOut.value = false;
    showError('Cuộc gọi đã bị từ chối.');
  };

  webrtcService.onCallEnded = () => {
    cleanupCall();
  };

  webrtcService.onError = (msg) => {
    showError(msg);
    cleanupCall();
  };
};

// ===== AUTO REFRESH =====
const startAutoRefresh = () => {
  setInterval(() => {
    if (selectedChat.value) loadConversation();
  }, 3000);
};

// ===== LIFECYCLE =====
onMounted(async () => {
  webrtcService.init(currentUserId.value);
  setupWebRTCCallbacks();
  await loadChatList();
  startAutoRefresh();
});

onUnmounted(() => {
  webrtcService.destroy();
  if (callTimer) clearInterval(callTimer);
});

watch(selectedChat, () => {
  if (selectedChat.value) loadConversation();
});
</script>

<style scoped>
.call-fade-enter-active, .call-fade-leave-active { transition: opacity 0.3s ease; }
.call-fade-enter-from, .call-fade-leave-to { opacity: 0; }

.modal-pop-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-pop-leave-active { transition: all 0.2s ease-in; }
.modal-pop-enter-from, .modal-pop-leave-to { opacity: 0; transform: scale(0.85); }

.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.3s ease; }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateX(-50%) translateY(-16px); }
</style>
