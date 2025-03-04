'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { Alert } from 'react-native';
import { router } from 'expo-router';

// IP fija confirmada - utiliza tu dirección IP real
const getServerUrl = () => {
  return 'http://192.168.1.10:3000';
};

export function useSocketConnection(gameCode, nickname) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState(null);
  const socketRef = useRef(null);
  const connectionAttemptsRef = useRef(0);
  const MAX_CONNECTION_ATTEMPTS = 5;

  // Conectar al socket cuando se monta el componente
  useEffect(() => {
    if (!gameCode || !nickname) {
      console.log('No game code or nickname provided');
      return;
    }

    const serverUrl = getServerUrl();
    console.log(
      `Connecting to ${serverUrl} with game code ${gameCode} as ${nickname}`
    );

    try {
      // Limpiar cualquier socket previo
      if (socketRef.current) {
        console.log('Cerrando conexión previa');
        socketRef.current.disconnect();
      }

      // Crear socket con configuración robusta
      console.log('Intentando nueva conexión...');
      const newSocket = io(serverUrl, {
        transports: ['websocket'], // Usar solo websocket para mejor rendimiento
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 10, // Aumentado para más intentos
        reconnectionDelay: 1000,
        timeout: 30000, // Timeout más largo (30 segundos)
        path: '/socket.io',
      });

      socketRef.current = newSocket;

      // Registro de eventos detallado
      newSocket.onAny((event, ...args) => {
        console.log(`[SOCKET EVENT] ${event}:`, JSON.stringify(args));
      });

      // Manejadores de conexión
      newSocket.on('connect', () => {
        console.log('¡Conectado al servidor Socket.IO!', {
          id: newSocket.id,
          transport: newSocket.io.engine.transport.name,
        });
        setConnected(true);
        setError(null);
        setSocket(newSocket);
        connectionAttemptsRef.current = 0; // Resetear contador de intentos

        // Unirse como controlador
        console.log('Uniéndose como controlador:', { gameCode, nickname });
        newSocket.emit('join_controller', {
          roomCode: gameCode,
          nickname: nickname,
        });
      });

      // Manejo de errores mejorado
      newSocket.on('connect_error', (err) => {
        console.error('Error de conexión:', {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });

        connectionAttemptsRef.current += 1;

        if (connectionAttemptsRef.current >= MAX_CONNECTION_ATTEMPTS) {
          setError(`Conexión fallida: ${err.message || 'Error desconocido'}`);

          // Mostrar alerta al usuario
          Alert.alert(
            'Error de conexión',
            `No se pudo conectar al servidor (${serverUrl}).\n\nVerifica que:\n` +
              `1. El servidor esté ejecutándose\n` +
              `2. Tu dispositivo esté en la misma red WiFi\n` +
              `3. La IP del servidor sea correcta\n\n` +
              `Error: ${err.message}`,
            [{ text: 'OK' }]
          );
        } else {
          console.log(
            `Intento ${connectionAttemptsRef.current}/${MAX_CONNECTION_ATTEMPTS} fallido. Reintentando...`
          );
        }

        setConnected(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.warn('Socket desconectado:', reason);
        setConnected(false);

        // Intentar reconectar automáticamente para ciertos errores
        if (reason === 'io server disconnect' || reason === 'transport close') {
          console.log('Reconectando automáticamente...');
          setTimeout(() => {
            newSocket.connect();
          }, 1000);
        }
      });

      // Eventos del juego
      newSocket.on('controller_joined', (data) => {
        console.log('Controller joined event:', data);
        if (data.players) {
          setPlayers(data.players);
        }
      });

      newSocket.on('player_ready', (data) => {
        console.log('Player ready event:', data);
        if (data.playerId === newSocket.id) {
          setIsReady(data.isReady);
        }

        // Actualizar lista de jugadores con estado "listo"
        setPlayers((prevPlayers) => {
          return prevPlayers.map((player) => {
            if (player.id === data.playerId) {
              return { ...player, isReady: data.isReady };
            }
            return player;
          });
        });
      });

      newSocket.on('game_started', (data) => {
        console.log('Game started event:', data);
        setGameStarted(true);
        setGameStatus('playing');
        if (data.category) setSelectedCategory(data.category);
        if (data.categoryType) setSelectedCategoryType(data.categoryType);
      });

      newSocket.on('new_question', (data) => {
        console.log('New question event:', data);
        setCurrentQuestion(data);
      });

      newSocket.on('error', (data) => {
        console.error('Socket error event:', data);
        setError(data.message || 'Error desconocido');

        // Mostrar error al usuario
        Alert.alert('Error', data.message || 'Error desconocido del servidor', [
          { text: 'OK' },
        ]);
      });

      // Conectar explícitamente
      newSocket.connect();

      // Limpieza al desmontar
      return () => {
        console.log('Limpiando conexión socket');
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } catch (err) {
      console.error('Error fatal al crear el socket:', err);
      setError(
        `Error de inicialización: ${
          err instanceof Error ? err.message : 'Error desconocido'
        }`
      );

      // Mostrar error al usuario
      Alert.alert(
        'Error de conexión',
        `No se pudo inicializar la conexión: ${
          err instanceof Error ? err.message : 'Error desconocido'
        }`,
        [{ text: 'OK' }]
      );
    }
  }, [gameCode, nickname]);

  // Toggle ready state
  const toggleReady = useCallback(() => {
    if (!socketRef.current || !connected) {
      console.error('Cannot toggle ready: not connected');
      return;
    }

    const newReadyState = !isReady;
    setIsReady(newReadyState);

    console.log('Toggling ready state:', newReadyState);
    socketRef.current.emit('toggle_ready', {
      roomCode: gameCode,
      isReady: newReadyState,
    });

    // Navegar inmediatamente a ControllerScreen cuando el usuario se marca como listo
    if (newReadyState) {
      console.log('Usuario marcado como listo, navegando a ControllerScreen');
      router.push({
        pathname: '/ControllerScreen',
        params: {
          gameCode,
          nickname,
        },
      });
    }
  }, [connected, isReady, gameCode, router, nickname]);

  // Submit answer to current question
  const submitAnswer = useCallback(
    (answer) => {
      if (!socketRef.current || !connected || !gameStarted) {
        console.error(
          'Cannot submit answer: not connected or game not started'
        );
        return;
      }

      console.log('Submitting answer:', answer);
      socketRef.current.emit('submit_answer', {
        roomCode: gameCode,
        answer: answer,
      });
    },
    [connected, gameStarted, gameCode]
  );

  // Leave room
  const leaveRoom = useCallback(() => {
    if (!socketRef.current || !connected) {
      console.error('Cannot leave room: not connected');
      return;
    }

    socketRef.current.emit('leave_room', { roomCode: gameCode });
  }, [connected, gameCode]);

  // Retry connection - implementación mejorada
  const retryConnection = useCallback(() => {
    console.log('Intentando restablecer la conexión...');

    // Limpiar socket actual
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Resetear estados para forzar reconexión
    connectionAttemptsRef.current = 0;
    setSocket(null);
    setConnected(false);
    setError(null);

    // La reconexión ocurrirá automáticamente al cambiar estos estados
    // ya que el useEffect principal volverá a ejecutarse
  }, []);

  return {
    socket,
    connected,
    error,
    players,
    isReady,
    gameStarted,
    currentQuestion,
    gameStatus,
    selectedCategory,
    selectedCategoryType,
    toggleReady,
    submitAnswer,
    leaveRoom,
    retryConnection, // Ahora incluimos esta función
    serverUrl: getServerUrl(),
  };
}
