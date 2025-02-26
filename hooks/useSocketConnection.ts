'use client';

import { useState, useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Alert } from 'react-native';

const SERVER_URL = 'http://192.168.1.10:5000';

export function useSocketConnection(gameCode: string) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: false,
      extraHeaders: {
        'Access-Control-Allow-Origin': '*',
      },
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Conectado al servidor con ID:', newSocket.id);
      newSocket.emit('join_controller', {
        roomCode: gameCode,
        nickname: `Player${Math.floor(Math.random() * 1000)}`,
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Error de conexión:', error.message);
      Alert.alert(
        'Error de conexión',
        `No se pudo conectar al servidor: ${error.message}. Verifica tu conexión a internet y que el servidor esté funcionando.`
      );
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Desconectado del servidor. Razón:', reason);
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [gameCode]);

  return socket;
}
