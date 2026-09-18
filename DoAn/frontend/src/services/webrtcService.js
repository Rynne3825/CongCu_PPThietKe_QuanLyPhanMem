/**
 * WebRTC Service - Gọi thoại/video thực tế 2 chiều
 * Sử dụng localStorage làm kênh signaling (hoạt động giữa các tab cùng domain)
 */

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const SIGNAL_KEY = 'medi_webrtc_signal';

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.myId = null;
    this.peerId = null;
    this.callType = 'audio';
    this._signalHandler = null;
    this._pendingCandidates = [];

    // Callbacks
    this.onIncomingCall = null;   // (signal) => void
    this.onCallAnswered = null;   // () => void
    this.onCallDeclined = null;   // () => void
    this.onCallEnded = null;      // () => void
    this.onRemoteStream = null;   // (stream) => void
    this.onError = null;          // (msg) => void
  }

  // Khởi tạo service — phải gọi khi component mount
  init(myId) {
    this.myId = myId;
    // Xóa tín hiệu cũ
    this._removeOldSignal();

    this._signalHandler = (e) => {
      if (e.key !== SIGNAL_KEY) return;
      if (!e.newValue) return;
      try {
        const signal = JSON.parse(e.newValue);
        if (signal.to !== this.myId) return;
        this._handleSignal(signal);
      } catch (err) { /* ignore */ }
    };
    window.addEventListener('storage', this._signalHandler);
  }

  // Dọn dẹp khi component unmount
  destroy() {
    this._cleanup();
    if (this._signalHandler) {
      window.removeEventListener('storage', this._signalHandler);
      this._signalHandler = null;
    }
  }

  // ===== PUBLIC: Người GỌI =====

  async initiateCall(peerId, callType) {
    this.peerId = peerId;
    this.callType = callType;

    try {
      this.localStream = await this._getLocalStream(callType);
      const pc = this._createPeerConnection();

      this.localStream.getTracks().forEach(t => pc.addTrack(t, this.localStream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this._sendSignal({
        type: 'call-request',
        from: this.myId,
        to: peerId,
        callType,
        sdp: offer
      });

      return this.localStream;
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Vui lòng cho phép truy cập camera/microphone trong trình duyệt.'
        : `Lỗi bắt đầu cuộc gọi: ${err.message}`;
      if (this.onError) this.onError(msg);
      this._cleanup();
      throw err;
    }
  }

  // ===== PUBLIC: Người NHẬN =====

  async acceptCall(incomingSignal) {
    this.peerId = incomingSignal.from;
    this.callType = incomingSignal.callType;

    try {
      this.localStream = await this._getLocalStream(incomingSignal.callType);
      const pc = this._createPeerConnection();

      this.localStream.getTracks().forEach(t => pc.addTrack(t, this.localStream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal.sdp));

      // Xử lý ICE candidates đã queue trước đó
      for (const c of this._pendingCandidates) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      }
      this._pendingCandidates = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this._sendSignal({
        type: 'call-answer',
        from: this.myId,
        to: incomingSignal.from,
        sdp: answer
      });

      return this.localStream;
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Vui lòng cho phép truy cập camera/microphone.'
        : `Lỗi chấp nhận cuộc gọi: ${err.message}`;
      if (this.onError) this.onError(msg);
      this._cleanup();
      throw err;
    }
  }

  declineCall(peerId) {
    this._sendSignal({ type: 'call-decline', from: this.myId, to: peerId });
    this._cleanup();
  }

  endCall() {
    if (this.peerId) {
      this._sendSignal({ type: 'call-end', from: this.myId, to: this.peerId });
    }
    this._cleanup();
  }

  toggleMute(muted) {
    this.localStream?.getAudioTracks().forEach(t => { t.enabled = !muted; });
  }

  toggleCamera(enabled) {
    this.localStream?.getVideoTracks().forEach(t => { t.enabled = enabled; });
  }

  // ===== PRIVATE =====

  _sendSignal(signal) {
    localStorage.setItem(SIGNAL_KEY, JSON.stringify({ ...signal, _ts: Date.now() }));
  }

  _removeOldSignal() {
    localStorage.removeItem(SIGNAL_KEY);
  }

  async _handleSignal(signal) {
    switch (signal.type) {
      case 'call-request':
        if (this.onIncomingCall) this.onIncomingCall(signal);
        break;

      case 'call-answer':
        if (this.peerConnection) {
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(signal.sdp)
          ).catch(() => {});
          // Flush pending ICE
          for (const c of this._pendingCandidates) {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
          this._pendingCandidates = [];
          if (this.onCallAnswered) this.onCallAnswered();
        }
        break;

      case 'ice-candidate':
        if (this.peerConnection && this.peerConnection.remoteDescription) {
          await this.peerConnection.addIceCandidate(
            new RTCIceCandidate(signal.candidate)
          ).catch(() => {});
        } else {
          this._pendingCandidates.push(signal.candidate);
        }
        break;

      case 'call-decline':
        this._cleanup();
        if (this.onCallDeclined) this.onCallDeclined();
        break;

      case 'call-end':
        this._cleanup();
        if (this.onCallEnded) this.onCallEnded();
        break;
    }
  }

  async _getLocalStream(callType) {
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: callType === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false
    });
  }

  _createPeerConnection() {
    this.peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    this.peerConnection.onicecandidate = (e) => {
      if (e.candidate && this.peerId) {
        this._sendSignal({
          type: 'ice-candidate',
          from: this.myId,
          to: this.peerId,
          candidate: e.candidate
        });
      }
    };

    this.peerConnection.ontrack = (e) => {
      if (this.onRemoteStream && e.streams[0]) {
        this.onRemoteStream(e.streams[0]);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (
        this.peerConnection?.connectionState === 'disconnected' ||
        this.peerConnection?.connectionState === 'failed'
      ) {
        this._cleanup();
        if (this.onCallEnded) this.onCallEnded();
      }
    };

    return this.peerConnection;
  }

  _cleanup() {
    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream = null;
    this.peerConnection?.close();
    this.peerConnection = null;
    this.peerId = null;
    this._pendingCandidates = [];
  }
}

export const webrtcService = new WebRTCService();
