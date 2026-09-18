<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <!-- Navigation Bar -->
    <nav class="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg p-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-4">
          <router-link to="/patient" class="hover:bg-blue-700 p-2 rounded-lg transition">
            <i class="fa-solid fa-arrow-left text-xl"></i>
          </router-link>
          <h1 class="text-2xl font-bold">MediSmart - Nhắn Tin</h1>
        </div>
        <button
          @click="logout"
          class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition font-semibold"
        >
          <i class="fa-solid fa-sign-out-alt mr-2"></i>Đăng xuất
        </button>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="flex-1">
      <PatientDoctorChat />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import PatientDoctorChat from '@/components/PatientDoctorChat.vue';

const router = useRouter();

const logout = () => {
  localStorage.removeItem('current_user_id');
  router.push('/login');
};
</script>
