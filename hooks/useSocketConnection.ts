'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { Alert, Vibration } from 'react-native';
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
  const [currentScreen, setCurrentScreen] = useState('waiting');
  const [availableOptions, setAvailableOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [questionEnded, setQuestionEnded] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [gamePhase, setGamePhase] = useState('selection'); // 'selection', 'category', 'game'
  const roomCodeRef = useRef(gameCode);
  const [selectionComplete, setSelectionComplete] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleQuestionEnded = (data) => {
      console.log(
        'Question ended event received in useSocketConnection:',
        data
      );

      // Marcar la pregunta como terminada
      setQuestionEnded(true);

      // Establecer la respuesta correcta si está disponible
      if (data && data.correctAnswer) {
        setCorrectAnswer(data.correctAnswer);
      }
    };

    // Escuchar eventos de nueva pregunta - resetear estados
    const handleNewQuestion = (data) => {
      console.log('New question received:', data);

      // Resetear estados para la nueva pregunta
      setQuestionEnded(false);
      setCorrectAnswer(null);

      // Resto del código para manejar nueva pregunta...
    };

    // Escuchar eventos
    socket.on('question_ended', handleQuestionEnded);
    socket.on('new_question', handleNewQuestion);

    return () => {
      socket.off('question_ended', handleQuestionEnded);
      socket.off('new_question', handleNewQuestion);
    };
  }, [socket]);

  // Actualizar la referencia cuando cambia el gameCode
  useEffect(() => {
    roomCodeRef.current = gameCode;
  }, [gameCode]);

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
        reconnectionAttempts: Infinity, // Aumentado para más intentos
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

      // Escuchar eventos de selección de categoría
      newSocket.on('category_selected', (data) => {
        console.log('Category selected event:', data);
        if (data.categoryId) {
          setSelectedCategory(data.categoryId);
        }
      });

      newSocket.on('category_updated', (data) => {
        console.log('Category updated event:', data);
        if (data.categoryId) {
          setSelectedCategory(data.categoryId);
        }
        if (data.categoryType) {
          setSelectedCategoryType(data.categoryType);
        }

        // Marcar que la selección está completa
        if (data.categoryId && data.categoryType) {
          setSelectionComplete(true);
        }
      });
      newSocket.on('game_started', (data) => {
        console.log('🎮 Game started event received:', data);
        setGameStarted(true);
        setGameStatus('playing');
        setGamePhase('game');

        if (data.category) {
          setSelectedCategory(data.category);
        }
        if (data.categoryType) {
          setSelectedCategoryType(data.categoryType);
        }

        // Verificar si tenemos toda la información necesaria para comenzar
        const hasCategory = data.category || selectedCategory;
        const hasCategoryType = data.categoryType || selectedCategoryType;
        const isGameReady = data.gameReady === true;

        console.log('Game start conditions:', {
          hasCategory,
          hasCategoryType,
          isGameReady,
          selectionComplete:
            selectionComplete || (hasCategory && hasCategoryType),
        });

        // Solo navegar si el juego está realmente listo para comenzar
        if (isGameReady && hasCategory && hasCategoryType) {
          setSelectionComplete(true);

          // Navegar a QuizViewScreen cuando recibimos game_started con toda la información
          console.log(
            'Navigating to QuizViewScreen from game_started event - SELECTION COMPLETE'
          );
          router.push({
            pathname: '/QuizViewScreen',
            params: {
              gameCode: roomCodeRef.current,
              nickname: nickname,
            },
          });
        } else {
          console.log('Not navigating yet - waiting for complete selection');
        }
      });

      newSocket.on('new_question', (data) => {
        console.log('New question event received:', JSON.stringify(data));

        // Reset question state
        setQuestionEnded(false);
        setTimeLeft(data.timeLimit || 30);
        setAnswerSubmitted(false);

        // Process and store the question data
        if (data.question && data.options) {
          let formattedOptions = {};

          // Handle both array and object formats for options
          if (Array.isArray(data.options)) {
            formattedOptions = data.options.reduce((acc, option) => {
              if (option && option.id && option.text) {
                acc[option.id] = option.text;
              }
              return acc;
            }, {});
          } else if (typeof data.options === 'object') {
            formattedOptions = data.options;
          }

          setCurrentQuestion({
            text: data.question.question || 'No question text',
            options: formattedOptions,
            id: data.question.id,
            correctOptionId: data.question.correctOptionId,
            order: data.question.order,
            totalQuestions: data.question.totalQuestions,
            timeLimit: data.timeLimit || 30,
          });

          if (data.question.correctOptionId) {
            setCorrectAnswer(data.question.correctOptionId);
          }
        } else {
          // Si data no tiene la estructura esperada, intentamos adaptarla
          setCurrentQuestion({
            text: data.question || 'No question text',
            options: data.options || {},
            timeLimit: data.timeLimit || 30,
          });
        }
      });

      // Mejorado: Manejar el evento answer_result
      newSocket.on('answer_result', (data) => {
        console.log('Answer result received:', data);

        // Actualizar el estado de la respuesta correcta si se proporciona
        if (data.correctAnswer) {
          setCorrectAnswer(data.correctAnswer);
        }

        // Proporcionar feedback táctil basado en si la respuesta es correcta
        if (data.correct) {
          Vibration.vibrate([0, 70, 50, 70]); // Patrón de vibración para respuesta correcta
        } else {
          Vibration.vibrate(150); // Vibración simple para respuesta incorrecta
        }

        // Marcar la pregunta como terminada después de un breve retraso
        setTimeout(() => {
          setQuestionEnded(true);
        }, 1000);
      });

      newSocket.on('timer_update', (timeRemaining) => {
        // Registrar cada actualización con timestamp para depuración
        const now = new Date();
        const timestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
        console.log(`⏱️ [${timestamp}] Timer update: ${timeRemaining}s`);

        // Actualizar solo si es un número válido y diferente al valor actual
        if (typeof timeRemaining === 'number' && timeRemaining >= 0) {
          setTimeLeft(timeRemaining);
        }

        // Si el tiempo llega a cero, marcar la pregunta como terminada
        if (timeRemaining === 0) {
          console.log('⏱️ Timer reached zero, marking question as ended');
          setQuestionEnded(true);
        }
      });

      newSocket.on('question_ended', (data) => {
        console.log('Question ended event received:', data);
        setQuestionEnded(true);

        // Update correct answer from the event data
        if (data && data.correctAnswer) {
          setCorrectAnswer(data.correctAnswer);
        }
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
  }, [gameCode, nickname, router]);

  useEffect(() => {
    if (!socketRef.current || !connected) return;

    // Escuchar cambios de pantalla desde la web
    const handleScreenChange = (data) => {
      console.log('📱 App web cambió pantalla:', data);
      setCurrentScreen(data.screen || 'unknown');
      if (data.options) setAvailableOptions(data.options);
    };

    // Registrar los listeners
    socketRef.current.on('screen_changed', handleScreenChange);

    // Limpiar cuando se desmonte
    return () => {
      if (socketRef.current) {
        socketRef.current.off('screen_changed', handleScreenChange);
      }
    };
  }, [connected]);

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
      roomCode: roomCodeRef.current,
      isReady: newReadyState,
    });

    // Navegar inmediatamente a ControllerScreen cuando el usuario se marca como listo
    if (newReadyState) {
      console.log('Usuario marcado como listo, navegando a ControllerScreen');
      router.push({
        pathname: '/ControllerScreen',
        params: {
          gameCode: roomCodeRef.current,
          nickname: nickname,
        },
      });
    }
  }, [connected, isReady, nickname, router]);

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
      setAnswerSubmitted(true);

      // Enviar la respuesta al servidor
      socketRef.current.emit('submit_answer', {
        roomCode: roomCodeRef.current,
        answer: answer,
      });

      // No establecer questionEnded aquí - esperar a que el servidor lo indique
    },
    [connected, gameStarted]
  );
  // Request current question
  const requestCurrentQuestion = useCallback(() => {
    if (!socketRef.current || !connected) {
      console.error('Cannot request question: not connected');
      return;
    }

    console.log(
      'Explicitly requesting current question for room:',
      roomCodeRef.current
    );
    socketRef.current.emit('request_current_question', {
      roomCode: roomCodeRef.current,
    });

    // Añadir un tiempo de espera para volver a intentar si no recibimos respuesta
    setTimeout(() => {
      if (!currentQuestion) {
        console.log('No question received after timeout, requesting again');
        if (socketRef.current && connected) {
          socketRef.current.emit('request_current_question', {
            roomCode: roomCodeRef.current,
          });
        }
      }
    }, 3000);
  }, [connected, currentQuestion]);

  // Request next question
  const requestNextQuestion = useCallback(() => {
    if (!socketRef.current || !connected) {
      console.error('Cannot request next question: not connected');
      return;
    }

    console.log('Requesting next question for room:', roomCodeRef.current);
    socketRef.current.emit('request_next_question', {
      roomCode: roomCodeRef.current,
    });

    // Resetear estados para la siguiente pregunta
    setAnswerSubmitted(false);
    setQuestionEnded(false);
    setCorrectAnswer(null);
    setCurrentQuestion(null);

    // Tiempo de espera para volver a intentar si no recibimos la siguiente pregunta
    setTimeout(() => {
      if (!currentQuestion && connected && socketRef.current) {
        console.log('No new question received after timeout, requesting again');
        socketRef.current.emit('request_next_question', {
          roomCode: roomCodeRef.current,
        });
      }
    }, 5000);
  }, [connected, currentQuestion]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (!socketRef.current || !connected) {
      console.error('Cannot leave room: not connected');
      return;
    }

    socketRef.current.emit('leave_room', { roomCode: roomCodeRef.current });
  }, [connected]);

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

  // Función para enviar comandos del controlador
  const sendControllerCommand = useCallback(
    (action, direction, additionalData = {}) => {
      if (!socketRef.current || !connected) {
        console.error('No se puede enviar comando: no hay conexión');
        return false;
      }

      console.log(`📱 Enviando comando: ${action}`, {
        direction,
        ...additionalData,
      });

      // Incluir el screen actual para que la app web sepa a qué pantalla va dirigido
      socketRef.current.emit('send_controller_command', {
        roomCode: roomCodeRef.current,
        action,
        direction,
        targetScreen: currentScreen,
        ...additionalData,
      });

      // Vibración para feedback táctil
      Vibration.vibrate(30);
      return true;
    },
    [connected, currentScreen]
  );

  return {
    socket: socketRef.current, // Esta línea es clave
    connected,
    error,
    players,
    isReady,
    gameStarted,
    currentQuestion,
    gameStatus,
    selectedCategory,
    selectedCategoryType,
    timeLeft,
    questionEnded,
    setQuestionEnded,
    correctAnswer,
    gamePhase,
    selectionComplete,
    answerSubmitted,
    toggleReady,
    submitAnswer,
    requestCurrentQuestion,
    requestNextQuestion,
    leaveRoom,
    retryConnection,
    serverUrl: getServerUrl(),
    currentScreen,
    availableOptions,
    sendControllerCommand,
    setCorrectAnswer,
  };
}
