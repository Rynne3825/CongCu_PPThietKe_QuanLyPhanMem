/**
 * Composable: Theo dõi tin nhắn chưa đọc + Browser Notifications
 * Hoạt động qua localStorage storage event giữa các tab
 */
import { ref, onMounted, onUnmounted } from 'vue';

const NOTIFY_KEY = 'medi_msg_notify';

// Global shared state — chỉ khởi tạo 1 lần dù nhiều component dùng
const totalUnread = ref(0);

export function useUnreadMessages(myUserId) {
  // Xin quyền thông báo trình duyệt
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const showBrowserNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(`💬 ${title}`, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'medismart-chat', // Tránh spam nhiều notification
        renotify: true,
      });
      // Tự đóng sau 5 giây
      setTimeout(() => n.close(), 5000);
      // Click vào notification → focus tab
      n.onclick = () => {
        window.focus();
        n.close();
      };
    }
  };

  const handleStorageEvent = (e) => {
    if (e.key !== NOTIFY_KEY) return;
    if (!e.newValue) return;
    try {
      const signal = JSON.parse(e.newValue);
      // Chỉ xử lý nếu tin nhắn gửi cho mình
      if (signal.receiver_id !== myUserId) return;

      totalUnread.value++;
      showBrowserNotification(signal.sender_name || 'Tin nhắn mới', signal.content);
    } catch (_) {}
  };

  onMounted(async () => {
    await requestNotificationPermission();
    window.addEventListener('storage', handleStorageEvent);
  });

  onUnmounted(() => {
    window.removeEventListener('storage', handleStorageEvent);
  });

  const resetUnread = () => {
    totalUnread.value = 0;
  };

  return { totalUnread, resetUnread };
}

// Hàm này được gọi từ messagingService khi gửi tin
export function broadcastNewMessage(senderId, senderName, receiverId, content) {
  localStorage.setItem(NOTIFY_KEY, JSON.stringify({
    sender_id: senderId,
    sender_name: senderName,
    receiver_id: receiverId,
    content: content,
    _ts: Date.now()
  }));
}
