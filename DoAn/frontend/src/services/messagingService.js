/**
 * Dịch vụ Messaging - Gửi và nhận tin nhắn (MOCKED WITH LOCALSTORAGE)
 */

// Helper
const loadMockData = (key, defaultVal) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};
const saveMockData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Khởi tạo mock data nếu trống
const initMockData = () => {
  let chats = loadMockData('mock_chats_v2', null);
  let messages = loadMockData('mock_messages_v2', null);

  if (!chats) {
    chats = {
      'benhnhan': [
        { user_id: 'bs01', name: 'BS. Nguyễn Văn A', role: 'doctor', unread_count: 0, last_message: 'Chào bạn, kết quả xét nghiệm đã có.' }
      ],
      'bs01': [
        { user_id: 'benhnhan', name: 'Lê văn Hoài Rin', role: 'patient', unread_count: 0, last_message: 'Chào bạn, kết quả xét nghiệm đã có.' }
      ]
    };
    saveMockData('mock_chats_v2', chats);
  }

  if (!messages) {
    messages = [
      { id: 'm1', sender_id: 'bs01', receiver_id: 'benhnhan', content: 'Chào bạn, kết quả xét nghiệm đã có.', timestamp: Date.now() - 3600000, message_type: 'text' }
    ];
    saveMockData('mock_messages_v2', messages);
  }
};
initMockData();

export const messagingService = {
  // Gửi tin nhắn
  async sendMessage(senderId, receiverId, content, messageType = 'text') {
    return new Promise((resolve) => {
      setTimeout(() => {
        const messages = loadMockData('mock_messages_v2', []);
        const newMessage = {
          id: 'msg_' + Date.now(),
          sender_id: senderId,
          receiver_id: receiverId,
          content: content,
          timestamp: Date.now(),
          message_type: messageType
        };
        messages.push(newMessage);
        saveMockData('mock_messages_v2', messages);

        // Update last message + unread count trong chat list
        const chats = loadMockData('mock_chats_v2', {});
        if (chats[senderId]) {
          const chatObj = chats[senderId].find(c => c.user_id === receiverId);
          if (chatObj) chatObj.last_message = content;
        }
        let senderName = senderId;
        if (chats[receiverId]) {
          const chatObj = chats[receiverId].find(c => c.user_id === senderId);
          if (chatObj) {
            chatObj.last_message = content;
            chatObj.unread_count = (chatObj.unread_count || 0) + 1;
            senderName = chatObj.name; // lấy tên để hiện notification
          }
        }
        saveMockData('mock_chats_v2', chats);

        // Phát tín hiệu sang tab khác (storage event chỉ kích hoạt ở tab KHÁC)
        localStorage.setItem('medi_msg_notify', JSON.stringify({
          sender_id: senderId,
          sender_name: senderName,
          receiver_id: receiverId,
          content: content.length > 60 ? content.substring(0, 60) + '...' : content,
          _ts: Date.now()
        }));

        resolve(newMessage);
      }, 200);
    });
  },

  // Lấy cuộc hội thoại giữa hai người
  async getConversation(userId, otherUserId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const messages = loadMockData('mock_messages_v2', []);
        const conversation = messages.filter(m =>
          (m.sender_id === userId && m.receiver_id === otherUserId) ||
          (m.sender_id === otherUserId && m.receiver_id === userId)
        ).sort((a, b) => a.timestamp - b.timestamp);

        // Reset unread count khi xem hội thoại
        const chats = loadMockData('mock_chats_v2', {});
        if (chats[userId]) {
          const chatObj = chats[userId].find(c => c.user_id === otherUserId);
          if (chatObj) chatObj.unread_count = 0;
          saveMockData('mock_chats_v2', chats);
        }

        resolve({ messages: conversation });
      }, 200);
    });
  },

  // Lấy danh sách chat
  async getChatList(userId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const chats = loadMockData('mock_chats_v2', {});
        const userChats = chats[userId] || [];
        resolve({ chats: userChats });
      }, 200);
    });
  }
};

/**
 * Dịch vụ Calling (MOCKED)
 */
let currentMockCall = null;

export const callingService = {
  async initiateCall(callerId, receiverId, callType = 'audio') {
    return new Promise((resolve) => {
      setTimeout(() => {
        currentMockCall = {
          id: 'call_' + Date.now(),
          caller_id: callerId,
          receiver_id: receiverId,
          call_type: callType,
          status: 'ringing',
          timestamp: Date.now()
        };
        resolve(currentMockCall);
      }, 300);
    });
  },
  async acceptCall(callId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (currentMockCall && currentMockCall.id === callId) currentMockCall.status = 'active';
        resolve({ success: true });
      }, 200);
    });
  },
  async declineCall(callId) {
    return new Promise((resolve) => {
      setTimeout(() => { currentMockCall = null; resolve({ success: true }); }, 200);
    });
  },
  async endCall(callId) {
    return new Promise((resolve) => {
      setTimeout(() => { currentMockCall = null; resolve({ success: true }); }, 200);
    });
  },
  async getCallHistory(userId) {
    return new Promise((resolve) => {
      setTimeout(() => { resolve({ calls: [] }); }, 200);
    });
  }
};
