import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './apiConfig';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;

  private constructor() { }

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect() {
    console.log("Trying to connect with socket ::::", SOCKET_URL)
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected successfully:', this.socket?.id);
      });

      this.socket.on('connected', () => {
        console.log('✅ Backend confirmed connection:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });

      this.socket.on('reconnect', (attempt) => {
        console.log('🔄 Socket reconnected after', attempt, 'attempts');
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('❌ Socket reconnection failed:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Helper methods for common subscriptions
  subscribeToIndexes(data: any) {
    this.socket?.emit('subscribe_indexes', data);
  }

  subscribeToStockPrice(data: any) {
    this.socket?.emit('subscribe_stock_price', data);
  }

  subscribeToGainers(data: any) {
    this.socket?.emit('subscribe_gainers', data);
  }

  subscribeToOrder(data: any) {
    this.socket?.emit('subscribe_order', data);
  }

  unsubscribeFromStock(stockId: string) {
    this.socket?.emit('unsubscribe_stock', stockId);
  }

  subscribeToChart(data: { symbol: string; interval: string; period: string }) {
    this.socket?.emit('subscribe_chart', data);
  }

  unsubscribeFromChart() {
    this.socket?.emit('unsubscribe_chart', {});
  }
}

export default SocketService;
