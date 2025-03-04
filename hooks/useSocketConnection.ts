'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import { Alert } from 'react-native';

// IMPORTANTE: Obtiene la URL del servidor utilizando la IP del dispositivo
const getServerUrl = () => {
  try {
    // Intenta obtener la IP del host de depuración de Expo
    const localhost = Constants.manifest?.debuggerHost?.split(':')[0];
    // Si se encuentra, usa esa IP, de lo contrario usa un valor predeterminado
    return localhost ? `http://${localhost}:3000` : 'http://192.168.1.10:3000';
  } catch (error) {
    console.error('Error al obtener la URL del servidor:', error);
    return 'http://192.168.1.10:3000'; // IP de respaldo
  }
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
    // Si no hay código de juego o nickname, no intentar conectar
    if (!gameCode || !nickname) {
      console.log('No se proporcionó código de juego o nickname');
      return;
    }

    // Obtener la URL del servidor
    const serverUrl = getServerUrl();
    console.log(
      `Conectando a ${serverUrl} con código ${gameCode} como ${nickname}`
    );

    try {
      // Limpiar cualquier socket previo
      if (socketRef.current) {
        console.log('Desconectando socket previo');
        socketRef.current.disconnect();
      }

      // Crear socket con configuración robusta
      console.log('Creando nueva conexión socket');
      const newSocket = io(serverUrl, {
        transports: ['websocket'], // Usar solo websocket para evitar problemas CORS
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        path: '/socket.io', // Asegurar que coincida con la ruta del servidor
      });

      socketRef.current = newSocket;

      // Registro de eventos detallado
      newSocket.onAny((event, ...args) => {
        console.log(`[EVENTO SOCKET] ${event}:`, JSON.stringify(args));
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
        connectionAttemptsRef.current = 0; // Reiniciar contador de intentos

        // Unirse como controlador con más logging
        console.log('Uniéndose como controlador:', { gameCode, nickname });
        newSocket.emit('join_controller', {
          roomCode: gameCode,
          nickname: nickname,
        });
      });

      // Manejo de errores mejorado
      newSocket.on('connect_error', (err) => {
        console.error('Detalles del error de conexión socket:', {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });

        connectionAttemptsRef.current += 1;

        if (connectionAttemptsRef.current >= MAX_CONNECTION_ATTEMPTS) {
          const errorMsg = `Conexión fallida después de ${MAX_CONNECTION_ATTEMPTS} intentos: ${
            err.message || 'Error desconocido'
          }`;
          console.error(errorMsg);
          setError(errorMsg);

          // Mostrar alerta al usuario
          Alert.alert(
            'Error de conexión',
            `No se pudo conectar al servidor. Comprueba tu conexión a internet y que el servidor esté funcionando. Error: ${err.message}`,
            [
              {
                text: 'Reintentar',
                onPress: () => {
                  connectionAttemptsRef.current = 0;
                  retryConnection();
                },
              },
            ]
          );
        } else {
          console.log(
            `Intento de conexión ${connectionAttemptsRef.current} fallido. Reintentando...`
          );
          // El cliente socket.io intentará reconectar automáticamente
        }

        setConnected(false);
      });

      // Evento de desconexión
      newSocket.on('disconnect', (reason) => {
        console.warn('Socket desconectado:', reason);
        setConnected(false);

        // Intentar reconectar para ciertos motivos de desconexión
        if (reason === 'io server disconnect' || reason === 'transport close') {
          console.log('Intentando reconectar automáticamente...');
          setTimeout(() => {
            newSocket.connect();
          }, 1000);
        }
      });

      // Evento específico para confirmación de conexión establecida
      newSocket.on('connection_established', (data) => {
        console.log('Conexión establecida confirmada:', data);
        // Puedes hacer algo especial aquí si es necesario
      });

      // Evento para cuando el controlador se une correctamente
      newSocket.on('controller_joined', (data) => {
        console.log('Evento controller_joined recibido:', data);

        if (data && data.players) {
          setPlayers(data.players);
        } else if (data && data.mobileControllers) {
          // Algunos servidores pueden devolver controllers separados de players
          setPlayers(data.mobileControllers);
        }

        // Actualizar estado de juego si viene en la respuesta
        if (data && data.gameStatus) {
          setGameStatus(data.gameStatus);
        }
      });

      // Evento para cambio de estado "listo"
      newSocket.on('player_ready', (data) => {
        console.log('Evento player_ready recibido:', data);

        if (data && data.playerId === newSocket.id) {
          setIsReady(data.isReady);
        }

        // Actualizar lista de jugadores con estado "listo"
        setPlayers((prevPlayers) => {
          return prevPlayers.map((player) => {
            if (
              player.id === data.playerId ||
              player.playerId === data.playerId
            ) {
              return { ...player, isReady: data.isReady };
            }
            return player;
          });
        });
      });

      // Evento para inicio de juego
      newSocket.on('game_started', (data) => {
        console.log('Evento game_started recibido:', data);
        setGameStarted(true);
        setGameStatus('playing');

        if (data && data.category) {
          setSelectedCategory(data.category);
        }

        if (data && data.categoryType) {
          setSelectedCategoryType(data.categoryType);
        }
      });

      // Evento para nueva pregunta
      newSocket.on('new_question', (data) => {
        console.log('Evento new_question recibido:', data);
        setCurrentQuestion(data);
      });

      // Evento para manejo de errores del servidor
      newSocket.on('error', (data) => {
        console.error('Evento de error recibido del servidor:', data);
        const errorMessage =
          data && typeof data === 'object' ? data.message : 'Error desconocido';
        setError(errorMessage);

        // Mostrar error al usuario si es importante
        if (data && data.code === 'ROOM_NOT_FOUND') {
          Alert.alert(
            'Sala no encontrada',
            'El código de sala ingresado no existe. Por favor, verifica el código e intenta nuevamente.',
            [{ text: 'OK' }]
          );
        }
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
      const errorMsg = `Error de inicialización: ${
        err instanceof Error ? err.message : 'Error desconocido'
      }`;
      setError(errorMsg);

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

  // Cambiar estado "listo"
  const toggleReady = useCallback(() => {
    if (!socketRef.current || !connected) {
      console.error('No se puede cambiar estado listo: no conectado');
      return;
    }

    const newReadyState = !isReady;
    setIsReady(newReadyState);

    console.log('Cambiando estado listo a:', newReadyState);
    socketRef.current.emit('toggle_ready', {
      roomCode: gameCode,
      isReady: newReadyState,
    });
  }, [connected, isReady, gameCode]);

  // Enviar respuesta a pregunta actual
  const submitAnswer = useCallback(
    (answer) => {
      if (!socketRef.current || !connected || !gameStarted) {
        console.error(
          'No se puede enviar respuesta: no conectado o juego no iniciado'
        );
        return;
      }

      console.log('Enviando respuesta:', answer);
      socketRef.current.emit('submit_answer', {
        roomCode: gameCode,
        answer: answer,
      });
    },
    [connected, gameStarted, gameCode]
  );

  // Abandonar sala
  const leaveRoom = useCallback(() => {
    if (!socketRef.current || !connected) {
      console.error('No se puede abandonar sala: no conectado');
      return;
    }

    console.log('Abandonando sala:', gameCode);
    socketRef.current.emit('leave_room', { roomCode: gameCode });

    // Puedes decidir si quieres resetear algún estado aquí
    // Por ejemplo, podrías querer mantener el error para mostrarlo
    setPlayers([]);
    setIsReady(false);
    setGameStarted(false);
    setCurrentQuestion(null);
    setGameStatus('waiting');
    setSelectedCategory(null);
    setSelectedCategoryType(null);
  }, [connected, gameCode]);

  // Reintentar conexión
  const retryConnection = useCallback(() => {
    if (socketRef.current) {
      console.log('Desconectando socket para reintentar');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Resetear contador de intentos
    connectionAttemptsRef.current = 0;

    // Forzar re-renderizado del componente para activar useEffect de nuevo
    setSocket(null);
    setConnected(false);
    setError(null);

    console.log('Reintentando conexión...');
  }, []);

  // Solicitar siguiente pregunta
  const requestNextQuestion = useCallback(() => {
    if (!socketRef.current || !connected || !gameStarted) {
      console.error(
        'No se puede solicitar siguiente pregunta: no conectado o juego no iniciado'
      );
      return;
    }

    console.log('Solicitando siguiente pregunta para sala:', gameCode);
    socketRef.current.emit('request_next_question', { roomCode: gameCode });
  }, [connected, gameStarted, gameCode]);

  // Solicitar estado actual del juego (útil para recuperar estado después de reconexión)
  const requestGameStatus = useCallback(() => {
    if (!socketRef.current || !connected) {
      console.error('No se puede solicitar estado del juego: no conectado');
      return;
    }

    console.log('Solicitando estado actual del juego para sala:', gameCode);
    socketRef.current.emit('request_game_status', { roomCode: gameCode });
  }, [connected, gameCode]);

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
    retryConnection,
    requestNextQuestion,
    requestGameStatus,
    serverUrl: getServerUrl(),
  };
}
