from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from datetime import datetime
from typing import List, Optional

app = FastAPI()

# Cấu hình CORS để Frontend (Vue.js) có thể gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# DATABASE GIẢ LẬP CHO MESSAGING
# ==========================================
messages_db = []  # Lưu trữ tin nhắn
calls_db = []      # Lưu trữ lịch sử cuộc gọi
users_db = {
    "benhnhan": {"id": "benhnhan", "name": "Nguyễn Văn Bệnh Nhân", "role": "patient"},
    "admin": {"id": "admin", "name": "BS. Nguyễn Văn A", "role": "doctor"}
}

# ==========================================
# 1. CẤU HÌNH AI CHATBOT (MediSmart AI)
# ==========================================
genai.configure(api_key="AIzaSyA_DÁN_API_KEY_CỦA_BẠN_VÀO_ĐÂY")
model = genai.GenerativeModel('gemini-1.5-flash')

class ChatRequest(BaseModel):
    message: str

class Message(BaseModel):
    sender_id: str
    receiver_id: str
    content: str
    message_type: str = "text"  # text, image, file

class MessageResponse(BaseModel):
    id: int
    sender_id: str
    receiver_id: str
    content: str
    message_type: str
    timestamp: str
    is_read: bool = False

class Call(BaseModel):
    caller_id: str
    receiver_id: str
    call_type: str  # audio, video

class CallResponse(BaseModel):
    id: int
    caller_id: str
    receiver_id: str
    call_type: str
    status: str  # pending, active, ended, declined
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration: int = 0

class PaymentUpdate(BaseModel):
    patient_id: str
    amount: int
    status: str

# ==========================================
# 2. API CHAT RIÊNG GIỮA BỆNH NHÂN VÀ BÁC SĨ
# ==========================================

@app.post("/api/messages/send")
async def send_message(message: Message):
    """Gửi tin nhắn riêng giữa bệnh nhân và bác sĩ"""
    try:
        msg_obj = {
            "id": len(messages_db) + 1,
            "sender_id": message.sender_id,
            "receiver_id": message.receiver_id,
            "content": message.content,
            "message_type": message.message_type,
            "timestamp": datetime.now().isoformat(),
            "is_read": False
        }
        messages_db.append(msg_obj)
        print(f"[CHAT] {message.sender_id} → {message.receiver_id}: {message.content}")
        return MessageResponse(**msg_obj)
    except Exception as e:
        print(f"Lỗi gửi tin nhắn: {e}")
        return {"error": "Gửi tin nhắn thất bại"}

@app.get("/api/messages/conversation/{user_id}/{other_user_id}")
async def get_conversation(user_id: str, other_user_id: str):
    """Lấy danh sách tin nhắn giữa hai người"""
    try:
        conversation = [
            msg for msg in messages_db
            if (msg["sender_id"] == user_id and msg["receiver_id"] == other_user_id) or
               (msg["sender_id"] == other_user_id and msg["receiver_id"] == user_id)
        ]
        # Đánh dấu tin nhắn là đã đọc
        for msg in conversation:
            if msg["receiver_id"] == user_id:
                msg["is_read"] = True
        return {"messages": conversation}
    except Exception as e:
        print(f"Lỗi lấy cuộc hội thoại: {e}")
        return {"error": "Lỗi lấy cuộc hội thoại", "messages": []}

@app.get("/api/messages/list/{user_id}")
async def get_user_chats(user_id: str):
    """Lấy danh sách người dùng đã chat (phòng chat)"""
    try:
        users_contacted = set()
        for msg in messages_db:
            if msg["sender_id"] == user_id:
                users_contacted.add(msg["receiver_id"])
            elif msg["receiver_id"] == user_id:
                users_contacted.add(msg["sender_id"])
        
        # Lấy thông tin các người đã chat
        chat_list = []
        for other_user_id in users_contacted:
            if other_user_id in users_db:
                # Lấy tin nhắn cuối cùng
                last_msg = None
                unread_count = 0
                for msg in reversed(messages_db):
                    if (msg["sender_id"] == user_id and msg["receiver_id"] == other_user_id) or \
                       (msg["sender_id"] == other_user_id and msg["receiver_id"] == user_id):
                        if last_msg is None:
                            last_msg = msg
                        if msg["receiver_id"] == user_id and not msg["is_read"]:
                            unread_count += 1
                
                chat_list.append({
                    "user_id": other_user_id,
                    "name": users_db[other_user_id]["name"],
                    "role": users_db[other_user_id]["role"],
                    "last_message": last_msg["content"] if last_msg else "",
                    "last_timestamp": last_msg["timestamp"] if last_msg else "",
                    "unread_count": unread_count
                })
        
        return {"chats": chat_list}
    except Exception as e:
        print(f"Lỗi lấy danh sách chat: {e}")
        return {"error": "Lỗi lấy danh sách chat", "chats": []}

# ==========================================
# 3. API CUỘC GỌI (AUDIO/VIDEO)
# ==========================================

@app.post("/api/calls/initiate")
async def initiate_call(call: Call):
    """Bắt đầu cuộc gọi"""
    try:
        call_obj = {
            "id": len(calls_db) + 1,
            "caller_id": call.caller_id,
            "receiver_id": call.receiver_id,
            "call_type": call.call_type,
            "status": "pending",
            "start_time": datetime.now().isoformat(),
            "end_time": None,
            "duration": 0
        }
        calls_db.append(call_obj)
        print(f"[CALL] {call.caller_id} gọi {call.receiver_id} - {call.call_type}")
        return CallResponse(**call_obj)
    except Exception as e:
        print(f"Lỗi bắt đầu cuộc gọi: {e}")
        return {"error": "Không thể bắt đầu cuộc gọi"}

@app.put("/api/calls/{call_id}/accept")
async def accept_call(call_id: int):
    """Chấp nhận cuộc gọi"""
    try:
        for call in calls_db:
            if call["id"] == call_id:
                call["status"] = "active"
                print(f"[CALL] Cuộc gọi {call_id} được chấp nhận")
                return {"status": "success", "message": "Đã chấp nhận cuộc gọi"}
        return {"status": "error", "message": "Không tìm thấy cuộc gọi"}
    except Exception as e:
        print(f"Lỗi chấp nhận cuộc gọi: {e}")
        return {"status": "error", "message": str(e)}

@app.put("/api/calls/{call_id}/decline")
async def decline_call(call_id: int):
    """Từ chối cuộc gọi"""
    try:
        for call in calls_db:
            if call["id"] == call_id:
                call["status"] = "declined"
                call["end_time"] = datetime.now().isoformat()
                print(f"[CALL] Cuộc gọi {call_id} bị từ chối")
                return {"status": "success", "message": "Đã từ chối cuộc gọi"}
        return {"status": "error", "message": "Không tìm thấy cuộc gọi"}
    except Exception as e:
        print(f"Lỗi từ chối cuộc gọi: {e}")
        return {"status": "error", "message": str(e)}

@app.put("/api/calls/{call_id}/end")
async def end_call(call_id: int):
    """Kết thúc cuộc gọi"""
    try:
        for call in calls_db:
            if call["id"] == call_id:
                call["status"] = "ended"
                call["end_time"] = datetime.now().isoformat()
                call["duration"] = 120
                print(f"[CALL] Cuộc gọi {call_id} kết thúc - Thời lượng: {call['duration']} giây")
                return CallResponse(**call)
        return {"status": "error", "message": "Không tìm thấy cuộc gọi"}
    except Exception as e:
        print(f"Lỗi kết thúc cuộc gọi: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/api/calls/history/{user_id}")
async def get_call_history(user_id: str):
    """Lấy lịch sử cuộc gọi"""
    try:
        history = [
            call for call in calls_db
            if call["caller_id"] == user_id or call["receiver_id"] == user_id
        ]
        return {"calls": history}
    except Exception as e:
        print(f"Lỗi lấy lịch sử cuộc gọi: {e}")
        return {"error": "Lỗi lấy lịch sử", "calls": []}

# ==========================================
# 4. API AI CHAT (GIỮ NGUYÊN)
# ==========================================

@app.post("/api/ai-chat")
async def chat_with_ai(request: ChatRequest):
    try:
        prompt = f"Bạn là bác sĩ tư vấn y tế MediSmart. Hãy trả lời bệnh nhân một cách chuyên nghiệp và ngắn gọn: {request.message}"
        response = model.generate_content(prompt)
        return {"reply": response.text}
    except Exception as e:
        print(f"Lỗi AI: {e}")
        return {"reply": "Bác sĩ AI đang bận khám bệnh, bạn vui lòng thử lại sau ít phút!"}

# ==========================================
# 5. CHỨC NĂNG THANH TOÁN
# ==========================================
async def confirm_payment(payment: PaymentUpdate):
    try:
        # Chỗ này sau này Hiếu sẽ viết code kết nối SQL Server
        # Ví dụ: cursor.execute("UPDATE payments SET status = ? WHERE patient_id = ?", (payment.status, payment.patient_id))
        
        print(f"Xử lý thanh toán: BN {payment.patient_id} - Số tiền: {payment.amount} - Trạng thái: {payment.status}")
        
        return {
            "message": "Thanh toán đã được ghi nhận trên hệ thống",
            "status": "success",
            "transaction_id": "MS-PAY-999"
        }
    except Exception as e:
        print(f"Lỗi thanh toán: {e}")
        return {"message": "Giao dịch thất bại", "status": "error"}

# ==========================================
# 3. KIỂM TRA TRẠNG THÁI HỆ THỐNG
# ==========================================
@app.get("/")
def read_root():
    return {"message": "Hệ thống MediSmart Backend đang hoạt động ổn định!"}

# ==========================================
# 4. CHẠY SERVER
# ==========================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)