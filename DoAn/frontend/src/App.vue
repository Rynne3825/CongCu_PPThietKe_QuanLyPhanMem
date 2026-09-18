<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import Lenis from 'lenis'

const isPageLoading = ref(true);
const cursorDot = ref(null);
const cursorOutline = ref(null);

// Trạng thái hướng chuyển trang
// 'up'   = đăng nhập → vào dashboard (trang mới trượt lên từ dưới)
// 'down' = đăng xuất → về login (trang cũ trượt lên, login lộ ra từ dưới)
const transitionName = ref('slide-up');

const router = useRouter();

// Lắng nghe mỗi lần điều hướng để xác định hướng animation
router.beforeEach((to, from) => {
  const toDepth   = to.meta?.depth   ?? 0;
  const fromDepth = from.meta?.depth ?? 0;

  if (toDepth > fromDepth) {
    // Đăng nhập: vào trang có depth cao hơn → cuộn lên (login bị đẩy lên, dashboard xuất hiện từ dưới)
    transitionName.value = 'slide-up';
  } else if (toDepth < fromDepth) {
    // Đăng xuất: về trang có depth thấp hơn → cuộn xuống (dashboard bị đẩy xuống, login xuất hiện từ trên)
    transitionName.value = 'slide-down';
  } else {
    transitionName.value = 'slide-up';
  }
});

let lenis;
let rafId;
let cursorRafId;

let mouse = { x: -100, y: -100 };
let cursor = { x: -100, y: -100 };
let isHovering = false;
let hoverEl = null;

const lerp = (start, end, factor) => start + (end - start) * factor;

const onMouseMove = (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;

  if (cursorDot.value) {
    cursorDot.value.style.transform = `translate3d(calc(${mouse.x}px - 50%), calc(${mouse.y}px - 50%), 0)`;
  }
};

const onMouseOver = (e) => {
  const target = e.target.closest('button, a');
  if (target) {
    isHovering = true;
    hoverEl = target;
    if (cursorOutline.value) cursorOutline.value.classList.add('hovering');
    target.style.transition = 'transform 0.1s linear';
  }
};

const onMouseOut = (e) => {
  const target = e.target.closest('button, a');
  if (target) {
    isHovering = false;
    hoverEl = null;
    if (cursorOutline.value) {
      cursorOutline.value.classList.remove('hovering');
      cursorOutline.value.style.width = '36px';
      cursorOutline.value.style.height = '36px';
      cursorOutline.value.style.borderRadius = '50%';
      cursorOutline.value.style.backgroundColor = 'transparent';
      cursorOutline.value.style.borderColor = 'rgba(107, 114, 128, 0.4)';
    }
    target.style.transform = `translate3d(0px, 0px, 0px)`;
    setTimeout(() => { target.style.transition = ''; }, 100);
  }
};

const onMouseDown = () => {
  if (cursorOutline.value && !isHovering) cursorOutline.value.classList.add('cursor-click');
};
const onMouseUp = () => {
  if (cursorOutline.value) cursorOutline.value.classList.remove('cursor-click');
};

const updateCursor = () => {
  if (cursorOutline.value) {
    if (!isHovering) {
      cursor.x = lerp(cursor.x, mouse.x, 0.08);
      cursor.y = lerp(cursor.y, mouse.y, 0.08);
      cursorOutline.value.style.transform = `translate3d(calc(${cursor.x}px - 50%), calc(${cursor.y}px - 50%), 0)`;
    } else if (hoverEl) {
      const rect = hoverEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const pullX = (mouse.x - centerX) * 0.1;
      const pullY = (mouse.y - centerY) * 0.1;
      
      cursor.x = lerp(cursor.x, centerX + pullX, 0.1);
      cursor.y = lerp(cursor.y, centerY + pullY, 0.1);
      
      cursorOutline.value.style.transform = `translate3d(calc(${cursor.x}px - 50%), calc(${cursor.y}px - 50%), 0)`;
      cursorOutline.value.style.width = `${rect.width + 10}px`;
      cursorOutline.value.style.height = `${rect.height + 10}px`;
      
      const computedStyle = getComputedStyle(hoverEl);
      cursorOutline.value.style.borderRadius = computedStyle.borderRadius || '8px';
      cursorOutline.value.style.backgroundColor = 'rgba(107, 114, 128, 0.15)';
      cursorOutline.value.style.borderColor = 'rgba(107, 114, 128, 0)';
      
      const elPullX = (mouse.x - centerX) * 0.2;
      const elPullY = (mouse.y - centerY) * 0.2;
      hoverEl.style.transform = `translate3d(${elPullX}px, ${elPullY}px, 0)`;
    }
  }
  cursorRafId = requestAnimationFrame(updateCursor);
};

onMounted(() => {
  lenis = new Lenis({
    lerp: 0.06,
    smoothWheel: true,
  })

  function raf(time) {
    lenis.raf(time)
    rafId = requestAnimationFrame(raf)
  }

  rafId = requestAnimationFrame(raf)
  cursorRafId = requestAnimationFrame(updateCursor);

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseover', onMouseOver);
  window.addEventListener('mouseout', onMouseOut);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

  setTimeout(() => {
    isPageLoading.value = false;
  }, 1200);
})

onUnmounted(() => {
  if (lenis) lenis.destroy()
  if (rafId) cancelAnimationFrame(rafId)
  if (cursorRafId) cancelAnimationFrame(cursorRafId)
  
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseover', onMouseOver);
  window.removeEventListener('mouseout', onMouseOut);
  window.removeEventListener('mousedown', onMouseDown);
  window.removeEventListener('mouseup', onMouseUp);
})
</script>

<template>
  <div class="cursor-dot" ref="cursorDot"></div>
  <div class="cursor-outline" ref="cursorOutline"></div>

  <!-- Loading Screen -->
  <Transition name="fade-slow">
    <div v-if="isPageLoading" class="fixed inset-0 z-[10000] bg-slate-50 flex flex-col items-center justify-center">
      <div class="text-blue-600 mb-4 animate-pulse">
        <i class="fa-solid fa-heart-pulse text-7xl drop-shadow-lg text-gradient"></i>
      </div>
      <h1 class="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 drop-shadow-sm tracking-tight">MediSmart</h1>
      <p class="text-gray-500 mt-3 tracking-[0.2em] text-xs uppercase font-bold opacity-80">Đang khởi tạo...</p>
      
      <div class="mt-8 flex gap-2">
        <div class="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-bounce shadow-md" style="animation-delay: 0s"></div>
        <div class="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-bounce shadow-md" style="animation-delay: 0.15s"></div>
        <div class="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-bounce shadow-md" style="animation-delay: 0.3s"></div>
      </div>
    </div>
  </Transition>

  <!-- Page Transition: tên động theo hướng điều hướng -->
  <RouterView v-slot="{ Component }">
    <Transition :name="transitionName" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<style>
/* ===== SPLASH SCREEN ===== */
.fade-slow-enter-active, .fade-slow-leave-active {
  transition: opacity 0.8s ease-in-out;
}
.fade-slow-enter-from, .fade-slow-leave-to {
  opacity: 0;
}

/* =================================================================
   ĐĂNG NHẬP: Login → Dashboard
   Trang login trượt LÊN (rời đi lên trên)
   Trang dashboard xuất hiện từ DƯỚI trượt lên
================================================================= */
.slide-up-enter-active {
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease;
}
.slide-up-leave-active {
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.35s ease;
}
/* Trang mới (dashboard) bắt đầu từ phía dưới */
.slide-up-enter-from {
  transform: translateY(60px);
  opacity: 0;
}
/* Trang cũ (login) thoát lên phía trên */
.slide-up-leave-to {
  transform: translateY(-40px);
  opacity: 0;
}

/* =================================================================
   ĐĂNG XUẤT: Dashboard → Login
   Trang dashboard trượt XUỐNG (rời đi xuống dưới)
   Trang login xuất hiện từ TRÊN trượt xuống vào vị trí
================================================================= */
.slide-down-enter-active {
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease;
}
.slide-down-leave-active {
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.35s ease;
}
/* Trang mới (login) bắt đầu từ phía trên */
.slide-down-enter-from {
  transform: translateY(-60px);
  opacity: 0;
}
/* Trang cũ (dashboard) thoát xuống phía dưới */
.slide-down-leave-to {
  transform: translateY(40px);
  opacity: 0;
}

/* ===== BASE ===== */
body {
  margin: 0;
  padding: 0;
}

/* ===== CUSTOM CURSOR ===== */
.cursor-dot {
  width: 6px;
  height: 6px;
  background-color: #6b7280;
  border-radius: 50%;
  position: fixed;
  top: 0px;
  left: 0px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 9999;
}

.cursor-outline {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(107, 114, 128, 0.4);
  background-color: rgba(107, 114, 128, 0.05);
  box-shadow: 0 0 15px rgba(107, 114, 128, 0.3);
  border-radius: 50%;
  position: fixed;
  top: 0px;
  left: 0px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 9998;
  transition: width 0.25s ease, height 0.25s ease, background-color 0.25s ease, border-color 0.25s ease, border-radius 0.25s ease;
}

.cursor-outline.cursor-click {
  width: 60px;
  height: 60px;
  background-color: rgba(107, 114, 128, 0.25);
  border-color: rgba(107, 114, 128, 0);
  box-shadow: 0 0 15px rgba(107, 114, 128, 0.3);
}
</style>