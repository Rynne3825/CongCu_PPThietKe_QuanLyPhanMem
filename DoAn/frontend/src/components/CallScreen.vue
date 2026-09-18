<template>
  <div v-if="show" class="fixed inset-0 bg-black z-50 flex flex-col">
    <!-- Call Header -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
      <div class="flex items-center">
        <div class="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-lg font-bold">
          {{ contactName.charAt(0) }}
        </div>
        <div class="ml-3">
          <h3 class="font-semibold text-lg">{{ contactName }}</h3>
          <p class="text-blue-100 text-sm">{{ callStatus }}</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-3xl font-bold font-mono">{{ formatDuration(callDuration) }}</p>
        <p v-if="callType === 'video'" class="text-blue-100 text-sm">Video Call</p>
        <p v-else class="text-blue-100 text-sm">Audio Call</p>
      </div>
    </div>

    <!-- Main Call Area -->
    <div class="flex-1 bg-black relative overflow-hidden">
      <!-- Remote Video (Bác sĩ) -->
      <div v-if="callType === 'video'" class="w-full h-full bg-gray-900 flex items-center justify-center">
        <div class="text-center text-white">
          <div class="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-6xl font-bold mb-4 mx-auto">
            {{ contactName.charAt(0) }}
          </div>
          <p class="text-xl">{{ contactName }}</p>
          <p class="text-gray-400 text-sm mt-2">Khung hình của đối phương sẽ hiển thị ở đây</p>
        </div>
      </div>

      <!-- Audio Call UI -->
      <div v-else class="w-full h-full flex items-center justify-center flex-col">
        <div class="text-center text-white">
          <div class="w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-8xl font-bold mb-6 mx-auto animate-pulse">
            {{ contactName.charAt(0) }}
          </div>
          <p class="text-3xl font-bold mb-2">{{ contactName }}</p>
          <p class="text-blue-200 text-lg">{{ callStatus }}</p>
        </div>
      </div>

      <!-- Local Video (Người dùng) - nhỏ ở góc -->
      <div v-if="callType === 'video' && videoEnabled" class="absolute bottom-4 right-4 w-32 h-32 bg-gray-700 rounded-lg border-2 border-white shadow-lg flex items-center justify-center">
        <div class="text-center text-white">
          <i class="fa-solid fa-video text-3xl text-blue-400"></i>
          <p class="text-xs mt-2">Bạn</p>
        </div>
      </div>

      <!-- Call Status During Incoming Call -->
      <div v-if="isIncomingCall && !isCallActive" class="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center space-y-4">
        <div class="text-center">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-4xl font-bold mx-auto mb-4 animate-bounce">
            {{ contactName.charAt(0) }}
          </div>
          <p class="text-white text-2xl font-bold">{{ contactName }}</p>
          <p class="text-blue-200 text-lg mt-2">Đang gọi bạn...</p>
        </div>
      </div>
    </div>

    <!-- Control Buttons -->
    <div class="bg-gray-900 border-t border-gray-700 px-4 py-6">
      <div class="flex items-center justify-center gap-6 mb-6">
        <!-- Mute Button -->
        <button
          @click="toggleMute"
          :class="[
            'w-16 h-16 rounded-full flex items-center justify-center text-white transition-all font-bold text-xl',
            isMuted
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50'
              : 'bg-gray-700 hover:bg-gray-600'
          ]"
          title="Tắt/Bật microphone"
        >
          <i :class="isMuted ? 'fa-solid fa-microphone-slash' : 'fa-solid fa-microphone'"></i>
        </button>

        <!-- Video Button (Video Call Only) -->
        <button
          v-if="callType === 'video'"
          @click="toggleVideo"
          :class="[
            'w-16 h-16 rounded-full flex items-center justify-center text-white transition-all font-bold text-xl',
            !videoEnabled
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50'
              : 'bg-gray-700 hover:bg-gray-600'
          ]"
          title="Tắt/Bật camera"
        >
          <i :class="videoEnabled ? 'fa-solid fa-video' : 'fa-solid fa-video-slash'"></i>
        </button>

        <!-- Speaker Button -->
        <button
          @click="toggleSpeaker"
          :class="[
            'w-16 h-16 rounded-full flex items-center justify-center text-white transition-all font-bold text-xl',
            !speakerEnabled
              ? 'bg-yellow-500 hover:bg-yellow-600'
              : 'bg-gray-700 hover:bg-gray-600'
          ]"
          title="Tắt/Bật loa"
        >
          <i :class="speakerEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark'"></i>
        </button>

        <!-- Share Button -->
        <button
          @click="toggleScreenShare"
          :class="[
            'w-16 h-16 rounded-full flex items-center justify-center text-white transition-all font-bold text-xl',
            isScreenSharing
              ? 'bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/50'
              : 'bg-gray-700 hover:bg-gray-600'
          ]"
          title="Chia sẻ màn hình"
        >
          <i class="fa-solid fa-share-nodes"></i>
        </button>

        <!-- End Call Button -->
        <button
          @click="endCall"
          class="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all font-bold text-2xl shadow-lg shadow-red-500/50"
          title="Kết thúc cuộc gọi"
        >
          <i class="fa-solid fa-phone-slash"></i>
        </button>
      </div>

      <!-- Incoming Call Actions -->
      <div v-if="isIncomingCall && !isCallActive" class="flex gap-4 justify-center">
        <button
          @click="acceptCall"
          class="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-bold transition-all text-lg"
        >
          <i class="fa-solid fa-phone-check"></i> Chấp nhận
        </button>
        <button
          @click="declineCall"
          class="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-bold transition-all text-lg"
        >
          <i class="fa-solid fa-phone-xmark"></i> Từ chối
        </button>
      </div>
    </div>

    <!-- Bottom Info -->
    <div class="bg-gray-800 px-4 py-3 text-center">
      <p v-if="isCallActive" class="text-green-400 text-sm flex items-center justify-center gap-2">
        <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        Cuộc gọi đang kết nối
      </p>
      <p v-else-if="isIncomingCall" class="text-yellow-400 text-sm flex items-center justify-center gap-2">
        <span class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
        Cuộc gọi sắp tới
      </p>
      <p v-else class="text-red-400 text-sm">Cuộc gọi đang chuyển tiếp...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { callingService } from '@/services/messagingService.js';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  callId: Number,
  contactName: {
    type: String,
    default: 'Đối tác'
  },
  callType: {
    type: String,
    enum: ['audio', 'video'],
    default: 'audio'
  },
  isIncomingCall: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'end-call', 'accept-call', 'decline-call']);

// State
const callDuration = ref(0);
const isMuted = ref(false);
const videoEnabled = ref(true);
const speakerEnabled = ref(true);
const isScreenSharing = ref(false);
const isCallActive = ref(!props.isIncomingCall);
let callTimer = null;

// Format duration
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Get call status
const callStatus = computed(() => {
  if (isCallActive.value) {
    return 'Cuộc gọi đang diễn ra';
  }
  if (props.isIncomingCall) {
    return 'Đang gọi...';
  }
  return 'Đang kết nối...';
});

// Toggle mute
const toggleMute = () => {
  isMuted.value = !isMuted.value;
};

// Toggle video
const toggleVideo = () => {
  videoEnabled.value = !videoEnabled.value;
};

// Toggle speaker
const toggleSpeaker = () => {
  speakerEnabled.value = !speakerEnabled.value;
};

// Toggle screen share
const toggleScreenShare = () => {
  isScreenSharing.value = !isScreenSharing.value;
};

// Accept call
const acceptCall = async () => {
  try {
    if (props.callId) {
      await callingService.acceptCall(props.callId);
      isCallActive.value = true;
      startCallTimer();
    }
    emit('accept-call');
  } catch (error) {
    console.error('Lỗi chấp nhận cuộc gọi:', error);
  }
};

// Decline call
const declineCall = async () => {
  try {
    if (props.callId) {
      await callingService.declineCall(props.callId);
    }
    emit('decline-call');
    stopCallTimer();
  } catch (error) {
    console.error('Lỗi từ chối cuộc gọi:', error);
  }
};

// End call
const endCall = async () => {
  try {
    if (props.callId) {
      await callingService.endCall(props.callId);
    }
    emit('end-call');
    stopCallTimer();
  } catch (error) {
    console.error('Lỗi kết thúc cuộc gọi:', error);
  }
};

// Start timer
const startCallTimer = () => {
  callDuration.value = 0;
  callTimer = setInterval(() => {
    callDuration.value++;
  }, 1000);
};

// Stop timer
const stopCallTimer = () => {
  if (callTimer) {
    clearInterval(callTimer);
  }
};

// Watch incoming call changes
watch(() => props.isIncomingCall, (newVal) => {
  if (!newVal) {
    isCallActive.value = true;
    if (!callTimer) {
      startCallTimer();
    }
  }
});

// Start timer when component mounts if call is active
watch(() => props.show, (newVal) => {
  if (newVal && isCallActive.value && !callTimer) {
    startCallTimer();
  }
});
</script>
