'use client'
import { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import SocketService from './socketService';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(() => {
    // If we're on the client and already connected, return it immediately
    if (typeof window !== 'undefined') {
      return SocketService.getInstance().getSocket();
    }
    return null;
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketService = SocketService.getInstance();
    const socketInstance = socketService.connect();
    setSocket(socketInstance);
    console.log("🔌 [useSocket] Socket initialized:", socketInstance ? 'YES' : 'NO');

    if (socketInstance) {
      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);
      const onConnectError = () => setIsConnected(false);

      socketInstance.on('connect', onConnect);
      socketInstance.on('disconnect', onDisconnect);
      socketInstance.on('connect_error', onConnectError);

      if (socketInstance.connected) {
        setIsConnected(true);
      }

      return () => {
        socketInstance.off('connect', onConnect);
        socketInstance.off('disconnect', onDisconnect);
        socketInstance.off('connect_error', onConnectError);
      };
    }
  }, []);

  const socketService = SocketService.getInstance();

  const subscribeToIndexes = useCallback((data: any) => socketService.subscribeToIndexes(data), []);
  const subscribeToStockPrice = useCallback((data: any) => socketService.subscribeToStockPrice(data), []);
  const subscribeToGainers = useCallback((data: any) => socketService.subscribeToGainers(data), []);
  const subscribeToOrder = useCallback((data: any) => socketService.subscribeToOrder(data), []);
  const unsubscribeFromStock = useCallback((stockId: string) => socketService.unsubscribeFromStock(stockId), []);
  const subscribeToChart = useCallback((data: { symbol: string; interval: string; period: string }) => socketService.subscribeToChart(data), []);
  const unsubscribeFromChart = useCallback(() => socketService.unsubscribeFromChart(), []);

  return {
    socket,
    isConnected,
    subscribeToIndexes,
    subscribeToStockPrice,
    subscribeToGainers,
    subscribeToOrder,
    unsubscribeFromStock,
    subscribeToChart,
    unsubscribeFromChart,
  };
};
