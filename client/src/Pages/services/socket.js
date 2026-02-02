import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.isConnected) return;
    
    this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      
      // Join user's room
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        this.socket.emit('join', user.id);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Event listeners
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export default new SocketService();