import { io } from 'socket.io-client';

// Conexión WebSocket con soporte para credenciales/cookies
export const socket = io(window.location.origin, {
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

socket.on('connect', () => {
  console.log('⚡ Conectado al servidor WebSocket de RUTABOL-SCZ');
});

socket.on('disconnect', () => {
  console.log('🔌 Desconectado de WebSockets. Reintentando automáticamente...');
});
