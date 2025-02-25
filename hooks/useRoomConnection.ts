// src/hooks/useRoomConnection.js
import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { io } from 'socket.io-client';

// Normalmente, esta URL vendría de las variables de entorno o config
const API_URL = 'https://your-backend-server.com';

export const useRoomConnection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Referencia al socket para mantenerlo a través de re-renders
  const socketRef = useRef(null);

  // Inicializar la conexión de socket
  useEffect(() => {
    // Crear el socket solo si no existe
    if (!socketRef.current) {
      socketRef.current = io(API_URL, {
        transports: ['websocket'],
        autoConnect: true,
        query: {
          platform: Platform.OS,
        },
      });

      // Event listeners
      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socketRef.current.on('error', (err) => {
        console.error('Socket error:', err);
        setError('Error de conexión. Inténtalo de nuevo.');
      });
    }

    // Limpiar al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Función para crear una nueva sala
  const createRoom = async (nickname) => {
    setIsLoading(true);
    setError(null);

    try {
      // En la implementación real, esto se haría con una llamada al socket
      return new Promise((resolve) => {
        // Simular delay de red
        setTimeout(() => {
          // Generar código aleatorio para la sala
          const roomCode = generateRoomCode();

          // Emitir el evento para crear la sala
          socketRef.current.emit('create_room', { nickname, roomCode });

          // Resolver con el código de la sala
          resolve({ roomCode });
        }, 1000);
      });
    } catch (err) {
      setError('No se pudo crear la sala. Inténtalo de nuevo.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para unirse a una sala existente
  const joinRoom = async (nickname, roomCode) => {
    setIsLoading(true);
    setError(null);

    try {
      // En la implementación real, esto se haría con una llamada al socket
      return new Promise((resolve, reject) => {
        // Simular delay de red
        setTimeout(() => {
          // Validar que el código de sala exista (simulado)
          if (roomCode === '000000') {
            reject(new Error('Código de sala no válido'));
            return;
          }

          // Emitir el evento para unirse a la sala
          socketRef.current.emit('join_room', { nickname, roomCode });

          // Resolver la promesa
          resolve();
        }, 1000);
      });
    } catch (err) {
      setError(
        'No se pudo unir a la sala. Verifica el código e inténtalo de nuevo.'
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para iniciar el juego (solo host)
  const startGame = async (roomCode) => {
    setIsLoading(true);
    setError(null);

    try {
      // En la implementación real, esto se haría con una llamada al socket
      return new Promise((resolve) => {
        // Simular delay de red
        setTimeout(() => {
          // Emitir el evento para iniciar el juego
          socketRef.current.emit('start_game', { roomCode });

          // Resolver la promesa
          resolve();
        }, 1000);
      });
    } catch (err) {
      setError('No se pudo iniciar el juego. Inténtalo de nuevo.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para salir de la sala
  const leaveRoom = async (roomCode, nickname) => {
    try {
      // Emitir el evento para salir de la sala
      socketRef.current.emit('leave_room', { roomCode, nickname });
      return Promise.resolve();
    } catch (err) {
      console.error('Error al salir de la sala:', err);
      return Promise.reject(err);
    }
  };

  // Función para obtener los jugadores de una sala
  const getRoomPlayers = async (roomCode) => {
    setIsLoading(true);

    try {
      // En la implementación real, esto se haría con una llamada al socket
      return new Promise((resolve) => {
        // Simular delay de red
        setTimeout(() => {
          // Simular lista de jugadores
          const mockPlayers = [
            { id: '1', nickname: 'Anfitrión', isHost: true, score: 0 },
            { id: '2', nickname: 'Jugador 2', isHost: false, score: 0 },
            // En una implementación real, esto vendría del servidor
          ];

          resolve(mockPlayers);
        }, 500);
      });
    } catch (err) {
      console.error('Error al obtener jugadores:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Función para suscribirse a actualizaciones de jugadores en la sala
  const subscribeToPlayerUpdates = (roomCode, callback) => {
    if (!socketRef.current) {
      console.error('Socket no inicializado');
      return () => {};
    }

    // Suscribirse al evento de actualización de jugadores
    socketRef.current.on('player_update', (data) => {
      if (data.roomCode === roomCode) {
        callback(data.players);
      }
    });

    // Devolver función para desuscribirse
    return () => {
      socketRef.current.off('player_update');
    };
  };

  // Función para suscribirse a eventos del juego
  const subscribeToGameEvents = (roomCode, callbacks) => {
    if (!socketRef.current) {
      console.error('Socket no inicializado');
      return () => {};
    }

    // Suscribirse a los eventos del juego
    if (callbacks.onGameStart) {
      socketRef.current.on('game_start', (data) => {
        if (data.roomCode === roomCode) {
          callbacks.onGameStart(data);
        }
      });
    }

    if (callbacks.onRoundStart) {
      socketRef.current.on('round_start', (data) => {
        if (data.roomCode === roomCode) {
          callbacks.onRoundStart(data);
        }
      });
    }

    if (callbacks.onRoundEnd) {
      socketRef.current.on('round_end', (data) => {
        if (data.roomCode === roomCode) {
          callbacks.onRoundEnd(data);
        }
      });
    }

    if (callbacks.onGameEnd) {
      socketRef.current.on('game_end', (data) => {
        if (data.roomCode === roomCode) {
          callbacks.onGameEnd(data);
        }
      });
    }

    // Devolver función para desuscribirse
    return () => {
      socketRef.current.off('game_start');
      socketRef.current.off('round_start');
      socketRef.current.off('round_end');
      socketRef.current.off('game_end');
    };
  };

  // Función para enviar una respuesta
  const submitAnswer = async (roomCode, nickname, answer, timeElapsed) => {
    try {
      socketRef.current.emit('submit_answer', {
        roomCode,
        nickname,
        answer,
        timeElapsed,
      });

      return Promise.resolve();
    } catch (err) {
      console.error('Error al enviar respuesta:', err);
      return Promise.reject(err);
    }
  };

  // Función auxiliar para generar código de sala aleatorio
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  return {
    isLoading,
    error,
    isConnected,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
    getRoomPlayers,
    subscribeToPlayerUpdates,
    subscribeToGameEvents,
    submitAnswer,
  };
};
