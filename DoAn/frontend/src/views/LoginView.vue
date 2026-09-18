<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const currentPage = ref('login'); // 'login', 'register', 'forgot'
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const email = ref('');
const toasts = ref([]);

// Toast Notification System
const showToast = (type, title, message, duration = 3000) => {
    const id = Date.now();
    const toast = { id, type, title, message };
    toasts.value.push(toast);

    if (duration > 0) {
        setTimeout(() => {
            toasts.value = toasts.value.filter(t => t.id !== id);
        }, duration);
    }
    return id;
};

const removeToast = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id);
};

const getToastIcon = (type) => {
    switch(type) {
        case 'success': return 'fa-circle-check';
        case 'error': return 'fa-circle-xmark';
        case 'warning': return 'fa-triangle-exclamation';
        case 'info': return 'fa-circle-info';
        default: return 'fa-info';
    }
};

const getToastColor = (type) => {
    switch(type) {
        case 'success': return 'from-emerald-400 to-teal-500';
        case 'error': return 'from-red-400 to-rose-500';
        case 'warning': return 'from-amber-400 to-orange-500';
        case 'info': return 'from-blue-400 to-cyan-500';
        default: return 'from-gray-400 to-gray-500';
    }
};

const handleLogin = () => {
    if (!username.value || !password.value) {
        showToast('warning', 'Thông tin không đầy đủ', 'Vui lòng nhập đầy đủ tài khoản và mật khẩu!');
        return;
    }
    
    // Tài khoản Bác sĩ
    if (username.value === 'Bacsi' && password.value === '123') {
        showToast('success', 'Đăng nhập thành công', 'Chào mừng bác sĩ quay lại!');
        setTimeout(() => router.push('/admin'), 500);
    } 
    // Tài khoản Bệnh nhân
    else if (username.value === 'benhnhan' && password.value === '123') {
        showToast('success', 'Đăng nhập thành công', 'Chào mừng bệnh nhân!');
        setTimeout(() => router.push('/patient'), 500);
    }
    // Tài khoản không hợp lệ
    else {
        showToast('error', 'Đăng nhập thất bại', 'Tài khoản hoặc mật khẩu không chính xác!');
    }
};

const handleRegister = () => {
    if (!username.value || !email.value || !password.value || !confirmPassword.value) {
        showToast('warning', 'Thông tin không đầy đủ', 'Vui lòng điền đầy đủ tất cả các trường!');
        return;
    }
    
    if (password.value !== confirmPassword.value) {
        showToast('error', 'Mật khẩu không khớp', 'Vui lòng kiểm tra mật khẩu của bạn!');
        return;
    }
    
    if (password.value.length < 6) {
        showToast('warning', 'Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự!');
        return;
    }
    
    showToast('success', 'Đăng ký thành công', `Tài khoản ${username.value} đã tạo. Vui lòng đăng nhập!`);
    setTimeout(() => {
        resetForm();
        currentPage.value = 'login';
    }, 1000);
};

const handleForgotPassword = () => {
    if (!email.value) {
        showToast('warning', 'Email trống', 'Vui lòng nhập email của bạn!');
        return;
    }
    
    showToast('success', 'Email gửi thành công', `Hướng dẫn đặt lại mật khẩu đã gửi tới ${email.value}`);
    setTimeout(() => {
        resetForm();
        currentPage.value = 'login';
    }, 1000);
};

const resetForm = () => {
    username.value = '';
    email.value = '';
    password.value = '';
    confirmPassword.value = '';
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 font-sans flex flex-col">
      
      <header class="text-center py-12 text-white">
          <div class="mb-4">
              <i class="fa-solid fa-briefcase-medical text-6xl drop-shadow-lg"></i>
          </div>
          <h1 class="text-6xl font-black tracking-widest uppercase drop-shadow-lg mb-3" style="letter-spacing: 2px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
              Y TẾ
          </h1>
          <p class="text-2xl font-bold drop-shadow-md" style="text-shadow: 1px 1px 3px rgba(0,0,0,0.2);">
              Xây dựng hệ thống quản lý phòng khám tư nhân
          </p>
          <div class="h-1 w-32 bg-white/40 mx-auto mt-4 rounded-full"></div>
      </header>

      <main class="flex-1 flex items-center justify-center p-4 pb-12">
          <!-- Toast Notifications -->
          <div class="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
              <transition-group name="slide" tag="div">
                  <div v-for="toast in toasts" :key="toast.id" 
                      class="pointer-events-auto bg-gradient-to-r rounded-xl shadow-lg p-4 text-white max-w-xs flex items-start gap-3 animate-slide-in"
                      :class="getToastColor(toast.type)">
                      <i :class="`fa-solid ${getToastIcon(toast.type)} flex-shrink-0 mt-1`"></i>
                      <div class="flex-1 min-w-0">
                          <p class="font-bold text-sm">{{ toast.title }}</p>
                          <p class="text-sm opacity-95">{{ toast.message }}</p>
                      </div>
                      <button @click="removeToast(toast.id)" class="flex-shrink-0 hover:opacity-80">
                          <i class="fa-solid fa-xmark"></i>
                      </button>
                  </div>
              </transition-group>
          </div>

          <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-[420px]">
              
              <!-- LOGIN PAGE -->
              <div v-if="currentPage === 'login'">
                  <h2 class="text-2xl font-bold text-center text-gray-800 mb-1 uppercase">Đăng Nhập</h2>
                  <div class="h-1 w-12 bg-blue-500 mx-auto mb-6 rounded-full"></div>

                  <form @submit.prevent="handleLogin" class="space-y-4">
                      <div>
                          <label class="block text-sm font-bold text-gray-700 mb-2">Tài Khoản</label>
                          <input v-model="username" type="text" placeholder="Nhập tài khoản" required
                              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm font-medium transition">
                      </div>
                      <div>
                          <label class="block text-sm font-bold text-gray-700 mb-2">Mật Khẩu</label>
                          <input v-model="password" type="password" placeholder="Nhập mật khẩu" required
                              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm font-medium transition">
                      </div>
                      
                      <button type="submit" class="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-bold py-3 rounded-lg shadow-lg transition transform hover:scale-105 mt-6">
                          <i class="fa-solid fa-arrow-right-to-bracket mr-2"></i>ĐĂNG NHẬP
                      </button>
                  </form>

                  <div class="mt-6 pt-6 border-t border-gray-200 space-y-3 text-sm">
                      <p class="text-center text-gray-600">
                          Bạn chưa có tài khoản? 
                          <button @click="currentPage = 'register'" class="text-blue-500 font-bold hover:underline">Đăng ký mới</button>
                      </p>
                      <p class="text-center text-gray-600">
                          <button @click="currentPage = 'forgot'" class="text-red-500 font-bold hover:underline">Quên mật khẩu?</button>
                      </p>
                  </div>

                  <div class="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <p class="text-xs font-bold text-gray-700 mb-3">📋 Tài Khoản Test:</p>
                      <div class="space-y-2 text-xs font-medium">
                          <p class="text-left"><span class="text-blue-600">👨‍⚕️ Bác sĩ:</span> <code class="bg-gray-100 px-2 py-1 rounded">Bacsi / 123</code></p>
                          <p class="text-left"><span class="text-green-600">👤 Bệnh nhân:</span> <code class="bg-gray-100 px-2 py-1 rounded">benhnhan / 123</code></p>
                      </div>
                  </div>
              </div>

              <!-- REGISTER PAGE -->
              <div v-if="currentPage === 'register'">
                  <h2 class="text-2xl font-bold text-center text-gray-800 mb-1 uppercase">Đăng Ký Mới</h2>
                  <div class="h-1 w-12 bg-green-500 mx-auto mb-6 rounded-full"></div>

                  <form @submit.prevent="handleRegister" class="space-y-4">
                      <div>
                          <label class="block text-sm font-bold text-gray-700 mb-2">Tài Khoản</label>
                          <input v-model="username" type="text" placeholder="Chọn tài khoản" required
                              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 text-sm font-medium transition">
                      </div>
                      <div>
                          <label class="block text-sm font-bold text-gray-700 mb-2">Email</label>
                          <input v-model="email" type="email" placeholder="Nhập email" required
                              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 text-sm font-medium transition">
                      </div>
                      <div>
                          <label class="block text-sm font-bold text-gray-700 mb-2">Mật Khẩu</label>
                          <input v-model="password" type="password" placeholder="Nhập mật khẩu (ít nhất 6 ký tự)" required
                              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 text-sm font-medium transition">
                      </div>
                      <div>
                          <label class="block text-sm font-bold text-gray-700 mb-2">Xác Nhận Mật Khẩu</label>
                          <input v-model="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" required
                              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 text-sm font-medium transition">
                      </div>
                      
                      <button type="submit" class="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-3 rounded-lg shadow-lg transition transform hover:scale-105 mt-6">
                          <i class="fa-solid fa-user-plus mr-2"></i>ĐĂNG KÝ
                      </button>
                  </form>

                  <div class="mt-6 pt-6 border-t border-gray-200">
                      <p class="text-center text-gray-600 text-sm">
                          Đã có tài khoản? 
                          <button @click="currentPage = 'login'" class="text-blue-500 font-bold hover:underline">Đăng nhập</button>
                      </p>
                  </div>
              </div>

              <!-- FORGOT PASSWORD PAGE -->
              <div v-if="currentPage === 'forgot'">
                  <h2 class="text-2xl font-bold text-center text-gray-800 mb-1 uppercase">Quên Mật Khẩu</h2>
                  <div class="h-1 w-12 bg-orange-500 mx-auto mb-6 rounded-full"></div>

                  <p class="text-center text-gray-600 text-sm mb-6">Nhập email của bạn để nhận hướng dẫn khôi phục mật khẩu</p>

                  <form @submit.prevent="handleForgotPassword" class="space-y-4">
                      <div>
                          <label class="block text-sm font-bold text-gray-700 mb-2">Email</label>
                          <input v-model="email" type="email" placeholder="Nhập email đăng ký" required
                              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm font-medium transition">
                      </div>
                      
                      <button type="submit" class="w-full bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-3 rounded-lg shadow-lg transition transform hover:scale-105 mt-6">
                          <i class="fa-solid fa-envelope mr-2"></i>GỬI HƯỚNG DẪN
                      </button>
                  </form>

                  <div class="mt-6 pt-6 border-t border-gray-200">
                      <p class="text-center text-gray-600 text-sm">
                          Quay lại 
                          <button @click="currentPage = 'login'" class="text-blue-500 font-bold hover:underline">đăng nhập</button>
                      </p>
                  </div>
              </div>

          </div>
      </main>

      <footer class="text-center text-white/60 py-4 text-xs">
          <p>© 2026 - Xây dựng hệ thống quản lý phòng khám tư nhân</p>
      </footer>
  </div>
</template>

<style scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>